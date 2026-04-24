/**
 * Rule-based recommendation engine.
 *
 * Strategy:
 *  1. Read the user's ReadingProfile (top moods, themes) and logged books.
 *  2. Build up to 3 targeted Open Library search queries from the profile.
 *  3. Fire queries in parallel, deduplicate by OL key, and filter out any
 *     book the user has already logged.
 *  4. Return 6–10 results, each annotated with a human-readable reason.
 *
 * All execution is browser-side; no server or API key required.
 */

import { OpenLibraryBook } from "./types";
import { ReadingProfile } from "./types";
import { coverUrl } from "./openLibrary";

const BASE = "https://openlibrary.org/search.json";
const FIELDS = "key,title,author_name,first_publish_year,cover_i,subject";

/** A recommendation result — an OL book plus why we picked it. */
export interface Recommendation {
  book: OpenLibraryBook;
  reason: string;
  coverUrl: string | null;
}

/** One search "slot": a query string + a reason template to attach to results. */
interface QuerySlot {
  query: string;
  reason: string;
}

// ─── Theme → OL subject mapping ────────────────────────────────────────────
// Maps our internal theme tags to Open Library subject search terms.
const THEME_TO_SUBJECT: Record<string, string> = {
  Family: "family",
  Identity: "identity",
  Love: "love stories",
  Power: "power politics",
  Survival: "survival",
  Nature: "nature",
  Politics: "political fiction",
  "Coming of Age": "coming of age",
  War: "war fiction",
  Technology: "technology",
  Spirituality: "spirituality",
  Friendship: "friendship",
};

// ─── Mood → OL subject mapping ──────────────────────────────────────────────
const MOOD_TO_SUBJECT: Record<string, string> = {
  Reflective: "philosophical fiction",
  Adventurous: "adventure stories",
  Cozy: "cozy mystery",
  Melancholy: "melancholy",
  Inspired: "inspirational",
  Tense: "psychological thriller",
  Hopeful: "hope",
  Calm: "meditative fiction",
};

/** Return top N keys from a frequency map, sorted descending by count. */
function topKeys(map: Record<string, number>, n: number): string[] {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

/**
 * Derive up to 3 query slots from the profile.
 * Falls back to popular literary fiction when the profile is sparse.
 */
export function buildQuerySlots(profile: ReadingProfile | null): QuerySlot[] {
  const slots: QuerySlot[] = [];

  if (!profile || profile.interviewCount === 0) {
    // Cold-start fallback — broad popular fiction queries
    return [
      { query: "subject:literary+fiction", reason: "Popular in literary fiction" },
      { query: "subject:historical+fiction", reason: "Popular in historical fiction" },
      { query: "subject:mystery", reason: "Popular mysteries" },
    ];
  }

  // Slot 1: top theme
  const topThemes = topKeys(profile.themeFrequency, 2);
  if (topThemes.length > 0) {
    const subjectTerm = THEME_TO_SUBJECT[topThemes[0]] ?? topThemes[0].toLowerCase();
    const label = topThemes.length > 1
      ? `${topThemes[0]} and ${topThemes[1]}`
      : topThemes[0];
    slots.push({
      query: `subject:${encodeURIComponent(subjectTerm)}`,
      reason: `Because you love ${label} themes`,
    });
  }

  // Slot 2: top mood
  const topMoods = topKeys(profile.moodFrequency, 2);
  if (topMoods.length > 0) {
    const subjectTerm = MOOD_TO_SUBJECT[topMoods[0]] ?? topMoods[0].toLowerCase();
    const label = topMoods.length > 1
      ? `${topMoods[0].toLowerCase()} and ${topMoods[1].toLowerCase()} reads`
      : `${topMoods[0].toLowerCase()} reads`;
    slots.push({
      query: `subject:${encodeURIComponent(subjectTerm)}`,
      reason: `Because you enjoy ${label}`,
    });
  }

  // Slot 3: second theme (diversity)
  if (topThemes.length > 1) {
    const subjectTerm = THEME_TO_SUBJECT[topThemes[1]] ?? topThemes[1].toLowerCase();
    slots.push({
      query: `subject:${encodeURIComponent(subjectTerm)}`,
      reason: `Because you resonate with ${topThemes[1]} themes`,
    });
  } else if (topMoods.length > 1) {
    // Fall back to second mood
    const subjectTerm = MOOD_TO_SUBJECT[topMoods[1]] ?? topMoods[1].toLowerCase();
    slots.push({
      query: `subject:${encodeURIComponent(subjectTerm)}`,
      reason: `Because you enjoy ${topMoods[1].toLowerCase()} reads`,
    });
  } else {
    // Fill with a literary fiction fallback
    slots.push({
      query: "subject:literary+fiction",
      reason: "Highly rated literary fiction",
    });
  }

  return slots;
}

/** Fetch a single OL subject/keyword search and return raw docs. */
async function fetchSlot(slot: QuerySlot, perSlot: number): Promise<Array<{ book: OpenLibraryBook; reason: string }>> {
  const url = `${BASE}?q=${slot.query}&fields=${FIELDS}&limit=${perSlot}&sort=rating`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return [];
    const json = await res.json();
    if (!Array.isArray(json?.docs)) return [];
    return (json.docs as OpenLibraryBook[]).map((book) => ({
      book,
      reason: slot.reason,
    }));
  } catch {
    // Network error or timeout — silently skip this slot
    return [];
  }
}

/**
 * Fetch recommendations.
 *
 * @param profile       User's reading profile (may be null for cold start).
 * @param loggedKeys    Set of openLibraryKey strings already in the user's library.
 * @param target        Desired number of results (default 8, clamped 6–10).
 */
export async function fetchRecommendations(
  profile: ReadingProfile | null,
  loggedKeys: Set<string>,
  target = 8,
): Promise<Recommendation[]> {
  const clampedTarget = Math.min(10, Math.max(6, target));
  const slots = buildQuerySlots(profile);
  // Fetch more than needed per slot so we have room to deduplicate & filter
  const perSlot = Math.ceil((clampedTarget * 3) / slots.length);

  // Fire all slots in parallel
  const slotResults = await Promise.all(
    slots.map((slot) => fetchSlot(slot, perSlot)),
  );

  // Deduplicate by OL key and filter already-logged books
  const seen = new Set<string>();
  const results: Recommendation[] = [];

  for (const batch of slotResults) {
    for (const { book, reason } of batch) {
      if (!book.key) continue;
      if (seen.has(book.key)) continue;
      if (loggedKeys.has(book.key)) continue;
      // Skip books without title or author (data quality guard)
      if (!book.title || !book.author_name?.length) continue;

      seen.add(book.key);
      results.push({
        book,
        reason,
        coverUrl: book.cover_i ? coverUrl(book.cover_i, "M") : null,
      });

      if (results.length >= clampedTarget) break;
    }
    if (results.length >= clampedTarget) break;
  }

  return results;
}
