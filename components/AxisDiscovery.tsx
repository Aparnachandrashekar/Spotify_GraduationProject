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
import { useEffect, useRef, useState } from "react";
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
  const axisLabel = getAxisOption(displayAxis).shortLabel;
  const showStaleResults =
    isLoading && recommendations.length > 0 && loadedAxis === axis;
  const showResults = hasFetched && recommendations.length > 0;
  const [resultsVisible, setResultsVisible] = useState(true);
  const prevAxisRef = useRef(displayAxis);

  useEffect(() => {
    clearPlaying();
  }, [axis, clearPlaying]);

  useEffect(() => {
    if (prevAxisRef.current !== displayAxis && hasFetched) {
      clearPlaying();
    }

    prevAxisRef.current = displayAxis;
  }, [displayAxis, hasFetched, clearPlaying]);

  useEffect(() => {
    if (isLoading && !showStaleResults) {
      setResultsVisible(false);
      return;
    }

    if (!isLoading && (showResults || (hasFetched && recommendations.length === 0))) {
      const timer = window.setTimeout(() => setResultsVisible(true), 40);
      return () => window.clearTimeout(timer);
    }
  }, [displayAxis, isLoading, showResults, showStaleResults, hasFetched, recommendations.length]);

  return (
    <section className={styles.discovery} aria-label="Axis discovery">
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          You decide the <span className={styles.pageTitleAccent}>Vibe</span>.
        </h1>
        <p className={styles.pageSubtitle}>
          Same song, three ways to be similar. Switch the axis — watch the
          matches change.
        </p>
      </header>

      <div className={styles.columns}>
        <aside className={styles.leftColumn}>
          <button
            type="button"
            className={styles.changeSong}
            onClick={onChangeSong}
          >
            ← Change song
          </button>

          <AnchorCard track={anchor} />

          <AxisSelector
            value={axis}
            onChange={onAxisChange}
            disabled={isLoading}
          />
        </aside>

        <div className={styles.rightColumn}>
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
                  <LoadingState
                    message={`Updating ${axisLabel.toLowerCase()}…`}
                  />
                </div>
              </div>
            ) : null}

            {showResults && !isLoading ? (
              <div
                className={`${styles.resultsContent} ${resultsVisible ? styles.resultsVisible : styles.resultsHidden}`}
                key={displayAxis}
              >
                <div className={styles.resultsHeader}>
                  <p className={styles.resultsLabel}>
                    Matched on{" "}
                    <span className={styles.resultsAxis}>
                      {axisLabel.toUpperCase()}
                    </span>
                  </p>
                  <p className={styles.playHint}>▶ preview · ♡ to save</p>
                </div>
                <RecommendationList
                  recommendations={recommendations}
                  nowPlayingId={nowPlayingId}
                  onPlay={play}
                  animateIn
                />
              </div>
            ) : null}

            {hasFetched && !isLoading && recommendations.length === 0 ? (
              <RecommendationList recommendations={[]} />
            ) : null}
          </div>
        </div>
      </div>

      <div className={styles.savedStrip}>
        <SavedList variant="strip" />
      </div>
    </section>
  );
}
