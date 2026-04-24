"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { getProfile } from "@/lib/profile";
import { getAllBooks } from "@/lib/books";
import {
  fetchRecommendations,
  Recommendation,
} from "@/lib/recommendations";
import { ReadingProfile } from "@/lib/types";

// Deterministic spine colour for cards without covers
const SPINE_GRADIENTS = [
  "from-violet-600 to-indigo-500",
  "from-emerald-600 to-teal-500",
  "from-red-600 to-orange-500",
  "from-sky-500 to-indigo-500",
  "from-pink-600 to-purple-500",
  "from-amber-600 to-yellow-500",
];
function spineGradient(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++)
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  return SPINE_GRADIENTS[Math.abs(hash) % SPINE_GRADIENTS.length];
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function RecommendationsPage() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [profile, setProfile] = useState<ReadingProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = getProfile();
      setProfile(p);
      const books = getAllBooks();
      const loggedKeys = new Set(books.map((b) => b.openLibraryKey));
      const results = await fetchRecommendations(p, loggedKeys, 8);
      setRecs(results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setHydrated(true);
    load();
  }, [load]);

  // Derive summary text for the subheader
  const summaryLine = profile && profile.interviewCount > 0
    ? buildSummaryLine(profile)
    : null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activePage="recommendations" />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h1 className="font-lora text-xl font-semibold text-slate-800">
              Recommended For You
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {hydrated && !loading
                ? summaryLine
                  ? summaryLine
                  : "Log a few books to sharpen your recommendations"
                : "Loading your taste profile…"}
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 text-sm text-violet-600 border border-violet-200 hover:bg-violet-50 px-4 py-2 rounded-xl transition disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </header>

        <div className="px-8 py-6">
          {/* Error state */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 rounded-2xl px-5 py-4 text-sm text-red-700 flex items-center gap-3">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              {error} — <button onClick={load} className="underline ml-1">Try again</button>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-pulse">
                  <div className="h-24 bg-slate-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                    <div className="h-3 bg-slate-100 rounded w-full mt-3" />
                    <div className="h-7 bg-slate-100 rounded mt-3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state — no profile yet */}
          {!loading && !error && recs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <h2 className="font-lora text-lg font-semibold text-slate-700 mb-2">No recommendations yet</h2>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                Log a few books and complete their check-ins so Shelf can learn your taste.
              </p>
              <a
                href="/"
                className="mt-6 inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
              >
                Go log a book →
              </a>
            </div>
          )}

          {/* Results grid */}
          {!loading && recs.length > 0 && (
            <>
              <div className="grid grid-cols-4 gap-4">
                {recs.map((rec) => (
                  <RecCard key={rec.book.key} rec={rec} />
                ))}
              </div>

              {/* Profile context panel */}
              {profile && profile.interviewCount > 0 && (
                <ProfileContext profile={profile} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Recommendation Card ─────────────────────────────────────────────────────

function RecCard({ rec }: { rec: Recommendation }) {
  const { book, reason, coverUrl } = rec;
  const gradient = spineGradient(book.key);
  const author = book.author_name?.[0] ?? "Unknown author";
  const year = book.first_publish_year;
  const olUrl = `https://openlibrary.org${book.key}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition group flex flex-col">
      {/* Cover / coloured spine */}
      <div className={`h-24 bg-gradient-to-br ${gradient} flex items-end p-3 relative flex-shrink-0`}>
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={book.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-white font-lora italic text-sm leading-tight line-clamp-2 relative z-10">
            {book.title}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <h4 className="font-medium text-slate-800 text-sm leading-snug line-clamp-2">
          {book.title}
        </h4>
        <p className="text-xs text-slate-400 mt-0.5">
          {author}{year ? ` · ${year}` : ""}
        </p>

        {/* Tags from subjects */}
        {book.subject && book.subject.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {book.subject.slice(0, 2).map((s) => (
              <span
                key={s}
                className="text-[0.7rem] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Reason */}
        <p className="text-xs text-slate-500 mt-2 leading-relaxed flex-1 line-clamp-2">
          {reason}
        </p>

        {/* CTA */}
        <a
          href={olUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 w-full text-xs font-medium text-violet-600 border border-violet-200 hover:bg-violet-50 py-1.5 rounded-lg transition text-center"
        >
          View on Open Library ↗
        </a>
      </div>
    </div>
  );
}

// ─── Profile context panel ───────────────────────────────────────────────────

function ProfileContext({ profile }: { profile: ReadingProfile }) {
  const topThemes = topKeysLocal(profile.themeFrequency, 3);
  const topMoods = topKeysLocal(profile.moodFrequency, 3);
  const avgRating =
    profile.interviewCount > 0
      ? (profile.ratingSum / profile.interviewCount).toFixed(1)
      : "—";

  return (
    <div className="mt-8 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <h3 className="font-semibold text-slate-700 mb-1">Your Taste Profile</h3>
      <p className="text-xs text-slate-400 mb-4">
        Based on {profile.interviewCount} completed check-in{profile.interviewCount !== 1 ? "s" : ""}
      </p>
      <div className="grid grid-cols-3 gap-6">
        {/* Themes */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Top Themes
          </p>
          <div className="space-y-1">
            {topThemes.length > 0
              ? topThemes.map((t) => (
                  <div key={t} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" />
                    <span className="text-sm text-slate-700">{t}</span>
                    <span className="text-xs text-slate-400 ml-auto">
                      ×{profile.themeFrequency[t]}
                    </span>
                  </div>
                ))
              : <p className="text-xs text-slate-400">None yet</p>}
          </div>
        </div>
        {/* Moods */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Top Moods
          </p>
          <div className="space-y-1">
            {topMoods.length > 0
              ? topMoods.map((m) => (
                  <div key={m} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                    <span className="text-sm text-slate-700">{m}</span>
                    <span className="text-xs text-slate-400 ml-auto">
                      ×{profile.moodFrequency[m]}
                    </span>
                  </div>
                ))
              : <p className="text-xs text-slate-400">None yet</p>}
          </div>
        </div>
        {/* Stats */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Stats
          </p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">★</span>
              <span className="text-sm text-slate-700">Avg rating</span>
              <span className="text-xs font-semibold text-slate-800 ml-auto">{avgRating}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-violet-400">✓</span>
              <span className="text-sm text-slate-700">Check-ins</span>
              <span className="text-xs font-semibold text-slate-800 ml-auto">{profile.interviewCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function topKeysLocal(map: Record<string, number>, n: number): string[] {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

function buildSummaryLine(profile: ReadingProfile): string {
  const themes = topKeysLocal(profile.themeFrequency, 2);
  const moods = topKeysLocal(profile.moodFrequency, 1);
  const parts: string[] = [];
  if (themes.length > 0) parts.push(themes.join(" & ").toLowerCase() + " themes");
  if (moods.length > 0) parts.push(moods[0].toLowerCase() + " reads");
  if (parts.length === 0) return "Personalised picks based on your reading history";
  return `Based on your love of ${parts.join(", and ")}`;
}
