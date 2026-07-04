import { SPOTIFY_FETCH_TIMEOUT_MS } from "@/lib/constants";
import type { Anchor, Track } from "@/lib/types";
import { normalizeSongKey } from "@/lib/recommendations/keys";
import { pickAlbumArtUrl } from "./images";
import { clearTokenCache, getAccessToken } from "./auth";
import { logSpotifyCall } from "./logger";
import {
  getSpotifyCooldownMs,
  markSpotifyRateLimited,
  parseRetryAfterSeconds,
  spotifyBusyMessage,
  waitForSpotifyCooldown,
} from "./rate-limit";
import type { SpotifySearchResponse, SpotifyTrackItem } from "./types";

const SEARCH_URL = "https://api.spotify.com/v1/search";
const TRACK_URL = "https://api.spotify.com/v1/tracks";
const DEFAULT_LIMIT = 10;
const DEFAULT_MARKET = "US";
const SEARCH_CACHE_TTL_MS = 60_000;
const LOOKUP_CACHE_TTL_MS = 60 * 60_000;

type SearchCacheEntry = {
  tracks: Track[];
  expiresAt: number;
};

type LookupCacheEntry = {
  track: Track | null;
  expiresAt: number;
};

const searchCache = new Map<string, SearchCacheEntry>();
const inflightSearch = new Map<string, Promise<Track[]>>();
const lookupCache = new Map<string, LookupCacheEntry>();

function buildSearchCacheKey(
  query: string,
  limit: number,
  markets: string[],
): string {
  return `${markets.join("|")}:${limit}:${query.trim().toLowerCase()}`;
}

function getMarket(): string {
  return process.env.SPOTIFY_MARKET?.trim() || DEFAULT_MARKET;
}

function withMarket(params: URLSearchParams, market?: string): URLSearchParams {
  params.set("market", market ?? getMarket());
  return params;
}

function usesIndicScript(value: string): boolean {
  return /[\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F\u0D00-\u0D7F]/.test(value);
}

function previewMarketsToTry(): string[] {
  const configured = getMarket();
  return [...new Set([configured, "US", "GB", "IN"])];
}

async function searchTracksWithMarkets(
  query: string,
  limit = DEFAULT_LIMIT,
  markets?: string[],
): Promise<Track[]> {
  const marketList = markets ?? previewMarketsToTry();

  for (const market of marketList) {
    const params = new URLSearchParams({
      q: query,
      type: "track",
      limit: String(limit),
      market,
    });

    const response = await spotifyFetch(`${SEARCH_URL}?${params.toString()}`);

    if (response.status === 429) {
      throw new Error(spotifyBusyMessage());
    }

    if (!response.ok) {
      continue;
    }

    const data = (await response.json()) as SpotifySearchResponse;
    const tracks = dedupeSearchTracks(
      data.tracks.items
        .map(normalizeTrack)
        .filter((track): track is Track => track !== null),
    );

    if (tracks.length > 0) {
      return tracks;
    }
  }

  return [];
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

async function spotifyFetch(
  url: string,
  retryAuth = true,
  rateLimitAttempt = 0,
): Promise<Response> {
  const canProceed = await waitForSpotifyCooldown();

  if (!canProceed) {
    throw new Error(spotifyBusyMessage());
  }

  const accessToken = await getAccessToken();
  const endpoint = url.includes("/search") ? "search" : url.includes("/tracks/") ? "track" : "api";

  logSpotifyCall(endpoint, url.replace("https://api.spotify.com/v1/", ""));

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(SPOTIFY_FETCH_TIMEOUT_MS),
  });

  if (response.status === 401 && retryAuth) {
    clearTokenCache();
    return spotifyFetch(url, false, rateLimitAttempt);
  }

  if (response.status === 429) {
    const retryAfterSeconds = parseRetryAfterSeconds(
      response.headers.get("retry-after"),
    );

    markSpotifyRateLimited(retryAfterSeconds);

    if (rateLimitAttempt < 1 && retryAfterSeconds <= 5) {
      await waitForSpotifyCooldown(retryAfterSeconds * 1000 + 250);
      return spotifyFetch(url, retryAuth, rateLimitAttempt + 1);
    }

    throw new Error(spotifyBusyMessage());
  }

  return response;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function dedupeSearchTracks(tracks: Track[]): Track[] {
  const seen = new Set<string>();
  const deduped: Track[] = [];

  for (const track of tracks) {
    const key = normalizeSongKey(track.title, track.artist);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(track);
  }

  return deduped;
}

async function cachedMarketSearch(
  query: string,
  limit = DEFAULT_LIMIT,
  markets?: string[],
): Promise<Track[]> {
  const trimmed = query.trim();

  if (!trimmed) {
    return [];
  }

  const marketList = markets ?? [getMarket()];
  const cacheKey = buildSearchCacheKey(trimmed, limit, marketList);
  const cached = searchCache.get(cacheKey);

  if (cached && Date.now() < cached.expiresAt) {
    console.info(`[spotify] cache hit search "${trimmed}"`);
    return cached.tracks;
  }

  const inflight = inflightSearch.get(cacheKey);

  if (inflight) {
    console.info(`[spotify] dedupe in-flight search "${trimmed}"`);
    return inflight;
  }

  const promise = searchTracksWithMarkets(trimmed, limit, marketList)
    .then((tracks) => {
      searchCache.set(cacheKey, {
        tracks,
        expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
      });
      return tracks;
    })
    .finally(() => {
      inflightSearch.delete(cacheKey);
    });

  inflightSearch.set(cacheKey, promise);

  return promise;
}

export async function searchTracks(query: string, limit = DEFAULT_LIMIT): Promise<Track[]> {
  const trimmed = query.trim();

  if (!trimmed) {
    return [];
  }

  if (getSpotifyCooldownMs() > 0) {
    throw new Error(spotifyBusyMessage());
  }

  return cachedMarketSearch(trimmed, limit, [getMarket()]);
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
    throw new Error(spotifyBusyMessage());
  }

  if (!response.ok) {
    throw new Error("Failed to load track from Spotify.");
  }

  const data = (await response.json()) as SpotifyTrackItem;

  return normalizeTrack(data);
}

export async function resolvePreviewUrl(id: string): Promise<string | null> {
  const track = await getTrackById(id, getMarket());

  if (track?.previewUrl) {
    return track.previewUrl;
  }

  for (const market of previewMarketsToTry()) {
    if (market === getMarket()) {
      continue;
    }

    const fallback = await getTrackById(id, market);

    if (fallback?.previewUrl) {
      return fallback.previewUrl;
    }
  }

  return null;
}

export async function lookupTrack(
  title: string,
  artist: string,
): Promise<Track | null> {
  const lookupKey = normalizeSongKey(title, artist);
  const cachedLookup = lookupCache.get(lookupKey);

  if (cachedLookup && Date.now() < cachedLookup.expiresAt) {
    console.info(`[spotify] cache hit lookup "${title}" by ${artist}`);
    return cachedLookup.track;
  }

  const primaryArtist = artist.split(",")[0]?.trim() ?? artist;
  const primaryMarket = [getMarket()];
  const queries = [
    `${title} ${primaryArtist}`,
    `track:"${title}" artist:"${primaryArtist}"`,
  ];

  for (const query of queries) {
    try {
      const tracks = await cachedMarketSearch(query, 8, primaryMarket);
      const match = pickBestMatch(tracks, title, artist);

      if (match) {
        lookupCache.set(lookupKey, {
          track: match,
          expiresAt: Date.now() + LOOKUP_CACHE_TTL_MS,
        });
        return match;
      }
    } catch {
      continue;
    }
  }

  if (usesIndicScript(`${title} ${artist}`)) {
    for (const query of queries) {
      try {
        const tracks = await cachedMarketSearch(query, 8, ["IN", "US"]);
        const match = pickBestMatch(tracks, title, artist);

        if (match) {
          lookupCache.set(lookupKey, {
            track: match,
            expiresAt: Date.now() + LOOKUP_CACHE_TTL_MS,
          });
          return match;
        }
      } catch {
        continue;
      }
    }
  }

  lookupCache.set(lookupKey, {
    track: null,
    expiresAt: Date.now() + LOOKUP_CACHE_TTL_MS,
  });

  return null;
}
