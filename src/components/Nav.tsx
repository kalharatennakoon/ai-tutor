"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { courses, totalLessonCount } from "@/content/courses";
import { useProgress } from "@/lib/progress";
import { cx } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  ...courses.map((c) => ({ href: `/learn/${c.id}`, label: c.title })),
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { totalCompleted } = useProgress();

  // Close the mobile menu whenever navigation occurs.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/20">
            AI
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-ink-100">
            AI&nbsp;Tutor
          </span>
        </Link>

        {/* Desktop links */}
        <div className="ml-4 hidden flex-1 items-center gap-1 md:flex">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cx(
                  "rounded-lg px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-ink-800 text-ink-100"
                    : "text-ink-400 hover:bg-ink-850 hover:text-ink-200",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden rounded-full border border-ink-700 bg-ink-900 px-3 py-1 text-xs font-medium text-ink-400 sm:block">
            {totalCompleted}/{totalLessonCount} lessons
          </span>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid h-9 w-9 place-items-center rounded-lg border border-ink-700 text-ink-300 transition-colors hover:bg-ink-850 md:hidden"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              aria-hidden="true"
            >
              {open ? (
                <>
                  <path d="M3.5 3.5l9 9" />
                  <path d="M12.5 3.5l-9 9" />
                </>
              ) : (
                <>
                  <path d="M2.5 4.5h11" />
                  <path d="M2.5 8h11" />
                  <path d="M2.5 11.5h11" />
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div id="mobile-menu" className="border-t border-ink-800 px-5 py-3 md:hidden">
          <ul className="flex flex-col gap-1">
            {links.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cx(
                      "block rounded-lg px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-ink-800 text-ink-100"
                        : "text-ink-400 hover:bg-ink-850 hover:text-ink-200",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
}
