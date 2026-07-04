const CONFIG_ERROR_PATTERN =
  /configuration|not configured|check configuration/i;
const GEMINI_DAILY_QUOTA_PATTERN =
  /today'?s free ai|daily limit|used up.*overnight|aistudio\.google\.com/i;
const GEMINI_QUOTA_PATTERN =
  /rate limit reached|quota exceeded|exceeded your current quota|resource has been exhausted|resource_exhausted/i;
const GEMINI_BUSY_PATTERN =
  /high demand|overloaded|service is currently overloaded/i;
const SPOTIFY_BUSY_PATTERN = /spotify is busy|rate limit/i;

export function getFriendlyErrorMessage(message: string): string {
  if (CONFIG_ERROR_PATTERN.test(message)) {
    return "App is missing API configuration. Check server environment variables.";
  }

  if (GEMINI_DAILY_QUOTA_PATTERN.test(message)) {
    return message;
  }

  if (GEMINI_QUOTA_PATTERN.test(message)) {
    const waitMatch = message.match(/wait about (\d+) seconds/i);

    if (waitMatch) {
      return message;
    }

    return "AI rate limit reached — wait a minute, then click Retry.";
  }

  if (GEMINI_BUSY_PATTERN.test(message)) {
    return "AI servers are busy — wait 30 seconds, then click Retry.";
  }

  if (SPOTIFY_BUSY_PATTERN.test(message)) {
    const waitMatch = message.match(/try again in (\d+) seconds/i);

    if (waitMatch) {
      return message;
    }

    return "Spotify is busy — try again in a moment.";
  }

  if (message === "Failed to get recommendations.") {
    return "Couldn't load recommendations — check your connection and try again.";
  }

  if (message === "Failed to search Spotify.") {
    return "Couldn't search Spotify — check your connection and try again.";
  }

  if (message === "Spotify is not configured.") {
    return "Spotify is not configured. Check server environment variables.";
  }

  return message;
}

export function getErrorStatus(message: string): number {
  if (CONFIG_ERROR_PATTERN.test(message)) {
    return 500;
  }

  if (GEMINI_DAILY_QUOTA_PATTERN.test(message)) {
    return 429;
  }

  if (GEMINI_QUOTA_PATTERN.test(message)) {
    return 429;
  }

  if (GEMINI_BUSY_PATTERN.test(message)) {
    return 503;
  }

  if (SPOTIFY_BUSY_PATTERN.test(message)) {
    return 429;
  }

  if (/took too long|timeout/i.test(message)) {
    return 504;
  }

  return 502;
}

export function getRetryAfterSeconds(message: string, status: number): number {
  if (GEMINI_DAILY_QUOTA_PATTERN.test(message)) {
    return 0;
  }

  const waitMatch = message.match(/wait about (\d+) seconds/i);

  if (waitMatch) {
    return Number.parseInt(waitMatch[1], 10);
  }

  if (SPOTIFY_BUSY_PATTERN.test(message)) {
    const waitMatch = message.match(/try again in (\d+) seconds/i);

    if (waitMatch) {
      return Number.parseInt(waitMatch[1], 10);
    }

    return 30;
  }

  if (GEMINI_QUOTA_PATTERN.test(message)) {
    return 60;
  }

  if (status === 503 || GEMINI_BUSY_PATTERN.test(message)) {
    return 30;
  }

  return 0;
}
