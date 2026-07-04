"use client";

import { AnchorCard } from "@/components/AnchorCard";
import { AxisSelector } from "@/components/AxisSelector";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoadingState } from "@/components/LoadingState";
import { RecommendationList } from "@/components/RecommendationList";
import { getAxisOption } from "@/lib/constants";
import { useRecommendations } from "@/hooks/useRecommendations";
import type { Axis, Track } from "@/lib/types";
import { useEffect, useRef } from "react";
import styles from "./RecommendationsPanel.module.css";

type RecommendationsPanelProps = {
  anchor: Track;
  axis: Axis;
  onAxisChange: (axis: Axis) => void;
};

export function RecommendationsPanel({
  anchor,
  axis,
  onAxisChange,
}: RecommendationsPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const {
    recommendations,
    loadedAxis,
    isLoading,
    error,
    hasFetched,
    clearError,
  } = useRecommendations(anchor, axis);

  const axisLabel = getAxisOption(axis).shortLabel;
  const displayAxis = loadedAxis ?? axis;
  const showResults = hasFetched;

  useEffect(() => {
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  return (
    <section
      ref={panelRef}
      className={styles.panel}
      aria-label="Recommendations"
    >
      <AnchorCard track={anchor} />

      <AxisSelector value={axis} onChange={onAxisChange} />

      {error ? (
        <ErrorBanner message={error} onDismiss={clearError} />
      ) : null}

      <div className={styles.resultsArea}>
        {isLoading ? (
          <LoadingState
            message={
              showResults
                ? `Switching to ${axisLabel}…`
                : `Finding ${axisLabel} matches… (this can take ~10s)`
            }
          />
        ) : null}

        {showResults && !isLoading ? (
          <div className={styles.resultsContent} key={displayAxis}>
            <p className={styles.resultsLabel}>
              Matched on {getAxisOption(displayAxis).shortLabel.toLowerCase()}
            </p>
            <RecommendationList recommendations={recommendations} />
          </div>
        ) : null}

        {showResults && isLoading ? (
          <div className={`${styles.resultsContent} ${styles.resultsDimmed}`}>
            <p className={styles.resultsLabel}>
              Updating {axisLabel} matches…
            </p>
            <RecommendationList recommendations={recommendations} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
