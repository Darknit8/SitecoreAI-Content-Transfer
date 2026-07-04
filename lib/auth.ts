import { EnvironmentConfig, SitecoreApiError } from "./types";

interface CachedToken {
  token: string;
  expiresAt: number;
}

export class AuthClient {
  private static tokenCache = new Map<string, CachedToken>();
  
  constructor(private readonly config: EnvironmentConfig) {}

  async getToken(): Promise<string> {
    const cacheKey = `${this.config.host}::${this.config.clientId}`;
    const cached = AuthClient.tokenCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && cached.expiresAt > now + 300000) {
      return cached.token;
    }

    const token = await this.requestToken();
    AuthClient.tokenCache.set(cacheKey, {
      token,
      expiresAt: now + 24 * 60 * 60 * 1000,
    });

    return token;
  }

  clearCache(): void {
    const cacheKey = `${this.config.host}::${this.config.clientId}`;
    AuthClient.tokenCache.delete(cacheKey);
  }

  private async requestToken(): Promise<string> {
    const url = "https://auth.sitecorecloud.io/oauth/token";
    const body = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: "client_credentials",
      audience: "https://api.sitecorecloud.io",
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new SitecoreApiError(
          `Auth failed: ${response.statusText}`,
          response.status,
          url,
          errText
        );
      }

      const data = (await response.json()) as { access_token: string };
      return data.access_token;
    } catch (error) {
      if (error instanceof SitecoreApiError) throw error;
      throw new Error(`Failed to request JWT token: ${(error as Error).message}`);
    }
  }
}
