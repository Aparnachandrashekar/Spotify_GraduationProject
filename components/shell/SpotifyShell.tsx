"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MobileShellContext,
  type MobileTab,
} from "@/hooks/useMobileShell";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePlayback } from "@/hooks/usePlayback";
import styles from "./SpotifyShell.module.css";
import mobileViewStyles from "./ShellMobileViews.module.css";
import { PanelExpandRightIcon, PlusCircleIcon } from "./ShellIcons";
import { ShellMobileTabBar } from "./ShellMobileTabBar";
import { ShellNowPlaying } from "./ShellNowPlaying";
import { ShellPlayerBar } from "./ShellPlayerBar";
import { ShellSidebar } from "./ShellSidebar";
import { ShellTopBar } from "./ShellTopBar";

const SIDEBAR_ANIM_MS = 520;

type SpotifyShellProps = {
  children?: React.ReactNode;
};

export function SpotifyShell({ children }: SpotifyShellProps) {
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<MobileTab>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarContentExpanded, setSidebarContentExpanded] = useState(false);
  const [sidebarRevealed, setSidebarRevealed] = useState(false);
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
  const { nowPlaying } = usePlayback();
  const sidebarSlotRef = useRef<HTMLDivElement>(null);
  const sidebarOpenRef = useRef(sidebarOpen);
  const sidebarTimerRef = useRef<number | null>(null);

  sidebarOpenRef.current = sidebarOpen;

  const closeSidebar = useCallback(() => {
    setSidebarRevealed(false);
    setSidebarContentExpanded(false);
    setSidebarOpen(false);
  }, []);

  const finishSidebarOpen = useCallback(() => {
    if (!sidebarOpenRef.current) {
      return;
    }

    setSidebarContentExpanded(true);
    window.requestAnimationFrame(() => {
      setSidebarRevealed(true);
    });
  }, []);

  const clearSidebarTimer = useCallback(() => {
    if (sidebarTimerRef.current !== null) {
      window.clearTimeout(sidebarTimerRef.current);
      sidebarTimerRef.current = null;
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    clearSidebarTimer();

    if (sidebarOpen) {
      closeSidebar();
      return;
    }

    setSidebarRevealed(false);
    setSidebarContentExpanded(false);
    setSidebarOpen(true);

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) {
      finishSidebarOpen();
      return;
    }

    sidebarTimerRef.current = window.setTimeout(() => {
      sidebarTimerRef.current = null;
      finishSidebarOpen();
    }, SIDEBAR_ANIM_MS);
  }, [clearSidebarTimer, closeSidebar, finishSidebarOpen, sidebarOpen]);

  useEffect(() => {
    if (isMobile) {
      return;
    }

    const slot = sidebarSlotRef.current;

    if (!slot) {
      return;
    }

    function handleTransitionEnd(event: TransitionEvent) {
      if (event.target !== slot || event.propertyName !== "width") {
        return;
      }

      clearSidebarTimer();

      if (!sidebarOpenRef.current) {
        return;
      }

      finishSidebarOpen();
    }

    slot.addEventListener("transitionend", handleTransitionEnd);

    return () => {
      slot.removeEventListener("transitionend", handleTransitionEnd);
      clearSidebarTimer();
    };
  }, [clearSidebarTimer, finishSidebarOpen, isMobile]);

  useEffect(() => {
    if (nowPlaying) {
      setNowPlayingOpen(true);
    }
  }, [nowPlaying?.spotifyId, nowPlaying]);

  const panelsCollapsed = !sidebarOpen && !nowPlayingOpen;

  const bodyClassName = [
    styles.body,
    sidebarOpen ? styles.sidebarExpanded : styles.sidebarCollapsed,
    nowPlayingOpen ? styles.nowPlayingExpanded : styles.nowPlayingCollapsed,
  ].join(" ");

  const mobileContextValue = useMemo(
    () => ({
      activeTab: mobileTab,
      setActiveTab: setMobileTab,
      isMobile,
    }),
    [isMobile, mobileTab],
  );

  function renderMobileMain() {
    if (mobileTab === "library") {
      return (
        <div className={mobileViewStyles.mobileLibrary}>
          <div className={mobileViewStyles.mobileLibraryBody}>
            <ShellSidebar
              layout="expanded"
              revealed
              hideToggle
              onToggle={() => {}}
            />
          </div>
        </div>
      );
    }

    if (mobileTab === "create") {
      return (
        <div className={mobileViewStyles.mobileCreate}>
          <PlusCircleIcon size={48} />
          <p className={mobileViewStyles.mobileCreateTitle}>
            Create something new
          </p>
          <p className={mobileViewStyles.mobileCreateHint}>
            Build a playlist, blend songs, or start a Jam — coming soon in
            Axis.
          </p>
        </div>
      );
    }

    return children;
  }

  return (
    <MobileShellContext.Provider value={mobileContextValue}>
      <div className={styles.shell} aria-label="Spotify shell">
        <ShellTopBar panelsCollapsed={panelsCollapsed} />

        <div className={bodyClassName}>
          <div ref={sidebarSlotRef} className={styles.sidebarSlot}>
            <ShellSidebar
              layout={sidebarContentExpanded ? "expanded" : "collapsed"}
              revealed={sidebarRevealed}
              onToggle={toggleSidebar}
            />
          </div>

          <div className={styles.centerWrap}>
            <main className={styles.center} aria-label="Main content">
              {isMobile ? renderMobileMain() : children}
            </main>

            {!isMobile ? (
              <button
                type="button"
                className={`${styles.nowPlayingExpandTab} ${nowPlayingOpen ? styles.nowPlayingExpandTabHidden : ""}`}
                aria-label="Show now playing panel"
                aria-hidden={nowPlayingOpen}
                tabIndex={nowPlayingOpen ? -1 : 0}
                onClick={() => setNowPlayingOpen(true)}
              >
                <PanelExpandRightIcon size={26} />
              </button>
            ) : null}
          </div>

          <div className={styles.nowPlayingSlot}>
            <ShellNowPlaying onCollapse={() => setNowPlayingOpen(false)} />
          </div>
        </div>

        <ShellPlayerBar />

        {isMobile ? (
          <ShellMobileTabBar
            activeTab={mobileTab}
            onTabChange={setMobileTab}
          />
        ) : null}
      </div>
    </MobileShellContext.Provider>
  );
}
