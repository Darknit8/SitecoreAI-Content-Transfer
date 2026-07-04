import { OrchestratorEvent } from "./types";

export interface TransferProgress {
  id: string;
  state: "running" | "completed" | "failed";
  events: OrchestratorEvent[];
  startedAt: string;
}

export interface MockHistoryRecord {
  id: string;
  sourceName: string;
  databaseName: string;
  state: string;
  consumeDate: string;
}

// In-memory mock database for history records
export let mockHistory: MockHistoryRecord[] = [
  {
    id: "consumed.mock.hist.001",
    sourceName: "content_home_backup_2026.raif",
    databaseName: "master",
    state: "Completed",
    consumeDate: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: "consumed.mock.hist.002",
    sourceName: "media_library_assets_v2.raif",
    databaseName: "master",
    state: "Completed",
    consumeDate: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: "consumed.mock.hist.003",
    sourceName: "failed_test_package.raif",
    databaseName: "master",
    state: "Failed",
    consumeDate: new Date(Date.now() - 86400000).toISOString()
  }
];

export function deleteMockHistoryRecord(id: string): boolean {
  const initialLength = mockHistory.length;
  mockHistory = mockHistory.filter(rec => rec.id !== id);
  return mockHistory.length < initialLength;
}

export function addMockHistoryRecord(record: MockHistoryRecord) {
  mockHistory.unshift(record);
}

class TransferStore {
  private runs = new Map<string, TransferProgress>();

  create(id: string): TransferProgress {
    const run: TransferProgress = {
      id,
      state: "running",
      events: [],
      startedAt: new Date().toISOString()
    };
    this.runs.set(id, run);
    return run;
  }

  get(id: string): TransferProgress | undefined {
    return this.runs.get(id);
  }

  addEvent(id: string, event: OrchestratorEvent) {
    const run = this.runs.get(id);
    if (run) {
      run.events.push(event);
      if (event.type === "transfer:complete") {
        run.state = "completed";
        // Dynamically add to mockHistory database when mock runs complete
        addMockHistoryRecord({
          id: `hist.mock.${event.transferId.substring(0, 8)}`,
          sourceName: event.summary.raifFilesGenerated[0] || "content-transfer-migration.raif",
          databaseName: "master",
          state: "Completed",
          consumeDate: new Date().toISOString()
        });
      } else if (event.type === "transfer:error") {
        run.state = "failed";
        addMockHistoryRecord({
          id: `hist.mock.${event.transferId.substring(0, 8)}`,
          sourceName: "failed_transfer_migration.raif",
          databaseName: "master",
          state: "Failed",
          consumeDate: new Date().toISOString()
        });
      }
    }
  }

  list(): TransferProgress[] {
    return Array.from(this.runs.values()).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }
}

export const transferStore = new TransferStore();
export const activeOrchestrators = new Map<string, AbortController>();
export const configStore = {
  source: null as any,
  destination: null as any
};
