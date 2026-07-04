type ItunesSearchResponse = {
  results?: Array<{
    trackName?: string;
    artistName?: string;
    previewUrl?: string;
  }>;
};

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pickBestItunesPreview(
  results: ItunesSearchResponse["results"],
  title: string,
  artist: string,
): string | null {
  if (!results?.length) {
    return null;
  }

  const normalizedTitle = normalizeForMatch(title);
  const primaryArtist = artist.split(",")[0]?.trim() ?? artist;
  const normalizedArtist = normalizeForMatch(primaryArtist);

  const withPreview = results.filter((item) => item.previewUrl);

  if (withPreview.length === 0) {
    return null;
  }

  const exact = withPreview.find(
    (item) =>
      normalizeForMatch(item.trackName ?? "") === normalizedTitle &&
      normalizeForMatch(item.artistName ?? "").includes(normalizedArtist),
  );

  if (exact?.previewUrl) {
    return exact.previewUrl;
  }

  const titleMatch = withPreview.find(
    (item) => normalizeForMatch(item.trackName ?? "") === normalizedTitle,
  );

  if (titleMatch?.previewUrl) {
    return titleMatch.previewUrl;
  }

  const artistMatch = withPreview.find((item) =>
    normalizeForMatch(item.artistName ?? "").includes(normalizedArtist),
  );

  return artistMatch?.previewUrl ?? withPreview[0]?.previewUrl ?? null;
}

export async function lookupItunesPreviewUrl(
  title: string,
  artist: string,
): Promise<string | null> {
  const primaryArtist = artist.split(",")[0]?.trim() ?? artist;
  const term = `${title} ${primaryArtist}`.trim();

  if (!term) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      term,
      entity: "song",
      limit: "10",
    });

    const response = await fetch(
      `https://itunes.apple.com/search?${params.toString()}`,
      { next: { revalidate: 3600 } },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as ItunesSearchResponse;

    return pickBestItunesPreview(data.results, title, artist);
  } catch {
    return null;
  }
}

export async function resolvePlayablePreviewUrl(options: {
  spotifyPreviewUrl: string | null;
  title: string;
  artist: string;
  resolveSpotifyPreview?: () => Promise<string | null>;
}): Promise<string | null> {
  if (options.spotifyPreviewUrl) {
    return options.spotifyPreviewUrl;
  }

  const spotifyPreview = options.resolveSpotifyPreview
    ? await options.resolveSpotifyPreview()
    : null;

  if (spotifyPreview) {
    return spotifyPreview;
  }

  return lookupItunesPreviewUrl(options.title, options.artist);
}
