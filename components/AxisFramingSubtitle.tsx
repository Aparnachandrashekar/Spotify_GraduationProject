import styles from "./AxisFramingSubtitle.module.css";

const FRAMING_COPY =
  "Preview-first and ranked — find your next favourite song in 30 seconds.";

type AxisFramingSubtitleProps = {
  variant?: "landing";
};

export function AxisFramingSubtitle({ variant }: AxisFramingSubtitleProps) {
  return (
    <p
      className={`${styles.subtitle} ${variant === "landing" ? styles.subtitleLanding : ""}`}
      role="doc-subtitle"
    >
      {FRAMING_COPY}
    </p>
  );
}
