// localStorage-based persistence for BookEntry records.
// All reads/writes are synchronous and browser-only — guard with
// typeof window !== 'undefined' before calling at module scope.

import { BookEntry, STORAGE_KEY } from "./types";

function read(): BookEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Corrupted data — start fresh rather than crashing
    return [];
  }
}

function write(entries: BookEntry[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function getAllBooks(): BookEntry[] {
  return read();
}

export function getBook(id: string): BookEntry | undefined {
  return read().find((b) => b.id === id);
}

export function saveBook(entry: BookEntry): void {
  const entries = read();
  const idx = entries.findIndex((b) => b.id === entry.id);
  if (idx >= 0) {
    entries[idx] = entry;
  } else {
    entries.push(entry);
  }
  write(entries);
}

export function deleteBook(id: string): void {
  write(read().filter((b) => b.id !== id));
}

/** True if a book with this openLibraryKey is already logged. */
export function isAlreadyLogged(openLibraryKey: string): boolean {
  return read().some((b) => b.openLibraryKey === openLibraryKey);
}

/** Simple UUID v4 — no external deps needed for browser-only code. */
export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
