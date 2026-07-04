"use client";

import { AlbumArt } from "@/components/AlbumArt";
import { trackToPlayable, usePlayback } from "@/hooks/usePlayback";
import type { Track } from "@/lib/types";
import styles from "./AnchorCard.module.css";

type AnchorCardProps = {
  track: Track;
};

export function AnchorCard({ track }: AnchorCardProps) {
  const { nowPlayingId, play } = usePlayback();
  const isPlaying = nowPlayingId === track.id;

  function handlePlay() {
    play(trackToPlayable(track));
  }

  return (
    <div className={styles.card} aria-label="Anchor song">
      <button
        type="button"
        className={styles.playButton}
        onClick={handlePlay}
        aria-label={`Play preview of ${track.title}`}
        aria-pressed={isPlaying}
      >
        <span className={styles.artWrap}>
          <AlbumArt url={track.albumArtUrl} title={track.title} size={80} />
        </span>
        <span className={styles.playOverlay} aria-hidden="true">
          {isPlaying ? (
            <span className={styles.playingIcon}>
              <span />
              <span />
              <span />
            </span>
          ) : (
            <span className={styles.playIcon}>▶</span>
          )}
        </span>
      </button>

      <div className={styles.meta}>
        <span className={styles.eyebrow}>Anchor song</span>
        <h2 className={styles.title}>{track.title}</h2>
        <p className={styles.artist}>{track.artist}</p>
      </div>
    </div>
  );
}
