"use client";

import type { PlayableTrack, Recommendation } from "@/lib/types";
import {
  recommendationToSavedTrack,
  useSavedTracks,
} from "@/hooks/useSavedTracks";
import { TrackRow } from "@/components/TrackRow";
import styles from "./RecommendationList.module.css";

type RecommendationListProps = {
  recommendations: Recommendation[];
  nowPlayingId?: string | null;
  onPlay?: (track: PlayableTrack) => void;
};

export function RecommendationList({
  recommendations,
  nowPlayingId = null,
  onPlay,
}: RecommendationListProps) {
  const { isSaved, toggleSave } = useSavedTracks();

  if (recommendations.length === 0) {
    return (
      <div className={styles.empty} role="status">
        <p className={styles.emptyTitle}>
          Couldn&apos;t find these songs on Spotify
        </p>
        <p className={styles.emptyHint}>
          Try again or pick a different axis.
        </p>
      </div>
    );
  }

  return (
    <ol className={styles.list} aria-label="Recommendations">
      {recommendations.map((item) => (
        <li key={item.spotifyId}>
          <TrackRow
            recommendation={item}
            isPlaying={item.spotifyId === nowPlayingId}
            isSaved={isSaved(item.spotifyId)}
            onPlay={onPlay}
            onToggleSave={() =>
              toggleSave(recommendationToSavedTrack(item))
            }
          />
        </li>
      ))}
    </ol>
  );
}
