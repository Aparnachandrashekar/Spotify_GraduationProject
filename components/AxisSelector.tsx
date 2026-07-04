"use client";

import { AXES } from "@/lib/constants";
import type { Axis } from "@/lib/types";
import styles from "./AxisSelector.module.css";

type AxisSelectorProps = {
  value: Axis;
  onChange: (axis: Axis) => void;
  disabled?: boolean;
};

export function AxisSelector({ value, onChange, disabled }: AxisSelectorProps) {
  const active = AXES.find((axis) => axis.id === value);

  return (
    <div className={styles.wrapper}>
      <p className={styles.label}>Explore similarity by</p>
      <div
        className={styles.segmented}
        role="tablist"
        aria-label="Similarity axis"
      >
        {AXES.map((axis) => {
          const isActive = axis.id === value;

          return (
            <button
              key={axis.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${styles.segment} ${isActive ? styles.segmentActive : ""}`}
              onClick={() => {
                if (!isActive) {
                  onChange(axis.id);
                }
              }}
              disabled={disabled}
            >
              {axis.shortLabel}
            </button>
          );
        })}
      </div>
      {active ? (
        <p className={styles.description} role="status">
          {active.description}
        </p>
      ) : null}
    </div>
  );
}
