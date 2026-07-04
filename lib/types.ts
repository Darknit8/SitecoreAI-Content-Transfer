// ---------------------------------------------------------------------------
// Common Configurations
// ---------------------------------------------------------------------------

export interface EnvironmentConfig {
  host: string;
  clientId: string;
  clientSecret: string;
}

// ---------------------------------------------------------------------------
// Content Transfer API
// ---------------------------------------------------------------------------

export enum Scope {
  SingleItem = "SingleItem",
  ItemAndDescendants = "ItemAndDescendants",
}

export enum MergeStrategy {
  OverrideExistingItem = "OverrideExistingItem",
  KeepExistingItem = "KeepExistingItem",
  LatestWin = "LatestWin",
  OverrideExistingTree = "OverrideExistingTree",
}

export interface DataTree {
  itemPath: string;
  scope?: Scope;
  mergeStrategy?: MergeStrategy;
}

export interface CreateTransferConfig {
  transferId?: string;
  dataTrees: DataTree[];
  database?: string;
}

export enum TransferState {
  Running = "Running",
  Completed = "Completed",
  Failed = "Failed",
  NotFound = "NotFound",
}

export interface ChunkSetMetadata {
  chunkSetId: string;
  chunkCount: number;
  totalItemCount: number;
}

export interface TransferStatus {
  state: TransferState;
  chunkSetsMetadata: ChunkSetMetadata[];
}

export interface ChunkMetadata {
  itemsProcessed: number;
  itemsSkipped: number;
  isMedia: boolean;
}

export interface ChunkData {
  stream: ReadableStream<Uint8Array> | Buffer;
  metadata: ChunkMetadata;
}

// ---------------------------------------------------------------------------
// Item Transfer API
// ---------------------------------------------------------------------------

export enum ItemTransferState {
  Queued = "Queued",
  InProgress = "InProgress",
  Completed = "Completed",
  Failed = "Failed",
}

export interface TransferStatusResult {
  id: string;
  sourceName: string;
  databaseName: string;
  state: ItemTransferState;
  consumeDate: string;
}

export interface TransferDetails {
  id: string;
  sourceName: string;
  databaseName: string;
  state: ItemTransferState;
  consumeDate: string;
  totalItems: number;
  processedItems: number;
  skippedItems: number;
  failedItems: number;
  errors: string[];
  warnings: string[];
}

export interface BlobSource {
  name: string;
  size: number;
  lastModified: string;
}

export interface FileSource {
  name: string;
  size: number;
  lastModified: string;
}

export interface HistoryRecord {
  id: string;
  sourceName: string;
  databaseName: string;
  state: string;
  consumeDate: string;
}

// ---------------------------------------------------------------------------
// Orchestrator & Events
// ---------------------------------------------------------------------------

export type OrchestratorEventType =
  | "transfer:created"
  | "transfer:polling"
  | "transfer:ready"
  | "chunk:fetching"
  | "chunk:transferred"
  | "chunkset:completed"
  | "consume:started"
  | "consume:polling"
  | "consume:completed"
  | "cleanup:done"
  | "transfer:complete"
  | "transfer:error";

export interface OrchestratorEvent {
  type: OrchestratorEventType;
  timestamp: string;
  transferId: string;
  [key: string]: any;
}

export class SitecoreApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly endpoint: string,
    public readonly responseBody?: string
  ) {
    super(message);
    this.name = "SitecoreApiError";
  }
}
