"use client";

import styles from "./ContentFilterPills.module.css";

const DECORATIVE_PILLS = ["All", "Music", "Podcasts"] as const;

type ContentFilterPillsProps = {
  axisActive?: boolean;
  onAxisSelect?: () => void;
};

export function ContentFilterPills({
  axisActive = true,
  onAxisSelect,
}: ContentFilterPillsProps) {
  return (
    <nav className={styles.nav} aria-label="Content filters">
      {DECORATIVE_PILLS.map((pill) => (
        <span key={pill} className={styles.pill} aria-hidden="true">
          {pill}
        </span>
      ))}
      <button
        type="button"
        className={`${styles.pill} ${styles.pillButton} ${axisActive ? styles.pillActive : ""}`}
        aria-current={axisActive ? "page" : undefined}
        onClick={onAxisSelect}
      >
        Axis
      </button>
    </nav>
  );
}
