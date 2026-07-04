import { DiscoveryApp } from "@/components/DiscoveryApp";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoMark} aria-hidden="true">
            A
          </span>
          <span className={styles.logoText}>Axis</span>
        </div>
      </header>

      <main className={styles.main}>
        <DiscoveryApp />
      </main>

      <footer className={styles.footer}>
        Axis — music discovery by similarity dimension
      </footer>
    </div>
  );
}
