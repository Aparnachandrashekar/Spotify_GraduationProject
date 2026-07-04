import styles from "./ErrorBanner.module.css";

type ErrorBannerProps = {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ErrorBanner({
  message,
  onDismiss,
  onRetry,
  retryLabel = "Retry",
}: ErrorBannerProps) {
  const showRetry = Boolean(onRetry) && /rate limit|wait about/i.test(message);

  return (
    <div className={styles.banner} role="alert">
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        {showRetry ? (
          <button type="button" className={styles.retry} onClick={onRetry}>
            {retryLabel}
          </button>
        ) : null}
        {onDismiss ? (
          <button
            type="button"
            className={styles.dismiss}
            onClick={onDismiss}
            aria-label="Dismiss error"
          >
            ×
          </button>
        ) : null}
      </div>
    </div>
  );
}
