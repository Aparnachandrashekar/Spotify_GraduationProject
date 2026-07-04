import type { Anchor, Track } from "@/lib/types";
import { clearTokenCache, getAccessToken } from "./auth";
import type { SpotifySearchResponse, SpotifyTrackItem } from "./types";

const SEARCH_URL = "https://api.spotify.com/v1/search";
const TRACK_URL = "https://api.spotify.com/v1/tracks";
const DEFAULT_LIMIT = 10;
const DEFAULT_MARKET = "US";

function getMarket(): string {
  return process.env.SPOTIFY_MARKET?.trim() || DEFAULT_MARKET;
}

function withMarket(params: URLSearchParams, market?: string): URLSearchParams {
  params.set("market", market ?? getMarket());
  return params;
}

function previewMarketsToTry(): string[] {
  const configured = getMarket();
  return [...new Set([configured, "US", "GB", "IN"])];
}

function pickAlbumArtUrl(
  images: SpotifyTrackItem["album"]["images"],
): string | null {
  if (images.length === 0) {
    return null;
  }

  const sorted = [...images].sort(
    (a, b) => (a.width ?? 0) - (b.width ?? 0),
  );
  const medium = sorted.find((image) => (image.width ?? 0) >= 64);

  return medium?.url ?? sorted[sorted.length - 1]?.url ?? null;
}

function extractReleaseYear(releaseDate: string | undefined): number | null {
  if (!releaseDate) {
    return null;
  }

  const year = Number.parseInt(releaseDate.slice(0, 4), 10);

  return Number.isNaN(year) ? null : year;
}

export function trackToAnchor(track: Track): Anchor {
  return {
    title: track.title,
    artist: track.artist,
    albumName: track.albumName,
    releaseYear: track.releaseYear,
  };
}

export function normalizeTrack(item: SpotifyTrackItem): Track | null {
  const spotifyUrl = item.external_urls.spotify;

  if (!spotifyUrl) {
    return null;
  }

  return {
    id: item.id,
    title: item.name,
    artist: item.artists.map((artist) => artist.name).join(", "),
    albumName: item.album.name ?? null,
    releaseYear: extractReleaseYear(item.album.release_date),
    albumArtUrl: pickAlbumArtUrl(item.album.images),
    spotifyUrl,
    previewUrl: item.preview_url,
  };
}

async function spotifyFetch(url: string, retry = true): Promise<Response> {
  const accessToken = await getAccessToken();

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    next: { revalidate: 0 },
  });

  if (response.status === 401 && retry) {
    clearTokenCache();
    return spotifyFetch(url, false);
  }

  return response;
}

export async function searchTracks(query: string, limit = DEFAULT_LIMIT): Promise<Track[]> {
  const params = withMarket(
    new URLSearchParams({
      q: query,
      type: "track",
      limit: String(limit),
    }),
  );

  const response = await spotifyFetch(`${SEARCH_URL}?${params.toString()}`);

  if (response.status === 429) {
    throw new Error("Spotify is busy — try again in a moment.");
  }

  if (!response.ok) {
    throw new Error("Failed to search Spotify.");
  }

  const data = (await response.json()) as SpotifySearchResponse;

  return data.tracks.items
    .map(normalizeTrack)
    .filter((track): track is Track => track !== null);
}

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pickBestMatch(
  items: Track[],
  title: string,
  artist: string,
): Track | null {
  if (items.length === 0) {
    return null;
  }

  const normalizedTitle = normalizeForMatch(title);
  const primaryArtist = artist.split(",")[0]?.trim() ?? artist;
  const normalizedArtist = normalizeForMatch(primaryArtist);

  const exactTitle = items.find(
    (track) => normalizeForMatch(track.title) === normalizedTitle,
  );

  if (exactTitle) {
    const artistMatch = items.find(
      (track) =>
        normalizeForMatch(track.title) === normalizedTitle &&
        normalizeForMatch(track.artist).includes(normalizedArtist),
    );

    const candidate = artistMatch ?? exactTitle;
    const withPreview = items.find(
      (track) =>
        normalizeForMatch(track.title) === normalizedTitle &&
        normalizeForMatch(track.artist).includes(normalizedArtist) &&
        track.previewUrl,
    );

    return withPreview ?? candidate;
  }

  const artistMatch = items.find((track) =>
    normalizeForMatch(track.artist).includes(normalizedArtist),
  );

  const withPreview = items.find(
    (track) =>
      normalizeForMatch(track.artist).includes(normalizedArtist) &&
      track.previewUrl,
  );

  return withPreview ?? artistMatch ?? items.find((track) => track.previewUrl) ?? items[0] ?? null;
}

export async function getTrackById(
  id: string,
  market?: string,
): Promise<Track | null> {
  const params = withMarket(new URLSearchParams(), market);
  const response = await spotifyFetch(`${TRACK_URL}/${id}?${params.toString()}`);

  if (response.status === 404) {
    return null;
  }

  if (response.status === 429) {
    throw new Error("Spotify is busy — try again in a moment.");
  }

  if (!response.ok) {
    throw new Error("Failed to load track from Spotify.");
  }

  const data = (await response.json()) as SpotifyTrackItem;

  return normalizeTrack(data);
}

export async function resolvePreviewUrl(id: string): Promise<string | null> {
  for (const market of previewMarketsToTry()) {
    const track = await getTrackById(id, market);

    if (track?.previewUrl) {
      return track.previewUrl;
    }
  }

  return null;
}

export async function lookupTrack(
  title: string,
  artist: string,
): Promise<Track | null> {
  const primaryArtist = artist.split(",")[0]?.trim() ?? artist;
  const query = `track:"${title}" artist:"${primaryArtist}"`;

  try {
    const tracks = await searchTracks(query, 5);
    return pickBestMatch(tracks, title, artist);
  } catch {
    const fallbackQuery = `${title} ${primaryArtist}`;

    try {
      const tracks = await searchTracks(fallbackQuery, 5);
      return pickBestMatch(tracks, title, artist);
    } catch {
      return null;
    }
  }
}
