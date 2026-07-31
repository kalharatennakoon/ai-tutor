import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allLessonParams, getLesson, getLessonNeighbours } from "@/content/courses";
import LessonRenderer from "@/components/LessonRenderer";
import LessonFooter from "@/components/LessonFooter";
import TutorChat from "@/components/TutorChat";

type Params = { courseId: string; lessonId: string };

export function generateStaticParams() {
  return allLessonParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { courseId, lessonId } = await params;
  const found = getLesson(courseId, lessonId);
  if (!found) return { title: "Lesson not found" };

  return {
    title: `${found.lesson.title} — ${found.course.title}`,
    description: found.lesson.summary,
  };
}

export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { courseId, lessonId } = await params;
  const found = getLesson(courseId, lessonId);
  if (!found) notFound();

  const { course, lesson, index } = found;
  const { prev, next } = getLessonNeighbours(courseId, lessonId);

  return (
    <>
      <article className="mx-auto max-w-3xl px-5 py-10">
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-ink-500">
          <Link href="/" className="transition-colors hover:text-ink-300">
            Courses
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href={`/learn/${course.id}`}
            className="transition-colors hover:text-ink-300"
          >
            {course.title}
          </Link>
        </nav>

        <header className="mt-5 border-b border-ink-800 pb-6">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-indigo-400">
            Lesson {index + 1} of {course.lessons.length} · {lesson.minutes} min
          </p>
          <h1 className="mt-2.5 text-3xl font-semibold leading-tight tracking-tight text-ink-100 sm:text-4xl">
            {lesson.title}
          </h1>
          <p className="mt-2 text-[15px] text-ink-400">{lesson.summary}</p>
        </header>

        <div className="mt-2">
          <LessonRenderer blocks={lesson.blocks} />
        </div>

        <LessonFooter
          courseId={course.id}
          lessonId={lesson.id}
          prev={prev}
          next={next}
        />
      </article>

      <TutorChat
        lessonContext={{
          courseTitle: course.title,
          lessonTitle: lesson.title,
          summary: lesson.summary,
        }}
      />
    </>
  );
}
