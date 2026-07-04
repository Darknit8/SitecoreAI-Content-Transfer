import { describe, it, expect, vi } from "vitest";
import { TransferOrchestrator } from "../lib/orchestrator";
import { OrchestratorEvent } from "../lib/types";

describe("TransferOrchestrator", () => {
  const mockSourceConfig = {
    host: "source.mock",
    clientId: "client-id",
    clientSecret: "client-secret",
  };
  const mockDestConfig = {
    host: "dest.mock",
    clientId: "client-id",
    clientSecret: "client-secret",
  };

  it("should execute mock simulation flow and emit correct events", async () => {
    const orchestrator = new TransferOrchestrator(mockSourceConfig, mockDestConfig);
    const events: OrchestratorEvent[] = [];

    orchestrator.on((event) => {
      events.push(event);
    });

    vi.useFakeTimers();

    const runPromise = orchestrator.run({
      dataTrees: [{ itemPath: "/sitecore/content/Home" }],
      database: "master",
    });

    await vi.runAllTimersAsync();

    const transferId = await runPromise;
    expect(transferId).toBeDefined();

    expect(events.length).toBeGreaterThan(0);
    expect(events[0].type).toBe("transfer:created");
    expect(events[events.length - 1].type).toBe("transfer:complete");

    vi.useRealTimers();
  });

  it("should abort execution if signal is aborted", async () => {
    const orchestrator = new TransferOrchestrator(mockSourceConfig, mockDestConfig);
    const controller = new AbortController();
    const events: OrchestratorEvent[] = [];

    orchestrator.on((event) => {
      events.push(event);
    });

    vi.useFakeTimers();

    const runPromise = orchestrator.run(
      {
        dataTrees: [{ itemPath: "/sitecore/content/Home" }],
        database: "master",
      },
      {
        signal: controller.signal,
      }
    );

    const handledPromise = expect(runPromise).rejects.toThrow();

    await vi.advanceTimersByTimeAsync(1500);
    controller.abort();

    await vi.runAllTimersAsync();

    await handledPromise;

    const errorEvent = events.find((e) => e.type === "transfer:error");
    expect(errorEvent).toBeDefined();

    vi.useRealTimers();
  });
});
