"use client";

import type { CSSProperties } from "react";
import { AXES } from "@/lib/constants";
import type { Axis } from "@/lib/types";
import { useMemo } from "react";
import styles from "./AxisSelector.module.css";

type AxisSelectorProps = {
  value: Axis;
  onChange: (axis: Axis) => void;
  disabled?: boolean;
};

export function AxisSelector({ value, onChange, disabled }: AxisSelectorProps) {
  const activeIndex = useMemo(
    () => Math.max(0, AXES.findIndex((axis) => axis.id === value)),
    [value],
  );
  const active = AXES[activeIndex];

  return (
    <div className={styles.wrapper}>
      <div
        className={styles.segmented}
        role="tablist"
        aria-label="Similarity axis"
        style={{ "--active-index": activeIndex } as CSSProperties}
      >
        <span className={styles.pill} aria-hidden="true" />
        {AXES.map((axis) => {
          const isActive = axis.id === value;

          return (
            <button
              key={axis.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={styles.segment}
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
        <p className={styles.description} key={active.id} role="status">
          {active.description}
        </p>
      ) : null}
    </div>
  );
}
