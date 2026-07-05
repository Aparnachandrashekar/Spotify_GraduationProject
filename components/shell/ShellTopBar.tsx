import Image from "next/image";
import {
  BellIcon,
  HomeIcon,
  LibraryBrowseIcon,
  SearchIcon,
} from "./ShellIcons";
import styles from "./ShellTopBar.module.css";

type ShellTopBarProps = {
  panelsCollapsed?: boolean;
  onOpenLibrary?: () => void;
  libraryOpen?: boolean;
};

export function ShellTopBar({
  panelsCollapsed = false,
  onOpenLibrary,
  libraryOpen = false,
}: ShellTopBarProps) {
  return (
    <header
      className={`${styles.topBar} ${panelsCollapsed ? styles.topBarCollapsed : ""}`}
      aria-hidden="true"
    >
      <div className={styles.logoMark}>
        <Image
          src="/shell/spotify-icon.png"
          alt=""
          width={48}
          height={48}
          priority
        />
      </div>

      <button
        type="button"
        className={`${styles.mobileLibraryBtn} ${libraryOpen ? styles.mobileLibraryBtnActive : ""}`}
        aria-label="Your library"
        aria-expanded={libraryOpen}
        onClick={onOpenLibrary}
      >
        <LibraryBrowseIcon size={24} />
      </button>

      <div className={styles.searchCluster}>
        <div className={styles.homeButton}>
          <HomeIcon size={28} />
        </div>
        <div className={styles.searchPill}>
          <SearchIcon size={28} />
          <span className={styles.searchPlaceholder}>
            What do you want to play?
          </span>
          <span className={styles.searchBrowse}>
            <LibraryBrowseIcon size={24} />
          </span>
        </div>
      </div>

      <div className={styles.right}>
        <span className={styles.installApp}>Install app</span>
        <div className={styles.iconButton}>
          <BellIcon size={29} />
        </div>
        <div
          className={styles.avatar}
          style={{
            backgroundImage:
              "linear-gradient(135deg, #450af5 0%, #c4efd9 100%)",
          }}
        />
      </div>
    </header>
  );
}
