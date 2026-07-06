"use client";

import {
  HomeIcon,
  LibraryBrowseIcon,
  PlusCircleIcon,
  SearchIcon,
} from "./ShellIcons";
import type { MobileTab } from "@/hooks/useMobileShell";
import styles from "./ShellMobileTabBar.module.css";

type ShellMobileTabBarProps = {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
};

const TABS: Array<{
  id: MobileTab;
  label: string;
  Icon: typeof HomeIcon;
}> = [
  { id: "home", label: "Home", Icon: HomeIcon },
  { id: "search", label: "Search", Icon: SearchIcon },
  { id: "library", label: "Your Library", Icon: LibraryBrowseIcon },
  { id: "create", label: "Create", Icon: PlusCircleIcon },
];

export function ShellMobileTabBar({
  activeTab,
  onTabChange,
}: ShellMobileTabBarProps) {
  return (
    <nav className={styles.tabBar} aria-label="Mobile navigation">
      {TABS.map(({ id, label, Icon }) => {
        const isActive = activeTab === id;

        return (
          <button
            key={id}
            type="button"
            className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
            aria-current={isActive ? "page" : undefined}
            onClick={() => onTabChange(id)}
          >
            <Icon size={24} />
            <span className={styles.label}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
