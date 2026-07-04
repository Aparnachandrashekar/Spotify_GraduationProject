import { getSpotifyEmbedUrl } from "@/lib/spotify/embed";
import styles from "./SpotifyEmbed.module.css";

type SpotifyEmbedProps = {
  spotifyId: string;
  title: string;
  height?: number;
};

export function SpotifyEmbed({
  spotifyId,
  title,
  height = 80,
}: SpotifyEmbedProps) {
  const embedUrl = getSpotifyEmbedUrl(spotifyId);

  return (
    <iframe
      key={spotifyId}
      className={styles.embed}
      src={embedUrl}
      width="100%"
      height={height}
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      title={`Play ${title} on Spotify`}
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
