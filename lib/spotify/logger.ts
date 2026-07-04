let callCount = 0;

export function logSpotifyCall(kind: string, detail: string): void {
  callCount += 1;
  console.info(`[spotify] call #${callCount} ${kind} — ${detail}`);
}

export function resetSpotifyCallCount(): number {
  const previous = callCount;
  callCount = 0;
  return previous;
}

export function getSpotifyCallCount(): number {
  return callCount;
}
