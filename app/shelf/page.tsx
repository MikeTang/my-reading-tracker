"use client";

/**
 * My Books — shelf/list view
 *
 * Shows every logged BookEntry in a responsive grid.
 * Clicking a card opens BookDetailModal for full detail, edit, and delete.
 * Includes sort and filter controls so the shelf stays manageable.
 */

import { useState, useEffect, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import StarRating from "@/components/StarRating";
import BookDetailModal from "@/components/BookDetailModal";
import AddBookModal from "@/components/AddBookModal";
import { getAllBooks } from "@/lib/books";
import { coverUrl } from "@/lib/openLibrary";
import { BookEntry, MoodTag, MOOD_TAGS } from "@/lib/types";

// ── Spine colours ─────────────────────────────────────────────────────────────
const SPINE_CLASSES = [
  "book-spine",
  "book-spine-2",
  "book-spine-3",
  "book-spine-4",
  "book-spine-5",
  "book-spine-6",
];
function spineClass(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++)
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  return SPINE_CLASSES[Math.abs(hash) % SPINE_CLASSES.length];
}

// ── Mood pill colours ─────────────────────────────────────────────────────────
const MOOD_COLOURS: Record<MoodTag, string> = {
  Reflective: "bg-violet-100 text-violet-700",
  Adventurous: "bg-orange-100 text-orange-700",
  Cozy: "bg-amber-100 text-amber-700",
  Melancholy: "bg-blue-100 text-blue-700",
  Inspired: "bg-emerald-100 text-emerald-700",
  Tense: "bg-rose-100 text-rose-700",
  Hopeful: "bg-sky-100 text-sky-700",
  Calm: "bg-teal-100 text-teal-700",
};

type SortKey = "dateFinished" | "rating" | "title";

// ── Book card ─────────────────────────────────────────────────────────────────
function ShelfBookCard({
  book,
  onClick,
}: {
  book: BookEntry;
  onClick: () => void;
}) {
  const spine = spineClass(book.openLibraryKey);

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex gap-4 hover:shadow-md hover:border-violet-100 transition text-left w-full group"
      aria-label={`View details for ${book.title}`}
    >
      {/* Cover / spine */}
      <div
        className={`w-16 h-24 rounded-xl flex-shrink-0 shadow relative overflow-hidden ${spine}`}
      >
        {book.coverId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl(book.coverId, "S")}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <span
            className="absolute bottom-2 left-1.5 right-1.5 text-white font-lora italic leading-tight z-10"
            style={{ fontSize: "0.6rem" }}
          >
            {book.title.split(" ").slice(0, 3).join(" ")}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-slate-800 text-sm leading-snug truncate group-hover:text-violet-700 transition">
          {book.title}
        </h3>
        <p className="text-xs text-slate-400 mt-0.5 truncate">{book.author}</p>

        <div className="mt-1.5">
          <StarRating value={book.rating} size="sm" readonly />
        </div>

        <p className="text-xs text-slate-400 mt-1.5">
          {new Date(book.dateFinished + "T00:00:00").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>

        {book.moodTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {book.moodTags.slice(0, 3).map((t) => (
              <span
                key={t}
                className={`text-xs px-2 py-0.5 rounded-full ${MOOD_COLOURS[t]}`}
                style={{ fontSize: "0.65rem" }}
              >
                {t}
              </span>
            ))}
            {book.moodTags.length > 3 && (
              <span
                className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-400"
                style={{ fontSize: "0.65rem" }}
              >
                +{book.moodTags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Chevron hint */}
      <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition text-slate-300">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ShelfPage() {
  const [books, setBooks] = useState<BookEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookEntry | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Filters + sort
  const [search, setSearch] = useState("");
  const [moodFilter, setMoodFilter] = useState<MoodTag | "">("");
  const [sortKey, setSortKey] = useState<SortKey>("dateFinished");

  useEffect(() => {
    setBooks(getAllBooks());
    setHydrated(true);
  }, []);

  // ── Derived list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = books;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q)
      );
    }

    if (moodFilter) {
      list = list.filter((b) => b.moodTags.includes(moodFilter));
    }

    const sorted = [...list].sort((a, b) => {
      if (sortKey === "rating") return b.rating - a.rating;
      if (sortKey === "title") return a.title.localeCompare(b.title);
      // dateFinished desc
      return b.dateFinished.localeCompare(a.dateFinished);
    });

    return sorted;
  }, [books, search, moodFilter, sortKey]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleUpdated(updated: BookEntry) {
    setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setSelectedBook(updated);
  }

  function handleDeleted(id: string) {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    setSelectedBook(null);
  }

  function handleSaved(entry: BookEntry) {
    setBooks((prev) => {
      const exists = prev.some((b) => b.id === entry.id);
      return exists
        ? prev.map((b) => (b.id === entry.id ? entry : b))
        : [entry, ...prev];
    });
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const avgRating =
    books.length > 0
      ? (books.reduce((s, b) => s + b.rating, 0) / books.length).toFixed(1)
      : "—";

  const topMood = useMemo(() => {
    const counts: Partial<Record<MoodTag, number>> = {};
    for (const b of books) {
      for (const t of b.moodTags) counts[t] = (counts[t] ?? 0) + 1;
    }
    const entries = Object.entries(counts) as [MoodTag, number][];
    if (!entries.length) return null;
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  }, [books]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activePage="shelf" />

      <main className="flex-1 overflow-y-auto bg-slate-50">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-10 bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h1 className="font-lora text-xl font-semibold text-slate-800">
              My Books
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {hydrated
                ? `${books.length} book${books.length !== 1 ? "s" : ""} logged`
                : "Loading…"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search within shelf */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title or author…"
                className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl w-56 focus:outline-none focus:ring-2 focus:ring-violet-300 text-slate-600 placeholder-slate-400"
              />
            </div>

            {/* Log a book */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Log a Book
            </button>
          </div>
        </header>

        <div className="px-8 py-6 space-y-6">

          {/* ── Quick stats strip ──────────────────────────────────────────── */}
          {hydrated && books.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total books</p>
                  <p className="text-2xl font-bold text-slate-800">{books.length}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-500 flex-shrink-0 text-lg">
                  ★
                </div>
                <div>
                  <p className="text-xs text-slate-400">Avg rating</p>
                  <p className="text-2xl font-bold text-slate-800">{avgRating}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-500 flex-shrink-0 text-base">
                  🌙
                </div>
                <div>
                  <p className="text-xs text-slate-400">Top mood</p>
                  <p className="text-lg font-bold text-slate-800">{topMood ?? "—"}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Filter + sort bar ─────────────────────────────────────────── */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Mood filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setMoodFilter("")}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  moodFilter === ""
                    ? "bg-violet-600 text-white border-violet-600 font-medium"
                    : "border-slate-200 text-slate-500 hover:border-violet-300 hover:text-violet-600"
                }`}
              >
                All moods
              </button>
              {MOOD_TAGS.map((mood) => (
                <button
                  key={mood}
                  onClick={() => setMoodFilter(moodFilter === mood ? "" : mood)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition ${
                    moodFilter === mood
                      ? `${MOOD_COLOURS[mood]} border-transparent font-medium`
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {mood}
                </button>
              ))}
            </div>

            {/* Sort select */}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-slate-400">Sort:</span>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-violet-300"
              >
                <option value="dateFinished">Date finished</option>
                <option value="rating">Rating</option>
                <option value="title">Title A–Z</option>
              </select>
            </div>
          </div>

          {/* ── Book grid ─────────────────────────────────────────────────── */}
          {!hydrated ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex gap-4 animate-pulse"
                >
                  <div className="w-16 h-24 rounded-xl bg-slate-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 bg-slate-100 rounded w-3/4" />
                    <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                    <div className="h-2.5 bg-slate-100 rounded w-1/3 mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              {books.length === 0 ? (
                <>
                  <div className="text-5xl mb-4">📚</div>
                  <h2 className="font-lora text-xl font-semibold text-slate-700 mb-2">
                    Your shelf is empty
                  </h2>
                  <p className="text-sm text-slate-400 mb-6">
                    Log your first book to start building your reading history.
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Log your first book
                  </button>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-sm text-slate-400">
                    No books match your current filters.
                  </p>
                  <button
                    onClick={() => { setSearch(""); setMoodFilter(""); }}
                    className="mt-3 text-xs text-violet-600 hover:text-violet-800 transition underline"
                  >
                    Clear filters
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((book) => (
                <ShelfBookCard
                  key={book.id}
                  book={book}
                  onClick={() => setSelectedBook(book)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── Book detail modal ────────────────────────────────────────────── */}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}

      {/* ── Add book modal ───────────────────────────────────────────────── */}
      {showAddModal && (
        <AddBookModal
          onClose={() => setShowAddModal(false)}
          onSaved={(entry) => {
            handleSaved(entry);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}
