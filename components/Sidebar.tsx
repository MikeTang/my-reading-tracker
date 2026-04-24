"use client";

type ActivePage = "dashboard" | "shelf" | "search" | "recommendations" | "profile";

interface Props {
  activePage?: ActivePage;
}

export default function Sidebar({ activePage = "dashboard" }: Props) {
  const activeClass =
    "flex items-center gap-3 px-3 py-2.5 rounded-xl bg-violet-50 text-violet-700 font-medium text-sm";
  const inactiveClass =
    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 text-sm transition";

  return (
    <aside className="w-56 bg-white border-r border-slate-100 flex flex-col py-6 px-4 shadow-sm flex-shrink-0">
      {/* Logo */}
      <div className="mb-8 px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
              />
            </svg>
          </div>
          <span className="font-lora text-lg font-semibold text-slate-800">
            Shelf
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1 pl-10">Reading Tracker</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        <a
          href="/"
          className={activePage === "dashboard" ? activeClass : inactiveClass}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Dashboard
        </a>
        <a
          href="/shelf"
          className={activePage === "shelf" ? activeClass : inactiveClass}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          My Library
        </a>
        <a
          href="#"
          className={activePage === "search" ? activeClass : inactiveClass}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
          </svg>
          Search Books
        </a>
        <a
          href="#"
          className={activePage === "recommendations" ? activeClass : inactiveClass}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          Recommendations
        </a>
        <a
          href="#"
          className={activePage === "profile" ? activeClass : inactiveClass}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          Taste Profile
        </a>
      </nav>

      {/* Bottom status */}
      <div className="mt-auto border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-xs font-medium text-violet-600">
            R
          </div>
          <div>
            <p className="text-xs font-medium text-slate-700">Reader</p>
            <p className="text-xs text-slate-400">18 books logged</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
