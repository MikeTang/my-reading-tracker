"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import AddBookModal from "@/components/AddBookModal";
import TasteInterviewModal from "@/components/TasteInterviewModal";
import StarRating from "@/components/StarRating";
import { getAllBooks } from "@/lib/books";
import { BookEntry } from "@/lib/types";
import { coverUrl } from "@/lib/openLibrary";

// Deterministic spine colour for book cards
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
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  return SPINE_CLASSES[Math.abs(hash) % SPINE_CLASSES.length];
}

export default function Home() {
  const [books, setBooks] = useState<BookEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [interviewBook, setInterviewBook] = useState<BookEntry | null>(null);

  // Load from localStorage only on the client to avoid SSR mismatch
  useEffect(() => {
    setBooks(getAllBooks());
    setHydrated(true);
  }, []);

  const handleSaved = useCallback((entry: BookEntry) => {
    setBooks((prev) => [entry, ...prev]);
  }, []);

  const recentBooks = books
    .slice()
    .sort((a, b) => b.dateFinished.localeCompare(a.dateFinished))
    .slice(0, 6);

  const avgRating =
    books.length > 0
      ? (books.reduce((s, b) => s + b.rating, 0) / books.length).toFixed(1)
      : "—";

  const booksThisYear = books.filter(
    (b) => b.dateFinished.startsWith(String(new Date().getFullYear()))
  ).length;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activePage="dashboard" />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h1 className="font-lora text-xl font-semibold text-slate-800">
              Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {hydrated
                ? `${books.length} book${books.length !== 1 ? "s" : ""} logged`
                : "Loading…"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Inline search bar → opens modal pre-filled */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z"
                />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setShowModal(true)}
                onFocus={() => setShowModal(true)}
                placeholder="Search a book to add…"
                className="pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl w-60 focus:outline-none focus:ring-2 focus:ring-violet-300 text-slate-600 placeholder-slate-400"
                readOnly
              />
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Log a Book
            </button>
          </div>
        </header>

        <div className="px-8 py-6 space-y-8">
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              label="Books Read"
              value={hydrated ? String(books.length) : "—"}
              sub={
                hydrated && booksThisYear > 0
                  ? `${booksThisYear} this year`
                  : "Start logging below"
              }
              subColor="text-emerald-500"
            />
            <StatCard
              label="Avg. Rating"
              value={
                <span>
                  {avgRating}{" "}
                  {books.length > 0 && (
                    <span className="text-yellow-400 text-2xl">★</span>
                  )}
                </span>
              }
              sub={
                books.length > 0
                  ? `across ${books.length} rating${books.length !== 1 ? "s" : ""}`
                  : "No ratings yet"
              }
            />
            <StatCard
              label="Top Genre"
              value={
                <span className="font-lora italic text-xl">
                  {getTopGenre(books) ?? "—"}
                </span>
              }
              sub={books.length > 0 ? "from your subjects" : "Log books to build profile"}
            />
            <StatCard
              label="Top Mood"
              value={
                <span className="font-lora italic text-xl">
                  {getTopMood(books) ?? "—"}
                </span>
              }
              sub={books.length > 0 ? "most common tag" : "Set moods when logging"}
            />
          </div>

          {/* Empty state */}
          {hydrated && books.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-violet-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                  />
                </svg>
              </div>
              <h2 className="font-lora text-xl font-semibold text-slate-700 mb-2">
                Your shelf is empty
              </h2>
              <p className="text-sm text-slate-400 max-w-xs mb-6">
                Search for the first book you finished and log it — Shelf will
                start learning your taste.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Log your first book
              </button>
            </div>
          )}

          {/* Recently finished */}
          {recentBooks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-700">
                  Recently Finished
                </h2>
                <a href="/shelf" className="text-sm text-violet-500 hover:text-violet-700 transition">View all library →</a>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {recentBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <AddBookModal
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

// ─────────────── Helpers ───────────────

function StatCard({
  label,
  value,
  sub,
  subColor = "text-slate-400",
}: {
  label: string;
  value: React.ReactNode;
  sub: string;
  subColor?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
        {label}
      </p>
      <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
      <p className={`text-xs ${subColor} mt-1`}>{sub}</p>
    </div>
  );
}

function BookCard({ book }: { book: BookEntry }) {
  const spine = spineClass(book.openLibraryKey);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex gap-4 hover:shadow-md transition">
      {/* Cover / spine */}
      <div
        className={`w-14 h-20 rounded-lg flex-shrink-0 shadow flex items-end p-1.5 relative overflow-hidden ${spine}`}
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
            className="text-white font-lora italic leading-tight relative z-10"
            style={{ fontSize: "0.6rem" }}
          >
            {book.title.split(" ").slice(0, 2).join(" ")}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-slate-800 text-sm leading-snug truncate">
          {book.title}
        </h4>
        <p className="text-xs text-slate-400">{book.author}</p>
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
          <div className="flex flex-wrap gap-1 mt-1.5">
            {book.moodTags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full"
                style={{ fontSize: "0.65rem" }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Derive top genre from subjects array across all books. */
function getTopGenre(books: BookEntry[]): string | null {
  const freq: Record<string, number> = {};
  for (const b of books) {
    for (const s of b.subjects ?? []) {
      const key = s.toLowerCase();
      freq[key] = (freq[key] ?? 0) + 1;
    }
  }
  const entries = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return null;
  // Capitalise first letter of each word
  return entries[0][0].replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Derive top mood from moodTags across all books. */
function getTopMood(books: BookEntry[]): string | null {
  const freq: Record<string, number> = {};
  for (const b of books) {
    for (const t of b.moodTags) {
      freq[t] = (freq[t] ?? 0) + 1;
    }
  }
  const entries = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? null;
}
