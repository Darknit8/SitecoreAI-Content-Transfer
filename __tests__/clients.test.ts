import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ContentTransferClient, ItemTransferClient } from "../lib/clients";
import { AuthClient } from "../lib/auth";
import { SitecoreApiError } from "../lib/types";

vi.mock("../lib/auth", () => {
  return {
    AuthClient: class {
      getToken = vi.fn().mockResolvedValue("test-token");
      clearCache = vi.fn();
    },
  };
});

describe("ContentTransferClient", () => {
  describe("Mock Mode", () => {
    const config = {
      host: "source.mock",
      clientId: "client-id",
      clientSecret: "client-secret",
    };
    const client = new ContentTransferClient(config);

    it("should resolve transfer status in mock mode", async () => {
      const status = await client.getStatus("some-transfer-id");
      expect(status.state).toBe("Completed");
      expect(status.chunkSetsMetadata).toHaveLength(2);
    });

    it("should return chunk in mock mode", async () => {
      const chunk = await client.getChunk("trans-id", "set-id", 0);
      expect(chunk.stream.toString()).toBe("mock-binary-data");
      expect(chunk.metadata.itemsProcessed).toBe(12);
    });
  });

  describe("Live Mode", () => {
    const config = {
      host: "api.sitecore.com",
      clientId: "client-id",
      clientSecret: "client-secret",
    };
    let client: ContentTransferClient;

    beforeEach(() => {
      client = new ContentTransferClient(config);
      vi.stubGlobal("fetch", vi.fn());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("should send create transfer request correctly", async () => {
      const fetchMock = vi.mocked(fetch).mockResolvedValue({
        status: 202,
        ok: true,
      } as Response);

      const transferId = await client.createTransfer({
        dataTrees: [{ itemPath: "/sitecore/content/Home" }],
        database: "master",
      });

      expect(transferId).toBeDefined();
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.sitecore.com/sitecore/api/content/transfer/v1/transfers",
        expect.objectContaining({
          method: "POST",
          headers: expect.any(Headers),
          body: expect.stringContaining("/sitecore/content/Home"),
        })
      );
    });

    it("should throw SitecoreApiError on error responses", async () => {
      vi.mocked(fetch).mockResolvedValue({
        status: 500,
        statusText: "Internal Server Error",
        ok: false,
        text: async () => "DB error",
      } as Response);

      await expect(
        client.createTransfer({ dataTrees: [], database: "master" })
      ).rejects.toThrow(SitecoreApiError);
    });
  });
});

describe("ItemTransferClient", () => {
  describe("Mock Mode", () => {
    const config = {
      host: "dest.mock",
      clientId: "client-id",
      clientSecret: "client-secret",
    };
    const client = new ItemTransferClient(config);

    it("should retrieve history in mock mode", async () => {
      const history = await client.getHistory();
      expect(history.records).toBeDefined();
      expect(history.records.length).toBeGreaterThan(0);
    });
  });
});
