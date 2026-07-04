import type { SpotifyImage } from "./types";

/** Prefer the largest image so enlarged covers stay crisp. */
export function pickAlbumArtUrl(images: SpotifyImage[]): string | null {
  if (images.length === 0) {
    return null;
  }

  const sorted = [...images].sort(
    (a, b) => (b.width ?? 0) - (a.width ?? 0),
  );

  return sorted[0]?.url ?? null;
}
