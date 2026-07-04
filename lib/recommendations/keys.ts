export function normalizeSongKey(title: string, artist: string): string {
  const clean = (value: string) =>
    value
      .toLowerCase()
      .replace(/\([^)]*\)/g, "")
      .replace(/\[[^\]]*\]/g, "")
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const primaryArtist = artist.split(",")[0]?.trim() ?? artist;

  return `${clean(title)}|${clean(primaryArtist)}`;
}
