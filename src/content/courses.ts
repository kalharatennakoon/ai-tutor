import type { Course, Lesson } from "@/content/types";
import { foundations } from "@/content/lessons/foundations";
import { machineLearning } from "@/content/lessons/ml";
import { rag } from "@/content/lessons/rag";

/** Ordered as a learning path — foundations first. */
export const courses: Course[] = [foundations, machineLearning, rag];

export function getCourse(courseId: string): Course | undefined {
  return courses.find((c) => c.id === courseId);
}

export function getLesson(
  courseId: string,
  lessonId: string,
): { course: Course; lesson: Lesson; index: number } | undefined {
  const course = getCourse(courseId);
  if (!course) return undefined;

  const index = course.lessons.findIndex((l) => l.id === lessonId);
  if (index === -1) return undefined;

  return { course, lesson: course.lessons[index], index };
}

/** Previous/next lesson within a course, for the lesson footer nav. */
export function getLessonNeighbours(courseId: string, lessonId: string) {
  const course = getCourse(courseId);
  if (!course) return { prev: undefined, next: undefined };

  const index = course.lessons.findIndex((l) => l.id === lessonId);
  return {
    prev: index > 0 ? course.lessons[index - 1] : undefined,
    next: index < course.lessons.length - 1 ? course.lessons[index + 1] : undefined,
  };
}

export const totalLessonCount = courses.reduce(
  (sum, course) => sum + course.lessons.length,
  0,
);

/** Every (courseId, lessonId) pair — used to statically generate lesson routes. */
export function allLessonParams() {
  return courses.flatMap((course) =>
    course.lessons.map((lesson) => ({
      courseId: course.id,
      lessonId: lesson.id,
    })),
  );
}
