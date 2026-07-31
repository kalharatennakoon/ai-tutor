"use client";

import Link from "next/link";
import type { Course } from "@/content/types";
import { useProgress } from "@/lib/progress";

const DIFFICULTY_LABEL = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
} as const;

export default function CourseCard({ course }: { course: Course }) {
  const { completedInCourse } = useProgress();
  const done = completedInCourse(
    course.id,
    course.lessons.map((l) => l.id),
  );
  const total = course.lessons.length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <Link
      href={`/learn/${course.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-700 bg-ink-900/60 p-5 transition-all hover:border-ink-600 hover:bg-ink-900"
    >
      {/* Course-coloured wash, revealed on hover. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-br ${course.gradient} opacity-[0.07] transition-opacity group-hover:opacity-[0.14]`}
      />

      <div className="relative flex items-start justify-between gap-3">
        <span
          aria-hidden="true"
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${course.gradient} text-xl shadow-lg`}
        >
          {course.glyph}
        </span>
        <span className="rounded-full border border-ink-700 bg-ink-950/70 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-ink-400">
          {DIFFICULTY_LABEL[course.difficulty]}
        </span>
      </div>

      <h3 className="relative mt-4 text-lg font-semibold tracking-tight text-ink-100">
        {course.title}
      </h3>
      <p className="relative mt-1 text-sm text-ink-400">{course.tagline}</p>
      <p className="relative mt-3 flex-1 text-[13px] leading-relaxed text-ink-500">
        {course.description}
      </p>

      <div className="relative mt-5">
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-ink-500">
          <span>
            {done} of {total} lessons
          </span>
          <span className="font-mono">{percent}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-ink-800">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${course.gradient} transition-[width] duration-500`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
