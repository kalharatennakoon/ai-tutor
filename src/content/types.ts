/**
 * Lesson content is authored as a list of blocks rather than raw MDX so that
 * interactive widgets (quizzes, labs) are first-class data. `LessonRenderer`
 * maps each block to a component.
 */

export type Difficulty = "beginner" | "intermediate" | "advanced";

/** IDs of the interactive labs registered in `src/components/labs/registry.tsx`. */
export type LabId =
  | "tokenizer"
  | "embeddings"
  | "rag-pipeline"
  | "gradient-descent"
  | "temperature";

export type QuizOption = {
  text: string;
  correct: boolean;
  /** Shown after the learner picks this option — explain right *and* wrong answers. */
  explanation: string;
};

export type Block =
  /** Markdown-lite prose: paragraphs, `inline code`, **bold**, lists, headings. */
  | { type: "text"; body: string }
  | { type: "heading"; text: string }
  | { type: "callout"; tone: "info" | "warn" | "key"; title: string; body: string }
  | { type: "code"; lang: string; caption?: string; body: string }
  | { type: "quiz"; question: string; options: QuizOption[] }
  | { type: "lab"; lab: LabId; title: string; body?: string };

export type Lesson = {
  id: string;
  title: string;
  /** One-line summary shown in the course outline. */
  summary: string;
  /** Rough reading + interaction time, in minutes. */
  minutes: number;
  blocks: Block[];
};

export type Course = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  difficulty: Difficulty;
  /** Emoji used as the course glyph — keeps the bundle free of image assets. */
  glyph: string;
  /** Tailwind gradient stops, e.g. "from-sky-500 to-indigo-600". */
  gradient: string;
  lessons: Lesson[];
};
