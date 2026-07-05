import {
  PanelCollapseLeftIcon,
  PlusCircleIcon,
  SearchIcon,
} from "./ShellIcons";
import styles from "./ShellSidebar.module.css";

type LibraryItem = {
  id: string;
  name: string;
  subtitle: string;
  coverClass: string;
  coverLabel?: string;
};

const LIBRARY_ITEMS: LibraryItem[] = [
  {
    id: "liked",
    name: "Liked songs",
    subtitle: "Playlist · 132 songs",
    coverClass: styles.coverLiked,
    coverLabel: "♥",
  },
  {
    id: "top",
    name: "My top tracks playlist",
    subtitle: "Playlist · aps",
    coverClass: styles.coverMix1,
    coverLabel: "MT",
  },
  {
    id: "bts",
    name: "BTS",
    subtitle: "Artist",
    coverClass: styles.coverArtist1,
  },
  {
    id: "dark",
    name: "Dark academia",
    subtitle: "Playlist · aps",
    coverClass: styles.coverMix2,
  },
  {
    id: "chill",
    name: "Chill vibes",
    subtitle: "Playlist · 1,225 songs",
    coverClass: styles.coverMix3,
  },
  {
    id: "weeknd",
    name: "The Weeknd",
    subtitle: "Artist",
    coverClass: styles.coverArtist2,
  },
  {
    id: "discover",
    name: "Discover weekly",
    subtitle: "Playlist · Spotify",
    coverClass: styles.coverMix4,
  },
  {
    id: "focus",
    name: "Deep focus",
    subtitle: "Playlist · 847 songs",
    coverClass: styles.coverMix5,
  },
];

const FILTER_PILLS = ["Playlists", "Artists", "Albums", "Podcasts"];

const RAIL_ICON = 26;

type ShellSidebarProps = {
  expanded: boolean;
  onToggle: () => void;
};

export function ShellSidebar({ expanded, onToggle }: ShellSidebarProps) {
  return (
    <aside
      className={`${styles.sidebar} ${expanded ? styles.expanded : styles.collapsed}`}
      aria-hidden="true"
    >
      <div className={styles.panel}>
        <div className={styles.headerArea}>
          <div className={`${styles.expandedHeader} ${styles.expandedOnly}`}>
            <h2 className={styles.title}>Your library</h2>
            <div className={styles.headerActions}>
              <span className={styles.headerIcon}>
                <PlusCircleIcon size={RAIL_ICON} />
              </span>
              <button
                type="button"
                className={styles.headerIconButton}
                aria-label="Collapse library"
                onClick={onToggle}
              >
                <PanelCollapseLeftIcon size={RAIL_ICON} />
              </button>
            </div>
          </div>

          <div className={`${styles.collapsedHeader} ${styles.collapsedOnly}`}>
            <button
              type="button"
              className={styles.collapsedIconBtn}
              aria-label="Expand library"
              onClick={onToggle}
            >
              <PanelCollapseLeftIcon size={RAIL_ICON} />
            </button>
            <span className={styles.collapsedIconBtn}>
              <PlusCircleIcon size={RAIL_ICON} />
            </span>
          </div>
        </div>

        <div className={`${styles.expandedContent} ${styles.expandedOnly}`}>
          <div className={styles.filters}>
            {FILTER_PILLS.map((pill) => (
              <span key={pill} className={styles.filterPill}>
                {pill}
              </span>
            ))}
          </div>

          <div className={styles.recentsRow}>
            <span className={styles.recentsSearch}>
              <SearchIcon size={RAIL_ICON} />
            </span>
            <span className={styles.recentsLabel}>Recents</span>
          </div>
        </div>

        <ul className={styles.list}>
          {LIBRARY_ITEMS.map((item) => (
            <li
              key={item.id}
              className={styles.listItem}
              title={expanded ? undefined : item.name}
            >
              <div className={`${styles.cover} ${item.coverClass}`}>
                {item.coverLabel ? (
                  <span className={styles.coverLabel}>{item.coverLabel}</span>
                ) : null}
              </div>
              <div className={`${styles.meta} ${styles.expandedOnly}`}>
                <p className={styles.name}>{item.name}</p>
                <p className={styles.subtitle}>{item.subtitle}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
