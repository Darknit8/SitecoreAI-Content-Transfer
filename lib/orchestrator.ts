import { ContentTransferClient, ItemTransferClient } from "./clients";
import {
  CreateTransferConfig,
  EnvironmentConfig,
  OrchestratorEvent,
  TransferState,
  ItemTransferState,
  ChunkSetMetadata
} from "./types";

export type OrchestratorListener = (event: OrchestratorEvent) => void;

export class TransferOrchestrator {
  private readonly sourceClient: ContentTransferClient;
  private readonly destContentClient: ContentTransferClient;
  private readonly destItemClient: ItemTransferClient;
  private readonly listeners = new Set<OrchestratorListener>();
  private readonly isMock: boolean;

  constructor(sourceConfig: EnvironmentConfig, destConfig: EnvironmentConfig) {
    this.sourceClient = new ContentTransferClient(sourceConfig);
    this.destContentClient = new ContentTransferClient(destConfig);
    this.destItemClient = new ItemTransferClient(destConfig);
    this.isMock = 
      sourceConfig.host.includes("mock") || 
      sourceConfig.host.includes("local") ||
      destConfig.host.includes("mock") ||
      destConfig.host.includes("local");
  }

  on(listener: OrchestratorListener): this {
    this.listeners.add(listener);
    return this;
  }

  off(listener: OrchestratorListener): this {
    this.listeners.delete(listener);
    return this;
  }

  private emit(event: OrchestratorEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error("Error in orchestrator event listener:", err);
      }
    });
  }

  private createEvent(type: OrchestratorEvent["type"], transferId: string, extra: Record<string, any> = {}): OrchestratorEvent {
    return {
      type,
      transferId,
      timestamp: new Date().toISOString(),
      ...extra
    };
  }

  async run(
    transferConfig: CreateTransferConfig,
    options: {
      database?: string;
      pollIntervalMs?: number;
      maxPollAttempts?: number;
      signal?: AbortSignal;
    } = {}
  ): Promise<string> {
    const startMs = Date.now();
    const database = options.database || "master";
    const signal = options.signal;

    const transferId = transferConfig.transferId || crypto.randomUUID();

    if (this.isMock) {
      return this.runMockSimulation(transferId, transferConfig, database, signal);
    }

    const pollIntervalMs = options.pollIntervalMs || 3000;
    const maxPollAttempts = options.maxPollAttempts || 200;

    try {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

      // 1. Create transfer
      await this.sourceClient.createTransfer(transferConfig);
      this.emit(this.createEvent("transfer:created", transferId));

      // 2. Poll source until Complete
      let status = await this.sourceClient.getStatus(transferId);
      let attempts = 0;

      while (status.state === TransferState.Running) {
        if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
        attempts++;
        if (attempts > maxPollAttempts) throw new Error("Timeout waiting for source to package content.");

        this.emit(this.createEvent("transfer:polling", transferId, { state: status.state }));
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        status = await this.sourceClient.getStatus(transferId);
      }

      if (status.state === TransferState.Failed) {
        throw new Error("Content packaging failed on source environment.");
      }

      const totalItems = status.chunkSetsMetadata.reduce((sum, cs) => sum + cs.totalItemCount, 0);
      this.emit(this.createEvent("transfer:ready", transferId, {
        chunkSets: status.chunkSetsMetadata,
        totalItems
      }));

      // 3. Stream chunks
      const raifFiles: string[] = [];
      let currentSetIdx = 0;

      for (const chunkSet of status.chunkSetsMetadata) {
        if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

        const raifFile = await this.transferChunkSet(
          transferId,
          chunkSet,
          currentSetIdx,
          status.chunkSetsMetadata.length,
          signal
        );
        raifFiles.push(raifFile);
        currentSetIdx++;
      }

      // 4. Cleanup source
      await this.sourceClient.deleteTransfer(transferId);
      this.emit(this.createEvent("cleanup:done", transferId));

      // 5. Ingest on destination
      let totalConsumed = 0;
      let totalFailed = 0;

      for (const file of raifFiles) {
        if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

        const stats = await this.consumeRaifFile(
          file,
          database,
          transferId,
          pollIntervalMs,
          maxPollAttempts,
          signal
        );
        totalConsumed += stats.processed;
        totalFailed += stats.failed;
      }

      // 6. Complete
      this.emit(this.createEvent("transfer:complete", transferId, {
        summary: {
          transferId,
          chunkSetsTransferred: raifFiles.length,
          raifFilesGenerated: raifFiles,
          totalItemsTransferred: totalConsumed,
          totalItemsFailed: totalFailed,
          durationMs: Date.now() - startMs
        }
      }));

      return transferId;
    } catch (err) {
      const error = err as Error;
      this.emit(this.createEvent("transfer:error", transferId, {
        error: { message: error.message },
        phase: "execution"
      }));
      throw error;
    }
  }

  /**
   * Simulated execution pipeline for testing UI offline
   */
  private async runMockSimulation(
    transferId: string,
    config: CreateTransferConfig,
    database: string,
    signal?: AbortSignal
  ): Promise<string> {
    const startMs = Date.now();
    const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

    try {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

      // 1. Initialized
      await sleep(1000);
      this.emit(this.createEvent("transfer:created", transferId));

      // 2. Packaging
      await sleep(1500);
      this.emit(this.createEvent("transfer:polling", transferId, { state: "Running" }));
      await sleep(1500);
      
      const mockMetadata: ChunkSetMetadata[] = [
        { chunkSetId: "87654321-4321-4321-4321-cba987654321", chunkCount: 3, totalItemCount: 45 },
        { chunkSetId: "11223344-5566-7788-9900-aabbccddeeff", chunkCount: 2, totalItemCount: 15 }
      ];
      this.emit(this.createEvent("transfer:ready", transferId, {
        chunkSets: mockMetadata,
        totalItems: 60
      }));

      // 3. Streaming Chunks
      let index = 0;
      const raifFiles: string[] = [];
      for (const set of mockMetadata) {
        for (let chunkId = 0; chunkId < set.chunkCount; chunkId++) {
          if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
          
          this.emit(this.createEvent("chunk:fetching", transferId, {
            chunkSetId: set.chunkSetId,
            chunkId,
            chunkSetIndex: index,
            totalChunkSets: mockMetadata.length
          }));
          
          await sleep(600); // chunk latency simulation

          this.emit(this.createEvent("chunk:transferred", transferId, {
            chunkSetId: set.chunkSetId,
            chunkId,
            isMedia: false,
            itemsProcessed: chunkId === 0 ? 15 : 10,
            itemsSkipped: 0
          }));
        }
        
        const fileName = `content-transfer-mock-${set.chunkSetId.substring(0, 8)}.raif`;
        raifFiles.push(fileName);

        this.emit(this.createEvent("chunkset:completed", transferId, {
          chunkSetId: set.chunkSetId,
          raifFileName: fileName,
          chunkSetIndex: index,
          totalChunkSets: mockMetadata.length
        }));
        
        index++;
        await sleep(500);
      }

      // 4. Source Cleanup
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      await sleep(800);
      this.emit(this.createEvent("cleanup:done", transferId));

      // 5. Destination Ingestion
      for (const file of raifFiles) {
        if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
        
        this.emit(this.createEvent("consume:started", transferId, {
          raifFileName: file,
          database
        }));

        await sleep(1000);
        this.emit(this.createEvent("consume:polling", transferId, {
          state: "InProgress",
          processedItems: 20,
          totalItems: 60
        }));

        await sleep(1200);
        this.emit(this.createEvent("consume:polling", transferId, {
          state: "InProgress",
          processedItems: 45,
          totalItems: 60
        }));

        await sleep(1000);
        this.emit(this.createEvent("consume:completed", transferId, {
          raifFileName: file,
          processedItems: 60,
          failedItems: 0
        }));
      }

      // 6. Complete
      this.emit(this.createEvent("transfer:complete", transferId, {
        summary: {
          transferId,
          chunkSetsTransferred: raifFiles.length,
          raifFilesGenerated: raifFiles,
          totalItemsTransferred: 60,
          totalItemsFailed: 0,
          durationMs: Date.now() - startMs
        }
      }));

      return transferId;
    } catch (err) {
      const error = err as Error;
      this.emit(this.createEvent("transfer:error", transferId, {
        error: { message: error.message },
        phase: "mock-simulation"
      }));
      throw error;
    }
  }

  private async transferChunkSet(
    transferId: string,
    chunkSet: ChunkSetMetadata,
    index: number,
    totalSets: number,
    signal?: AbortSignal
  ): Promise<string> {
    const { chunkSetId, chunkCount } = chunkSet;

    for (let chunkId = 0; chunkId < chunkCount; chunkId++) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

      this.emit(this.createEvent("chunk:fetching", transferId, {
        chunkSetId,
        chunkId,
        chunkSetIndex: index,
        totalChunkSets: totalSets
      }));

      const chunk = await this.sourceClient.getChunk(transferId, chunkSetId, chunkId);
      
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

      await this.destContentClient.saveChunk(
        transferId,
        chunkSetId,
        chunkId,
        chunk.stream,
        chunk.metadata.isMedia
      );

      this.emit(this.createEvent("chunk:transferred", transferId, {
        chunkSetId,
        chunkId,
        isMedia: chunk.metadata.isMedia,
        itemsProcessed: chunk.metadata.itemsProcessed,
        itemsSkipped: chunk.metadata.itemsSkipped
      }));
    }

    const filename = await this.destContentClient.completeChunkSet(transferId, chunkSetId);
    
    this.emit(this.createEvent("chunkset:completed", transferId, {
      chunkSetId,
      raifFileName: filename,
      chunkSetIndex: index,
      totalChunkSets: totalSets
    }));

    return filename;
  }

  private async consumeRaifFile(
    fileName: string,
    database: string,
    transferId: string,
    pollIntervalMs: number,
    maxPollAttempts: number,
    signal?: AbortSignal
  ): Promise<{ processed: number; failed: number }> {
    this.emit(this.createEvent("consume:started", transferId, { raifFileName: fileName, database }));

    await this.destItemClient.startConsume(database, { fileName });

    let completed = false;
    let attempts = 0;
    let processed = 0;
    let failed = 0;

    while (!completed) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      attempts++;
      if (attempts > maxPollAttempts) throw new Error(`Consume timeout for: ${fileName}`);

      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));

      const page = await this.destItemClient.listTransfers(1, 50);
      const transfer = page.transfers.find((t: any) => t.sourceName === fileName);

      if (!transfer) {
        const history = await this.destItemClient.getHistory(1, 10);
        const record = history.records.find((r: any) => r.sourceName === fileName);
        if (record) {
          completed = true;
          if (record.state === "Failed") throw new Error(`Inward ingestion failed for source: ${fileName}`);
          break;
        }
        continue;
      }

      this.emit(this.createEvent("consume:polling", transferId, {
        state: transfer.state,
        processedItems: processed,
        totalItems: 0
      }));

      if (transfer.state === ItemTransferState.Completed || transfer.state === ItemTransferState.Failed) {
        completed = true;
        try {
          const details = await this.destItemClient.getTransfer(transfer.id);
          processed = details.processedItems;
          failed = details.failedItems;
        } catch (_) {}

        if (transfer.state === ItemTransferState.Failed) {
          throw new Error(`Inward ingestion failed for package: ${fileName}`);
        }
      }
    }

    this.emit(this.createEvent("consume:completed", transferId, { raifFileName: fileName, processedItems: processed, failedItems: failed }));
    return { processed, failed };
  }
}
