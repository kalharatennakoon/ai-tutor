import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { courses, getCourse } from "@/content/courses";
import LessonList from "@/components/LessonList";
import TutorChat from "@/components/TutorChat";

type Params = { courseId: string };

export function generateStaticParams() {
  return courses.map((course) => ({ courseId: course.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { courseId } = await params;
  const course = getCourse(courseId);
  if (!course) return { title: "Course not found" };

  return {
    title: course.title,
    description: course.description,
  };
}

export default async function CoursePage({ params }: { params: Promise<Params> }) {
  const { courseId } = await params;
  const course = getCourse(courseId);
  if (!course) notFound();

  const totalMinutes = course.lessons.reduce((sum, l) => sum + l.minutes, 0);

  return (
    <>
      <div className="mx-auto max-w-4xl px-5 py-12">
        <Link
          href="/"
          className="text-sm text-ink-500 transition-colors hover:text-ink-300"
        >
          ← All courses
        </Link>

        <header className="mt-6 flex flex-wrap items-start gap-5">
          <span
            aria-hidden="true"
            className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${course.gradient} text-3xl shadow-xl`}
          >
            {course.glyph}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-semibold tracking-tight text-ink-100 sm:text-4xl">
              {course.title}
            </h1>
            <p className="mt-1.5 text-lg text-ink-400">{course.tagline}</p>
          </div>
        </header>

        <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-ink-400">
          {course.description}
        </p>

        <div className="mt-5 flex flex-wrap gap-2 text-xs text-ink-500">
          {[
            `${course.lessons.length} lessons`,
            `~${totalMinutes} min`,
            course.difficulty,
          ].map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-ink-700 bg-ink-900 px-3 py-1 capitalize"
            >
              {chip}
            </span>
          ))}
        </div>

        <LessonList course={course} />
      </div>

      <TutorChat />
    </>
  );
}
