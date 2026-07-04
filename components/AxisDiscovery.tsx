"use client";

import { AnchorCard } from "@/components/AnchorCard";
import { AxisSelector } from "@/components/AxisSelector";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoadingState } from "@/components/LoadingState";
import { RecommendationList } from "@/components/RecommendationList";
import { SavedList } from "@/components/SavedList";
import { usePlayback } from "@/hooks/usePlayback";
import { getAxisOption } from "@/lib/constants";
import { useRecommendations } from "@/hooks/useRecommendations";
import type { Axis, Track } from "@/lib/types";
import { useEffect, useRef } from "react";
import styles from "./AxisDiscovery.module.css";

type AxisDiscoveryProps = {
  anchor: Track;
  axis: Axis;
  onAxisChange: (axis: Axis) => void;
  onChangeSong: () => void;
};

export function AxisDiscovery({
  anchor,
  axis,
  onAxisChange,
  onChangeSong,
}: AxisDiscoveryProps) {
  const panelRef = useRef<HTMLElement>(null);
  const { nowPlayingId, play, clearPlaying } = usePlayback();
  const {
    recommendations,
    loadedAxis,
    isLoading,
    error,
    hasFetched,
    clearError,
    retry,
    cooldownSeconds,
  } = useRecommendations(anchor, axis);

  const displayAxis = loadedAxis ?? axis;
  const axisLabel = getAxisOption(axis).shortLabel;
  const showStaleResults = isLoading && recommendations.length > 0;
  const showResults = hasFetched && recommendations.length > 0;

  useEffect(() => {
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    clearPlaying();
  }, [axis, clearPlaying]);

  const prevLoadedAxis = useRef(loadedAxis);

  useEffect(() => {
    if (
      prevLoadedAxis.current !== loadedAxis &&
      loadedAxis !== null &&
      hasFetched
    ) {
      clearPlaying();
    }

    prevLoadedAxis.current = loadedAxis;
  }, [loadedAxis, hasFetched, clearPlaying]);

  return (
    <section
      ref={panelRef}
      className={styles.discovery}
      aria-label="Axis discovery"
    >
      <div className={styles.heroHeader}>
        <h2 className={styles.heroTitle}>What should we match on?</h2>
        <p className={styles.heroSubtitle}>
          Same song, different dimensions — switch axes to see how results
          change.
        </p>
      </div>

      <button type="button" className={styles.changeSong} onClick={onChangeSong}>
        ← Change song
      </button>

      <AnchorCard track={anchor} />

      <AxisSelector
        value={axis}
        onChange={onAxisChange}
        disabled={isLoading}
      />

      {error ? (
        <ErrorBanner
          message={
            cooldownSeconds > 0 && /rate limit/i.test(error)
              ? `AI rate limit reached — wait ${cooldownSeconds}s, then click Retry.`
              : /rate limit/i.test(error)
                ? "AI rate limit reached — click Retry to try again."
                : error
          }
          onDismiss={clearError}
          onRetry={retry}
        />
      ) : null}

      <div className={styles.resultsArea}>
        {isLoading && !showStaleResults ? (
          <LoadingState
            message={`Finding ${axisLabel.toLowerCase()} matches… (~10s)`}
          />
        ) : null}

        {showStaleResults ? (
          <div className={styles.staleWrapper}>
            <p className={styles.resultsLabel}>
              Switching to {axisLabel.toLowerCase()}…
            </p>
            <div className={styles.staleResults}>
              <RecommendationList
                recommendations={recommendations}
                nowPlayingId={nowPlayingId}
                onPlay={play}
              />
            </div>
            <div className={styles.loadingOverlay}>
              <LoadingState message={`Updating ${axisLabel.toLowerCase()}…`} />
            </div>
          </div>
        ) : null}

        {showResults && !isLoading ? (
          <div className={styles.resultsContent} key={displayAxis}>
            <div className={styles.resultsHeader}>
              <p className={styles.resultsLabel}>
                Matched on {getAxisOption(displayAxis).shortLabel.toLowerCase()}
              </p>
              <p className={styles.playHint}>▶ preview · heart to save</p>
            </div>
            <RecommendationList
              recommendations={recommendations}
              nowPlayingId={nowPlayingId}
              onPlay={play}
            />
          </div>
        ) : null}

        {hasFetched && !isLoading && recommendations.length === 0 ? (
          <RecommendationList recommendations={[]} />
        ) : null}
      </div>

      <SavedList />
    </section>
  );
}
