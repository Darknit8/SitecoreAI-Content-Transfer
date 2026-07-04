import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AuthClient } from "../lib/auth";

describe("AuthClient", () => {
  const config = {
    host: "test.sitecore.com",
    clientId: "test-client-id",
    clientSecret: "test-client-secret",
  };

  let client: AuthClient;

  beforeEach(() => {
    client = new AuthClient(config);
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    client.clearCache();
  });

  it("should request a token successfully and cache it", async () => {
    const mockToken = "mocked-jwt-token";
    const fetchMock = vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ access_token: mockToken }),
    } as Response);

    const token = await client.getToken();
    expect(token).toBe(mockToken);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Call again to verify caching (fetch should not be called again)
    const token2 = await client.getToken();
    expect(token2).toBe(mockToken);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("should bypass cache if cache is cleared", async () => {
    const mockToken1 = "token-1";
    const mockToken2 = "token-2";
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ access_token: mockToken1 }),
    } as Response);

    await client.getToken();

    client.clearCache();

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ access_token: mockToken2 }),
    } as Response);

    const token2 = await client.getToken();
    expect(token2).toBe(mockToken2);
  });

  it("should throw an error if the auth request fails", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: async () => "Invalid client credentials",
    } as Response);

    await expect(client.getToken()).rejects.toThrow("Auth failed: Bad Request");
  });
});
