import type { MouseEvent } from "react";
import type { PlayableTrack, Recommendation } from "@/lib/types";
import { AlbumArt } from "@/components/AlbumArt";
import { HeartIcon } from "@/components/HeartIcon";
import styles from "./TrackRow.module.css";

type TrackRowProps = {
  recommendation: Recommendation;
  rank?: number;
  isPlaying?: boolean;
  isSaved?: boolean;
  onPlay?: (track: PlayableTrack) => void;
  onToggleSave?: () => void;
};

function toPlayable(recommendation: Recommendation): PlayableTrack {
  return {
    spotifyId: recommendation.spotifyId,
    title: recommendation.title,
    artist: recommendation.artist,
    albumArtUrl: recommendation.albumArtUrl,
    spotifyUrl: recommendation.spotifyUrl,
    previewUrl: recommendation.previewUrl,
  };
}

export function TrackRow({
  recommendation,
  rank,
  isPlaying = false,
  isSaved = false,
  onPlay,
  onToggleSave,
}: TrackRowProps) {
  const canPlay = Boolean(recommendation.spotifyId && onPlay);

  function handlePlay() {
    if (!canPlay) {
      return;
    }

    onPlay?.(toPlayable(recommendation));
  }

  function handleToggleSave(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onToggleSave?.();
  }

  return (
    <article
      className={`${styles.row} ${isPlaying ? styles.rowPlaying : ""}`}
    >
      {rank !== undefined ? (
        <div className={styles.rankCell} aria-label={`Rank ${rank}`}>
          <span className={styles.rankLabel}>Rank</span>
          <span className={styles.rankNumber}>{rank}</span>
        </div>
      ) : null}

      <button
        type="button"
        className={styles.playControl}
        onClick={handlePlay}
        disabled={!canPlay}
        aria-label={
          isPlaying
            ? `Now playing ${recommendation.title}`
            : `Play preview of ${recommendation.title}`
        }
        aria-pressed={isPlaying}
      >
        {isPlaying ? (
          <span className={styles.playingIcon} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        ) : (
          <span className={styles.playIcon} aria-hidden="true">
            ▶
          </span>
        )}
      </button>

      <button
        type="button"
        className={styles.artButton}
        onClick={handlePlay}
        disabled={!canPlay}
        aria-hidden={canPlay}
        tabIndex={canPlay ? undefined : -1}
      >
        <AlbumArt
          url={recommendation.albumArtUrl}
          title={recommendation.title}
          size={52}
        />
      </button>

      <button
        type="button"
        className={styles.metaButton}
        onClick={handlePlay}
        disabled={!canPlay}
      >
        <div className={styles.meta}>
          <h3 className={styles.title}>{recommendation.title}</h3>
          <p className={styles.artist}>{recommendation.artist}</p>
          <p
            className={styles.reason}
            title={recommendation.reason}
          >
            {recommendation.reason}
          </p>
        </div>
      </button>

      <button
        type="button"
        className={`${styles.saveButton} ${isSaved ? styles.saveButtonActive : ""}`}
        onClick={handleToggleSave}
        disabled={!onToggleSave}
        aria-label={
          isSaved
            ? `Remove ${recommendation.title} from saved list`
            : `Save ${recommendation.title}`
        }
        aria-pressed={isSaved}
      >
        <HeartIcon filled={isSaved} />
      </button>
    </article>
  );
}
