"use client";

import type { CSSProperties } from "react";
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
  animateIn?: boolean;
};

export function RecommendationList({
  recommendations,
  nowPlayingId = null,
  onPlay,
  animateIn = false,
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
    <ol
      className={`${styles.list} ${animateIn ? styles.listAnimated : ""}`}
      aria-label="Recommendations"
    >
      {recommendations.map((item, index) => (
        <li
          key={item.spotifyId}
          className={styles.listItem}
          style={
            animateIn
              ? ({ "--stagger": index } as CSSProperties)
              : undefined
          }
        >
          <TrackRow
            recommendation={item}
            rank={item.rank}
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
