import type { Axis, Anchor } from "@/lib/types";
import { RECOMMENDATION_REQUEST_COUNT } from "@/lib/constants";

const AXIS_INSTRUCTIONS: Record<
  Axis,
  { match: string; ignore: string; reasonHint: string; focus: string }
> = {
  beat: {
    match: "tempo, rhythm, energy level, and instrumentation/production feel",
    ignore: "lyrical content and mood",
    focus:
      "Prioritize BPM, drum patterns, groove, and production intensity. Pick songs a DJ would call 'same energy' even if the mood or lyrics differ.",
    reasonHint:
      'Start with anchor tempo/energy assessment, then the match (e.g. "Anchor is a slow, mellow cover (~70 BPM)—matched on soft brushed drums and low energy, not the famous upbeat original.").',
  },
  mood: {
    match: "emotional feeling or atmosphere",
    ignore: "genre, tempo, and instrumentation differences",
    focus:
      "Prioritize how the song FEELS (lonely, euphoric, bittersweet, nostalgic). Tempo and genre may differ wildly from the anchor.",
    reasonHint:
      'e.g. "Matched on bittersweet late-night loneliness, not tempo or genre."',
  },
  lyrics: {
    match: "subject matter, themes, and storytelling",
    ignore: "musical similarity, tempo, and production",
    focus:
      "Prioritize narrative, metaphors, and what the song is ABOUT. The sound can be completely different from the anchor.",
    reasonHint:
      'e.g. "Matched on songs about heartbreak and moving on, not sound."',
  },
};

const AXIS_LABELS: Record<Axis, string> = {
  beat: "beat & energy",
  mood: "mood & vibe",
  lyrics: "lyrical theme",
};

const AXIS_AVOID: Record<Axis, string> = {
  beat: "Do NOT pick songs mainly because they share a sad/happy mood or lyrical theme — only tempo, rhythm, and energy.",
  mood: "Do NOT pick songs mainly because they share the same BPM or production style — only emotional atmosphere.",
  lyrics: "Do NOT pick songs mainly because they sound similar or share tempo — only lyrical subject and story.",
};

function sanitizeField(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function usesIndicScript(value: string): boolean {
  return /[\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F\u0D00-\u0D7F]/.test(value);
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

function buildRegionalBlock(anchor: Anchor): string {
  const text = `${anchor.title} ${anchor.artist}`;

  if (!usesIndicScript(text)) {
    return "";
  }

  return `
REGIONAL / NON-ENGLISH ANCHOR:
- The anchor uses a non-Latin script (e.g. Tamil, Hindi, Telugu). Recommend songs in the SAME language and scene when possible.
- Use exact Spotify track titles (native script preferred). Only romanize if you are unsure of the official spelling.
- Include well-known tracks from that language's film/indie/pop catalogs — not generic Western substitutes.
- Spread artists: do not recommend the same singer more than twice.`;
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

function buildMoodAxisBlock(): string {
  return `
CRITICAL — mood & vibe matching rules:
- Match emotional atmosphere only. A slow ballad anchor can match an upbeat song IF the feeling is the same (e.g. both defiant).
- Do NOT recommend songs that merely share genre or tempo with the anchor.
- Vary eras and genres across the list — mood matches should feel surprising, not obvious playlist filler.
- Each "reason" must name the specific emotion or vibe, not production details.`;
}

function buildLyricsAxisBlock(): string {
  return `
CRITICAL — lyrical theme matching rules:
- Match subject matter, narrative arc, and themes. Production and tempo are irrelevant.
- Include songs from different genres if the story/theme aligns.
- Each "reason" must cite the shared lyrical theme explicitly (love, loss, ambition, partying, etc.).`;
}

function buildAxisBlock(anchor: Anchor, axis: Axis): string {
  if (axis === "beat") {
    return buildBeatAxisBlock(anchor);
  }

  if (axis === "mood") {
    return buildMoodAxisBlock();
  }

  return buildLyricsAxisBlock();
}

export function getAxisTemperature(axis: Axis): number {
  if (axis === "beat") {
    return 0.65;
  }

  if (axis === "mood") {
    return 0.82;
  }

  return 0.88;
}

export function buildRecommendPrompt(anchor: Anchor, axis: Axis): string {
  const rules = AXIS_INSTRUCTIONS[axis];
  const axisLabel = AXIS_LABELS[axis];
  const metadataBlock = formatAnchorMetadata(anchor);
  const axisBlock = buildAxisBlock(anchor, axis);
  const regionalBlock = buildRegionalBlock(anchor);

  return `You are a music expert recommending real, existing songs.

ACTIVE AXIS: ${axisLabel.toUpperCase()} (id: ${axis})
This list must be tailored ONLY to ${axisLabel}. A different axis (beat, mood, or lyrics) would produce a DIFFERENT ranked list for the same anchor.

The user selected this exact anchor recording on Spotify:
${metadataBlock}
${axisBlock}
${regionalBlock}

Similarity axis: ${axisLabel}

Recommend exactly ${RECOMMENDATION_REQUEST_COUNT} real songs that exist on major streaming platforms (Spotify).

Rank them by similarity on ${axisLabel} ONLY — strongest match first. Position 1 is the closest match; position ${RECOMMENDATION_REQUEST_COUNT} is the weakest but still relevant.

For this axis:
- ${rules.focus}
- Match on ${rules.match}.
- Explicitly IGNORE ${rules.ignore}.
- ${AXIS_AVOID[axis]}

Requirements:
- Return ONLY a JSON array in ranked order (best match first). No preamble, no markdown fences, no commentary.
- Each item must be an object with exactly these string fields: "title", "artist", "reason".
- "reason" must be one sentence that explicitly references the ${axisLabel} dimension (${rules.reasonHint}).
- Do NOT include the anchor song or any duplicate tracks (no repeat titles, no live/remix/acoustic variants of the same song already listed).
- Every song must be a distinct track — different title or different primary artist.
- Avoid lazy generic picks (e.g. do not default to the same mainstream hits like "Eastside" unless they are genuinely the #1 match on THIS axis).
- All songs must be real and findable on Spotify.

Example format:
[
  {
    "title": "Song Name",
    "artist": "Artist Name",
    "reason": "Matched on ..."
  }
]`;
}
