import type { SpotifyTokenResponse } from "./types";

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const REFRESH_BUFFER_MS = 60_000;

type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;

function getCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("Spotify is not configured.");
  }

  return { clientId, clientSecret };
}

export function assertSpotifyConfigured(): void {
  getCredentials();
}

async function fetchAccessToken(): Promise<TokenCache> {
  const { clientId, clientSecret } = getCredentials();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error("Failed to authenticate with Spotify.");
  }

  const data = (await response.json()) as SpotifyTokenResponse;

  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

export async function getAccessToken(): Promise<string> {
  if (
    tokenCache &&
    Date.now() < tokenCache.expiresAt - REFRESH_BUFFER_MS
  ) {
    return tokenCache.accessToken;
  }

  tokenCache = await fetchAccessToken();
  return tokenCache.accessToken;
}

export function clearTokenCache(): void {
  tokenCache = null;
}
