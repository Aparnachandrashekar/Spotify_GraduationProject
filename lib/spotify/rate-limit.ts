let blockedUntil = 0;

export function getSpotifyCooldownMs(): number {
  return Math.max(0, blockedUntil - Date.now());
}

export function getSpotifyCooldownSeconds(): number {
  return Math.ceil(getSpotifyCooldownMs() / 1000);
}

export function markSpotifyRateLimited(retryAfterSeconds: number): void {
  const safeSeconds = Number.isFinite(retryAfterSeconds)
    ? Math.max(1, retryAfterSeconds)
    : 5;

  blockedUntil = Math.max(blockedUntil, Date.now() + safeSeconds * 1000);
}

export function parseRetryAfterSeconds(
  headerValue: string | null,
  fallback = 5,
): number {
  if (!headerValue) {
    return fallback;
  }

  const seconds = Number.parseInt(headerValue, 10);

  return Number.isFinite(seconds) ? Math.max(1, seconds) : fallback;
}

export async function waitForSpotifyCooldown(
  maxWaitMs = 5_000,
): Promise<boolean> {
  const remaining = getSpotifyCooldownMs();

  if (remaining <= 0) {
    return true;
  }

  if (remaining > maxWaitMs) {
    return false;
  }

  await new Promise((resolve) => {
    setTimeout(resolve, remaining);
  });

  return true;
}

export function spotifyBusyMessage(): string {
  const seconds = getSpotifyCooldownSeconds();

  if (seconds >= 3600) {
    const hours = Math.ceil(seconds / 3600);

    return `Spotify API limit reached. Try again in about ${hours} hour${hours === 1 ? "" : "s"}, or create a new app at developer.spotify.com and update SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET in .env.local.`;
  }

  if (seconds > 60) {
    const minutes = Math.ceil(seconds / 60);

    return `Spotify is busy — try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`;
  }

  if (seconds > 1) {
    return `Spotify is busy — try again in ${seconds} seconds.`;
  }

  return "Spotify is busy — try again in a moment.";
}
