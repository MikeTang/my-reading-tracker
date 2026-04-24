// localStorage-backed reading profile.
// The profile is a running aggregate derived from all TasteInterview answers.
// It is updated incrementally — never recomputed from scratch — so it stays
// O(1) per check-in regardless of library size.

import {
  ReadingProfile,
  TasteInterview,
  PROFILE_STORAGE_KEY,
  FrequencyMap,
} from "./types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function blankProfile(): ReadingProfile {
  return {
    interviewCount: 0,
    moodFrequency: {},
    themeFrequency: {},
    enjoymentFrequency: {},
    drewYouInFrequency: {},
    readSimilarFrequency: {},
    ratingSum: 0,
    updatedAt: new Date().toISOString(),
  };
}

function increment(map: FrequencyMap, key: string | undefined): FrequencyMap {
  if (!key) return map;
  return { ...map, [key]: (map[key] ?? 0) + 1 };
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function getProfile(): ReadingProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ReadingProfile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: ReadingProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

/**
 * Apply a completed interview to the stored profile.
 * Creates the profile if it doesn't exist yet.
 */
export function applyInterview(interview: TasteInterview): ReadingProfile {
  const current = getProfile() ?? blankProfile();

  let moodFrequency = { ...current.moodFrequency };
  for (const m of interview.moodTags) {
    moodFrequency = increment(moodFrequency, m);
  }

  let themeFrequency = { ...current.themeFrequency };
  for (const t of interview.themeTags) {
    themeFrequency = increment(themeFrequency, t);
  }

  const updated: ReadingProfile = {
    interviewCount: current.interviewCount + 1,
    moodFrequency,
    themeFrequency,
    enjoymentFrequency: increment(
      current.enjoymentFrequency,
      interview.enjoyment
    ),
    drewYouInFrequency: increment(
      current.drewYouInFrequency,
      interview.drewYouIn
    ),
    readSimilarFrequency: increment(
      current.readSimilarFrequency,
      interview.readSimilar
    ),
    ratingSum: current.ratingSum + interview.rating,
    updatedAt: new Date().toISOString(),
  };

  saveProfile(updated);
  return updated;
}

/** Convenience: top N keys from a frequency map, descending. */
export function topKeys(map: FrequencyMap, n = 3): string[] {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}
