import { AlbumArt } from "@/components/AlbumArt";
import type { PlayableTrack } from "@/lib/types";
import styles from "./PlayerBar.module.css";

type PlayerBarProps = {
  track: PlayableTrack;
  isPlaying: boolean;
  isLoadingPreview?: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
};

export function PlayerBar({
  track,
  isPlaying,
  isLoadingPreview = false,
  onTogglePlay,
  onClose,
}: PlayerBarProps) {
  const hasPreview = Boolean(track.previewUrl);
  const canPlay = hasPreview && !isLoadingPreview;

  return (
    <aside className={styles.bar} role="region" aria-label="Now playing">
      <div className={styles.trackInfo}>
        <AlbumArt url={track.albumArtUrl} title={track.title} size={56} />
        <div className={styles.meta}>
          <p className={styles.title}>{track.title}</p>
          <p className={styles.artist}>{track.artist}</p>
          {!hasPreview && !isLoadingPreview ? (
            <p className={styles.unavailable}>Preview unavailable</p>
          ) : null}
        </div>
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.playButton}
          onClick={onTogglePlay}
          disabled={!canPlay}
          aria-label={
            isLoadingPreview
              ? "Loading preview"
              : isPlaying
                ? "Pause preview"
                : "Play preview"
          }
        >
          {isLoadingPreview ? "…" : isPlaying ? "❚❚" : "▶"}
        </button>
        <span className={styles.previewLabel}>
          {isLoadingPreview
            ? "Loading preview…"
            : hasPreview
              ? "30s preview"
              : null}
        </span>
      </div>

      <div className={styles.actions}>
        <a
          href={track.spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.openLink}
        >
          Open in Spotify
        </a>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close player"
        >
          ×
        </button>
      </div>
    </aside>
  );
}
