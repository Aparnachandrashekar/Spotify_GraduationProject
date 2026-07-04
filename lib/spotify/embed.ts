export function getSpotifyEmbedUrl(spotifyId: string): string {
  const params = new URLSearchParams({
    utm_source: "generator",
    theme: "0",
  });

  return `https://open.spotify.com/embed/track/${spotifyId}?${params.toString()}`;
}
