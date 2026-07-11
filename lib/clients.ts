import { AuthClient } from "./auth";
import {
  CreateTransferConfig,
  TransferStatus,
  ChunkData,
  EnvironmentConfig,
  SitecoreApiError,
  TransferState,
  Scope,
  MergeStrategy,
  ItemTransferState,
  TransferDetails
} from "./types";
import { mockHistory, deleteMockHistoryRecord } from "./store";


// ============================================================================
// Content Transfer API Client
// ============================================================================
export class ContentTransferClient {
  private readonly auth: AuthClient;
  private readonly baseUrl: string;
  private readonly isMock: boolean;

  constructor(config: EnvironmentConfig) {
    this.auth = new AuthClient(config);
    this.baseUrl = config.host.startsWith("http") ? config.host : `https://${config.host}`;
    this.isMock = config.host.includes("mock") || config.host.includes("local");
  }

  private async request(path: string, options: RequestInit = {}): Promise<Response> {
    let token = await this.auth.getToken();
    const url = `${this.baseUrl}${path}`;
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${token}`);
    if (!headers.has("Accept")) headers.set("Accept", "application/json");

    let response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
      this.auth.clearCache();
      token = await this.auth.getToken();
      headers.set("Authorization", `Bearer ${token}`);
      response = await fetch(url, { ...options, headers });
    }
    return response;
  }

  async createTransfer(transferConfig: CreateTransferConfig): Promise<string> {
    if (this.isMock) {
      return transferConfig.transferId || crypto.randomUUID();
    }

    const path = "/sitecore/api/content/transfer/v1/transfers";
    const requestBody = {
      Configuration: {
        DataTrees: transferConfig.dataTrees.map(tree => ({
          ItemPath: tree.itemPath,
          Scope: tree.scope || Scope.SingleItem,
          MergeStrategy: tree.mergeStrategy || MergeStrategy.OverrideExistingItem
        })),
        Database: transferConfig.database || "master"
      },
      TransferId: transferConfig.transferId || crypto.randomUUID()
    };

    const response = await this.request(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (response.status !== 202) {
      const errText = await response.text();
      throw new SitecoreApiError(`Create transfer failed: ${response.statusText}`, response.status, path, errText);
    }
    return requestBody.TransferId;
  }

  async getStatus(transferId: string): Promise<TransferStatus> {
    if (this.isMock) {
      return {
        state: TransferState.Completed,
        chunkSetsMetadata: [
          { chunkSetId: "87654321-4321-4321-4321-cba987654321", chunkCount: 3, totalItemCount: 45 },
          { chunkSetId: "11223344-5566-7788-9900-aabbccddeeff", chunkCount: 2, totalItemCount: 15 }
        ]
      };
    }

    const path = `/sitecore/api/content/transfer/v1/transfers/${transferId}/status`;
    const response = await this.request(path);

    if (!response.ok) {
      const errText = await response.text();
      throw new SitecoreApiError(`Get status failed: ${response.statusText}`, response.status, path, errText);
    }

    const raw = await response.json();
    return {
      state: raw.State as TransferState,
      chunkSetsMetadata: (raw.ChunkSetsMetadata || []).map((meta: any) => ({
        chunkSetId: meta.ChunkSetId,
        chunkCount: meta.ChunkCount,
        totalItemCount: meta.TotalItemCount
      }))
    };
  }

  async getChunk(transferId: string, chunksetId: string, chunkId: number): Promise<ChunkData> {
    if (this.isMock) {
      return {
        stream: Buffer.from("mock-binary-data"),
        metadata: { itemsProcessed: 12, itemsSkipped: 0, isMedia: false }
      };
    }

    const path = `/sitecore/api/content/transfer/v1/transfers/${transferId}/chunksets/${chunksetId}/chunks/${chunkId}`;
    const response = await this.request(path, {
      method: "GET",
      headers: { "Accept": "application/octet-stream" }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new SitecoreApiError(`Get chunk failed: ${response.statusText}`, response.status, path, errText);
    }

    const contentDisposition = response.headers.get("Content-Disposition") || "";
    const itemsProcessedMatch = /ItemsProcessed=(\d+)/i.exec(contentDisposition);
    const itemsSkippedMatch = /ItemsSkipped=(\d+)/i.exec(contentDisposition);
    const isMediaMatch = /IsMedia=(true|false)/i.exec(contentDisposition);

    const itemsProcessed = itemsProcessedMatch ? parseInt(itemsProcessedMatch[1], 10) : 0;
    const itemsSkipped = itemsSkippedMatch ? parseInt(itemsSkippedMatch[1], 10) : 0;
    const isMedia = isMediaMatch ? isMediaMatch[1].toLowerCase() === "true" : false;

    const arrayBuffer = await response.arrayBuffer();
    const stream = Buffer.from(arrayBuffer.slice(0));

    return {
      stream,
      metadata: { itemsProcessed, itemsSkipped, isMedia }
    };
  }

  async saveChunk(
    transferId: string,
    chunksetId: string,
    chunkId: number,
    chunkBody: ReadableStream<Uint8Array> | Buffer | ArrayBuffer | Blob,
    isMedia: boolean
  ): Promise<void> {
    if (this.isMock) return;

    const path = `/sitecore/api/content/transfer/v1/transfers/${transferId}/chunksets/${chunksetId}/chunks/${chunkId}?isMedia=${isMedia}`;
    const response = await this.request(path, {
      method: "PUT",
      headers: { "Content-Type": "application/octet-stream" },
      body: chunkBody as any,
      // @ts-ignore
      duplex: "half"
    });

    if (response.status !== 201) {
      const errText = await response.text();
      throw new SitecoreApiError(`Save chunk failed: ${response.statusText}`, response.status, path, errText);
    }
  }

  async completeChunkSet(transferId: string, chunksetId: string): Promise<string> {
    if (this.isMock) {
      return `content-transfer-mock-${chunksetId.substring(0, 8)}.raif`;
    }

    const path = `/sitecore/api/content/transfer/v1/transfers/${transferId}/chunksets/${chunksetId}/complete`;
    const response = await this.request(path, { method: "POST" });

    if (!response.ok) {
      const errText = await response.text();
      throw new SitecoreApiError(`Complete chunkset failed: ${response.statusText}`, response.status, path, errText);
    }

    const raw = await response.json();
    return raw.ContentTransferFileName;
  }

  async deleteTransfer(transferId: string): Promise<void> {
    if (this.isMock) return;

    const path = `/sitecore/api/content/transfer/v1/transfers/${transferId}`;
    const response = await this.request(path, { method: "DELETE" });

    if (response.status !== 202) {
      const errText = await response.text();
      throw new SitecoreApiError(`Delete transfer failed: ${response.statusText}`, response.status, path, errText);
    }
  }
}

function normalizeItemTransferState(state: string): ItemTransferState {
  if (!state) return "Unknown" as ItemTransferState;
  const s = state.trim().toLowerCase();
  if (s === "finished" || s === "completed") return ItemTransferState.Completed;
  if (s === "failed") return ItemTransferState.Failed;
  if (s === "inprogress") return ItemTransferState.InProgress;
  if (s === "queued") return ItemTransferState.Queued;
  return state as ItemTransferState;
}

// ============================================================================
// Item Transfer API Client
// ============================================================================
export class ItemTransferClient {
  private readonly auth: AuthClient;
  private readonly baseUrl: string;
  private readonly isMock: boolean;

  constructor(config: EnvironmentConfig) {
    this.auth = new AuthClient(config);
    const hostUrl = config.host.startsWith("http") ? config.host : `https://${config.host}`;
    this.baseUrl = `${hostUrl}/sitecore/shell/api/v3/ItemsTransfer`;
    this.isMock = config.host.includes("mock") || config.host.includes("local");
  }

  private async request(path: string, options: RequestInit = {}): Promise<Response> {
    let token = await this.auth.getToken();
    const url = `${this.baseUrl}${path}`;
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${token}`);
    if (!headers.has("Accept")) headers.set("Accept", "application/json");

    let response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
      this.auth.clearCache();
      token = await this.auth.getToken();
      headers.set("Authorization", `Bearer ${token}`);
      response = await fetch(url, { ...options, headers });
    }
    return response;
  }

  async listTransfers(page = 1, pageSize = 50): Promise<any> {
    if (this.isMock) {
      return {
        page,
        pageSize,
        totalCount: 2,
        transfers: [
          {
            id: "consumed.mock.001",
            sourceName: "content-transfer-mock-87654321.raif",
            databaseName: "master",
            state: ItemTransferState.Completed,
            consumeDate: new Date().toISOString()
          },
          {
            id: "consumed.mock.002",
            sourceName: "content-transfer-mock-11223344.raif",
            databaseName: "master",
            state: ItemTransferState.InProgress,
            consumeDate: new Date().toISOString()
          }
        ]
      };
    }

    const path = `/transfers?page=${page}&pageSize=${pageSize}`;
    const response = await this.request(path);

    if (!response.ok) {
      const errText = await response.text();
      throw new SitecoreApiError(`List transfers failed: ${response.statusText}`, response.status, path, errText);
    }

    const raw = await response.json();
    return {
      page: raw.Page,
      pageSize: raw.PageSize,
      totalCount: raw.TotalCount,
      transfers: (raw.Transfers || []).map((t: any) => ({
        id: t.Id,
        sourceName: t.SourceName,
        databaseName: t.DatabaseName,
        state: normalizeItemTransferState(t.State || t.TransferState),
        consumeDate: t.ConsumeDate || t.ConsumedDate
      }))
    };
  }

  async getTransfer(transferId: string): Promise<TransferDetails> {
    if (this.isMock) {
      return {
        id: transferId,
        sourceName: "content-transfer-mock-87654321.raif",
        databaseName: "master",
        state: ItemTransferState.Completed,
        consumeDate: new Date().toISOString(),
        totalItems: 60,
        processedItems: 60,
        skippedItems: 0,
        failedItems: 0,
        errors: [],
        warnings: []
      };
    }

    const path = `/transfers/${encodeURIComponent(transferId)}`;
    const response = await this.request(path);

    if (!response.ok) {
      const errText = await response.text();
      throw new SitecoreApiError(`Get transfer details failed: ${response.statusText}`, response.status, path, errText);
    }

    const raw = await response.json();
    return {
      id: raw.Id,
      sourceName: raw.SourceName,
      databaseName: raw.DatabaseName,
      state: normalizeItemTransferState(raw.State || raw.TransferState),
      consumeDate: raw.ConsumeDate || raw.ConsumedDate,
      totalItems: raw.TotalItems || raw.TotalItemsCount || 0,
      processedItems: raw.ProcessedItems || raw.TransferredItemsCount || 0,
      skippedItems: raw.SkippedItems || 0,
      failedItems: raw.FailedItems || 0,
      errors: raw.Errors || raw.ValidationErrors || [],
      warnings: raw.Warnings || []
    };
  }

  async startConsume(databaseName: string, options: { fileName?: string; blobName?: string }): Promise<string> {
    if (this.isMock) {
      return `https://localhost/mock/location/history/mock-ingestion`;
    }

    const params = new URLSearchParams();
    if (options.fileName) params.set("fileName", options.fileName);
    if (options.blobName) params.set("blobName", options.blobName);

    const path = `/transfers/databases/${databaseName}/sources?${params.toString()}`;
    const response = await this.request(path, { method: "POST" });

    if (response.status !== 202) {
      const errText = await response.text();
      throw new SitecoreApiError(`Start consume failed: ${response.statusText}`, response.status, path, errText);
    }
    return response.headers.get("Location") || "";
  }

  async retryFailed(databaseName: string): Promise<any> {
    if (this.isMock) {
      return { Message: "Successfully re-queued 0 failed files in Mock Mode." };
    }

    const path = `/transfers/databases/${databaseName}/sources`;
    const response = await this.request(path, { method: "PUT" });

    if (!response.ok) {
      const errText = await response.text();
      throw new SitecoreApiError(`Retry failed: ${response.statusText}`, response.status, path, errText);
    }
    return response.json();
  }

  async listBlobSources(page = 1, pageSize = 50): Promise<any> {
    if (this.isMock) {
      return {
        page,
        pageSize,
        totalCount: 3,
        sources: [
          { name: "content_home_backup_2026.raif", size: 1048576 * 14.5, lastModified: new Date().toISOString(), state: "Transferred" },
          { name: "media_library_assets_v2.raif", size: 1048576 * 48.2, lastModified: new Date().toISOString(), state: "Uploaded" },
          { name: "mock_test_sandbox_data.raif", size: 1024 * 512, lastModified: new Date().toISOString(), state: "Transferred" }
        ]
      };
    }

    const path = `/sources/blobs?page=${page}&pageSize=${pageSize}`;
    const response = await this.request(path);

    if (!response.ok) {
      const errText = await response.text();
      throw new SitecoreApiError(`List blob sources failed: ${response.statusText}`, response.status, path, errText);
    }
    const raw = await response.json();
    return {
      page: raw.Page,
      pageSize: raw.PageSize,
      totalCount: raw.TotalCount,
      sources: (raw.Sources || []).map((src: any) => ({
        name: src.Name,
        size: src.Size || 0,
        lastModified: src.LastModified || new Date().toISOString(),
        state: src.BlobState || "Unknown"
      }))
    };
  }

  async listFileSources(page = 1, pageSize = 50): Promise<any> {
    if (this.isMock) {
      return {
        page,
        pageSize,
        totalCount: 2,
        sources: [
          { name: "local_cms_backup_001.raif", size: 1048576 * 8.4, lastModified: new Date().toISOString(), state: "Transferred" },
          { name: "local_cms_backup_002.raif", size: 1048576 * 12.1, lastModified: new Date().toISOString(), state: "Uploaded" }
        ]
      };
    }

    const path = `/sources/files?page=${page}&pageSize=${pageSize}`;
    const response = await this.request(path);

    if (!response.ok) {
      const errText = await response.text();
      throw new SitecoreApiError(`List file sources failed: ${response.statusText}`, response.status, path, errText);
    }
    const raw = await response.json();
    return {
      page: raw.Page,
      pageSize: raw.PageSize,
      totalCount: raw.TotalCount,
      sources: (raw.Sources || []).map((src: any) => ({
        name: src.FileName || src.Name || "",
        size: src.Size || 0,
        lastModified: src.LastModified || new Date().toISOString(),
        state: src.FileState || src.State || "Unknown"
      }))
    };
  }

  async getHistory(page = 1, pageSize = 50): Promise<any> {
    if (this.isMock) {
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      return {
        page,
        pageSize,
        totalCount: mockHistory.length,
        records: mockHistory.slice(start, end)
      };
    }

    const path = `/history?page=${page}&pageSize=${pageSize}`;
    const response = await this.request(path);

    if (!response.ok) {
      const errText = await response.text();
      throw new SitecoreApiError(`Get history failed: ${response.statusText}`, response.status, path, errText);
    }
    const raw = await response.json();
    const records = raw.Sources || raw.Records || [];
    return {
      page: raw.Page,
      pageSize: raw.PageSize,
      totalCount: raw.TotalCount,
      records: records.map((rec: any) => {
        let state = rec.State || rec.TransferState;
        if (!state && Array.isArray(rec.Events) && rec.Events.length > 0) {
          const sortedEvents = [...rec.Events].sort(
            (a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime()
          );
          const latestEvent = sortedEvents[sortedEvents.length - 1];
          if (latestEvent.Name === "Finished") {
            state = "Completed";
          } else if (latestEvent.Name === "Failed") {
            state = "Failed";
          } else {
            state = latestEvent.Name;
          }
        }
        return {
          id: rec.Name || rec.Id || "unknown",
          sourceName: rec.SourceName || "",
          databaseName: rec.DatabaseName || "master",
          state: state || "Completed",
          consumeDate: rec.ConsumeDate || rec.ConsumedDate || new Date().toISOString()
        };
      })
    };
  }

  async deleteHistoryRecord(id: string): Promise<void> {
    if (this.isMock) {
      deleteMockHistoryRecord(id);
      return;
    }

    const path = `/history/${encodeURIComponent(id)}`;
    const response = await this.request(path, { method: "DELETE" });

    if (response.status !== 202 && response.status !== 200 && response.status !== 204) {
      const errText = await response.text();
      throw new SitecoreApiError(`Delete history record failed: ${response.statusText}`, response.status, path, errText);
    }
  }

  async deleteBlobSource(blobName: string): Promise<void> {
    if (this.isMock) {
      return;
    }

    const path = `/sources/blobs/${encodeURIComponent(blobName)}`;
    const response = await this.request(path, { method: "DELETE" });

    if (response.status !== 202 && response.status !== 200 && response.status !== 204) {
      const errText = await response.text();
      throw new SitecoreApiError(`Delete blob source failed: ${response.statusText}`, response.status, path, errText);
    }
  }

  async deleteFileSource(fileName: string): Promise<void> {
    // Filesystem deletion is not supported by the Item Transfer API spec directly.
    // In Mock/Local mode, we can succeed.
    if (this.isMock) {
      return;
    }
  }
}
