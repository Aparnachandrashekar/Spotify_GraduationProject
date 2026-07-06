"use client";

import { createContext, useContext } from "react";

export type MobileTab = "home" | "search" | "library" | "create";

type MobileShellContextValue = {
  activeTab: MobileTab;
  setActiveTab: (tab: MobileTab) => void;
  isMobile: boolean;
};

export const MobileShellContext = createContext<MobileShellContextValue | null>(
  null,
);

export function useMobileShell(): MobileShellContextValue {
  const value = useContext(MobileShellContext);

  if (!value) {
    return {
      activeTab: "home",
      setActiveTab: () => {},
      isMobile: false,
    };
  }

  return value;
}
