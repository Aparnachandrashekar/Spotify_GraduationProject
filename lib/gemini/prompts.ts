import type { Axis, Anchor } from "@/lib/types";
import { RECOMMENDATION_COUNT } from "@/lib/constants";

const AXIS_INSTRUCTIONS: Record<
  Axis,
  { match: string; ignore: string; reasonHint: string }
> = {
  beat: {
    match: "tempo, rhythm, energy level, and instrumentation/production feel",
    ignore: "lyrical content and mood",
    reasonHint:
      'Start with anchor tempo/energy assessment, then the match (e.g. "Anchor is a slow, mellow cover (~70 BPM)—matched on soft brushed drums and low energy, not the famous upbeat original.").',
  },
  mood: {
    match: "emotional feeling or atmosphere",
    ignore: "genre, tempo, and instrumentation differences",
    reasonHint:
      'e.g. "Matched on bittersweet late-night loneliness, not tempo or genre."',
  },
  lyrics: {
    match: "subject matter, themes, and storytelling",
    ignore: "musical similarity, tempo, and production",
    reasonHint:
      'e.g. "Matched on songs about heartbreak and moving on, not sound."',
  },
};

const AXIS_LABELS: Record<Axis, string> = {
  beat: "beat & energy",
  mood: "mood & vibe",
  lyrics: "lyrical theme",
};

function sanitizeField(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function formatAnchorMetadata(anchor: Anchor): string {
  const lines = [
    `- Title (exact recording name, including any version tags): "${sanitizeField(anchor.title)}"`,
    `- Artist: ${sanitizeField(anchor.artist)}`,
  ];

  if (anchor.albumName) {
    lines.push(`- Album: ${sanitizeField(anchor.albumName)}`);
  }

  if (anchor.releaseYear) {
    lines.push(`- Release year: ${anchor.releaseYear}`);
  }

  return lines.join("\n");
}

function buildBeatAxisBlock(anchor: Anchor): string {
  const titleLower = anchor.title.toLowerCase();
  const versionHints = [
    "cover",
    "acoustic",
    "slow",
    "mellow",
    "piano",
    "stripped",
    "unplugged",
    "ballad",
    "remix",
    "live",
    "version",
    "reprise",
  ];
  const hasVersionCue =
    versionHints.some((hint) => titleLower.includes(hint)) ||
    Boolean(anchor.albumName?.toLowerCase().includes("cover"));

  const versionNote = hasVersionCue
    ? "The title or album suggests this may be a cover, remix, acoustic, or alternate version—take that literally."
    : "Even if the title looks like a well-known hit, treat the metadata below as the exact recording the user picked—it may still be a cover or slow arrangement.";

  return `
CRITICAL — beat & energy matching rules:
${versionNote}

The user selected THIS SPECIFIC RECORDING on Spotify, not a generic song title and not the most famous original version.

- Match the tempo, rhythm, and energy of THIS version as described by its title, album, and context.
- Do NOT default to the well-known original's tempo or energy (e.g. do not recommend upbeat dance tracks for a slow/acoustic/cover version of an upbeat hit).
- If the anchor appears to be a slow, acoustic, piano, or mellow cover/remix, recommend other slow/mellow songs with similar energy—not the famous fast originals.
- Infer tempo/energy from the recording name (e.g. "(Cover)", "Acoustic", "Slowed", "Piano Version"), album name, and artist context.
- When uncertain, err toward lower energy and slower tempo if any version cue is present.

Reason format for beat & energy:
- The FIRST recommendation's "reason" MUST begin with your assumed tempo/energy of the anchor recording (e.g. "Anchor is a slow, mellow cover (~70 BPM)—").
- Every "reason" must reference beat/energy and must NOT recommend songs that contradict the anchor's inferred tempo/energy.`;
}

export function buildRecommendPrompt(anchor: Anchor, axis: Axis): string {
  const rules = AXIS_INSTRUCTIONS[axis];
  const axisLabel = AXIS_LABELS[axis];
  const metadataBlock = formatAnchorMetadata(anchor);
  const beatBlock = axis === "beat" ? buildBeatAxisBlock(anchor) : "";

  return `You are a music expert recommending real, existing songs.

The user selected this exact anchor recording on Spotify:
${metadataBlock}

Similarity axis: ${axisLabel}
${beatBlock}

Recommend exactly ${RECOMMENDATION_COUNT} real songs that exist on major streaming platforms.

For this axis, match on ${rules.match}.
Explicitly IGNORE ${rules.ignore}.

Requirements:
- Return ONLY a JSON array. No preamble, no markdown fences, no commentary.
- Each item must be an object with exactly these string fields: "title", "artist", "reason".
- "reason" must be one sentence that explicitly references the ${axisLabel} dimension (${rules.reasonHint}).
- Do NOT include the anchor song or obvious duplicates (live/remix versions of the same track).
- All songs must be real and well-known enough to appear on Spotify.

Example format:
[
  {
    "title": "Song Name",
    "artist": "Artist Name",
    "reason": "Matched on ..."
  }
]`;
}
