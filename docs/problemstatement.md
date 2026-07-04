# Axis — Music Discovery by Similarity Dimension

## Overview

**Axis** is a music discovery feature designed to feel like a native part of the Spotify app. It lets users explore “more like this song” along a **chosen dimension of similarity** — not a single opaque recommendation score.

When someone loves a track, they pick *what* they want matched: beat & energy, mood & vibe, or lyrical theme. The app returns a small set of real songs aligned on that axis, with real playback. Changing the axis on the same anchor song should produce a visibly different result set. That contrast is the hero interaction and the core of the demo.

**Stack:** Next.js (App Router), deployed on Vercel.

---

## Build Process (Read First)

Before writing any code, present:

1. Planned file structure  
2. System architecture  
3. Spotify + Gemini data flow  

**Do not implement until confirmed.** After approval, build incrementally and pause for testing at each step — do not ship everything at once.

---

## Core User Flow

1. **Search** — User finds an anchor song via the Spotify Web API search endpoint. Results show album art, title, and artist.
2. **Choose axis** — User selects one of three presets:
   - Match the beat & energy  
   - Match the mood & vibe  
   - Match the lyrical theme  
3. **Get recommendations** — App sends anchor song + selected axis to Google Gemini (server-side). Gemini returns 4–5 real, existing songs similar *on that axis*, each with a one-sentence reason.
4. **Enrich & play** — Each song is looked up on Spotify for metadata and album art. Embed the Spotify iframe player so users can hear real samples.
5. **Save (session only)** — User can mark liked songs into an in-session list. No database.

### Hero Behavior

On the same anchor song, switching axis (beat → mood → lyrics) must clearly and smoothly change the recommendations. Make this contrast the centerpiece of the UI.

---

## Architecture

| Layer | Choice |
|-------|--------|
| Framework | Next.js App Router, Vercel deployment |
| Search & metadata | Spotify Web API (Client Credentials — no user login) |
| Similarity reasoning | Google Gemini (`gemini-2.5-flash` via Google AI Studio) |
| Playback | Spotify embed iframe (no login or Premium required) |
| State | In-session React state only — no database |

### Integration Details

- **Spotify:** Client Credentials flow for public catalog search. Store client ID and secret as server-side environment variables.
- **Gemini:** Called from a server-side API route so the API key never reaches the client. Isolate LLM calls in a single module so provider/model can be swapped later.
- **Errors:** Wrap all API calls in try/catch. Show loading states during Gemini and Spotify lookups. Display a visible fallback message on failure.

---

## Hard Constraints

- **Do not use** Spotify audio-features, audio-analysis, or recommendations endpoints — deprecated for new apps (403/fail). All similarity logic comes from Gemini.
- **Gemini output:** Valid JSON only — an array of `{ "title", "artist", "reason" }`. No preamble, no markdown fences. Parse safely; strip stray formatting before parsing.
- **Real songs only.** If Spotify search cannot find a returned track, skip it gracefully — never crash.
- **Loading & errors:** Show loading states; surface user-visible errors on failure.

---

## Gemini Prompt Logic (Critical)

Each axis must produce genuinely different results. Instruct Gemini explicitly:

| Axis | Match on | Ignore |
|------|----------|--------|
| **Beat & energy** | Tempo, rhythm, energy level, instrumentation/production feel | Lyrical content, mood |
| **Mood & vibe** | Emotional feeling or atmosphere | Genre, tempo, instrumentation differences |
| **Lyrical theme** | Subject matter, themes, storytelling | Musical similarity |

**Every response must:**

- Return 4–5 real, existing songs  
- Exclude the anchor song  
- Include a one-sentence reason that names the chosen dimension (e.g. *“Matched on driving four-on-the-floor beat, not lyrics.”*)  
- Make the active axis obvious to the user  

---

## Design — Native Spotify Feel

Goal: a viewer should immediately think *“this is built into Spotify,”* with the axis toggle as the obvious new capability.

### Visual System

- **Background:** `#121212`  
- **Primary / highlights:** Spotify green `#1DB954`  
- **Text:** White titles; secondary `#B3B3B3`  
- **Font:** Montserrat (approximates Spotify’s Circular)

### UI Patterns

- Track rows/cards: album-art thumbnail, bold white title, grey artist, inline play control  
- Persistent bottom player bar in Spotify style  
- **Axis selector (hero element):** prominent segmented pill toggle above results — novel but visually native  

---

## Deployment

Configure for Vercel from the start.

### Required Environment Variables

| Variable | Purpose | Local | Production |
|----------|---------|-------|------------|
| Spotify Client ID | API auth | `.env.local` | Vercel env settings |
| Spotify Client Secret | API auth | `.env.local` | Vercel env settings |
| Gemini API key | Similarity reasoning | `.env.local` | Vercel env settings |

---

## Next Steps

1. Share architecture, file structure, and data flow for review.  
2. After confirmation, implement incrementally with checkpoints for testing.
