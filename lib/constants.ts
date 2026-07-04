import type { Axis } from "@/lib/types";

export const SEARCH_DEBOUNCE_MS = 350;
export const SEARCH_MIN_LENGTH = 2;
export const SEARCH_TIMEOUT_MS = 12_000;
export const RECOMMEND_TIMEOUT_MS = 45_000;
export const SPOTIFY_FETCH_TIMEOUT_MS = 10_000;

export const RECOMMENDATION_REQUEST_COUNT = 12;
export const RECOMMENDATION_DISPLAY_COUNT = 10;
/** @deprecated Use RECOMMENDATION_REQUEST_COUNT */
export const RECOMMENDATION_COUNT = RECOMMENDATION_REQUEST_COUNT;
export const DEFAULT_AXIS: Axis = "beat";

export type AxisOption = {
  id: Axis;
  label: string;
  shortLabel: string;
  description: string;
};

export const AXES: AxisOption[] = [
  {
    id: "beat",
    label: "Match the beat & energy",
    shortLabel: "Beat & energy",
    description: "Tempo, rhythm, energy, and production — not lyrics or mood.",
  },
  {
    id: "mood",
    label: "Match the mood & vibe",
    shortLabel: "Mood & vibe",
    description: "Emotional atmosphere — genre and tempo may differ.",
  },
  {
    id: "lyrics",
    label: "Match the lyrical theme",
    shortLabel: "Lyrical theme",
    description: "Subject matter and storytelling — sound may differ entirely.",
  },
];

export const AXIS_IDS = new Set<Axis>(AXES.map((axis) => axis.id));

export function isAxis(value: unknown): value is Axis {
  return typeof value === "string" && AXIS_IDS.has(value as Axis);
}

export function getAxisOption(axis: Axis): AxisOption {
  const option = AXES.find((item) => item.id === axis);
  if (!option) {
    throw new Error(`Unknown axis: ${axis}`);
  }
  return option;
}
