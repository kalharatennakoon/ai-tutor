# AI Tutor

A mobile-responsive web app for learning AI, ML, and RAG in an interactive
environment. Every concept ships with something you can manipulate — a
tokenizer, a retrieval pipeline, an optimizer you can push until it diverges —
and a streaming AI tutor answers questions with the current lesson as context.

## Stack

| Piece | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS v4 |
| AI | Claude API via `@anthropic-ai/sdk`, streamed |
| Progress | `localStorage` (no backend, no accounts) |

## Getting started

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000.

The courses, quizzes, and all five labs work **without** an API key — only the
tutor chat needs one. Without a key, `/api/tutor` returns a 503 with a message
explaining what to set, and the chat panel surfaces it inline.

```bash
npm run build      # production build
npm run typecheck  # tsc --noEmit
```

## Project layout

```
src/
├── app/
│   ├── page.tsx                              # course catalog
│   ├── learn/[courseId]/page.tsx             # course outline
│   ├── learn/[courseId]/[lessonId]/page.tsx  # lesson (statically generated)
│   ├── playground/page.tsx                   # all labs, standalone
│   └── api/tutor/route.ts                    # streaming Claude endpoint
├── components/
│   ├── LessonRenderer.tsx                    # maps content blocks → components
│   ├── TutorChat.tsx                         # streaming chat panel
│   ├── Quiz.tsx, Markdown.tsx, CodeBlock.tsx
│   └── labs/                                 # the five interactive labs
├── content/
│   ├── types.ts                              # Course / Lesson / Block model
│   ├── courses.ts                            # registry + lookup helpers
│   └── lessons/                              # course content
└── lib/progress.ts                           # localStorage progress store
```

## Content model

Lessons are **structured block arrays**, not MDX, so interactive widgets are
first-class data rather than embedded components:

```ts
{
  id: "tokens",
  title: "Tokens: The Model's Alphabet",
  summary: "Why models see word fragments, not characters.",
  minutes: 10,
  blocks: [
    { type: "text", body: "Models don't read characters…" },
    { type: "lab", lab: "tokenizer", title: "Tokenizer playground" },
    { type: "quiz", question: "…", options: [{ text, correct, explanation }] },
    { type: "callout", tone: "key", title: "Rule of thumb", body: "…" },
  ],
}
```

### Adding a lesson

1. Add a `Lesson` object to the relevant file in `src/content/lessons/`.
2. That's it — the route, outline entry, prev/next navigation, and progress
   tracking are all derived from the content.

### Adding a lab

1. Write the component in `src/components/labs/`.
2. Add its id to `LabId` in `src/content/types.ts`.
3. Register it in `src/components/labs/registry.tsx` and add a blurb to
   `meta.ts`.

`LABS` is typed `Record<LabId, ComponentType>`, so a missing registration is a
compile error rather than a blank space at runtime.

## Included labs

| Lab | What it teaches |
| --- | --- |
| Tokenizer | Subword splitting, and why chars-per-token varies so much |
| Vector similarity | Cosine vs. Euclidean over a draggable 2D embedding space |
| RAG pipeline | Hybrid retrieval with RRF, plus the assembled prompt |
| Gradient descent | The learning-rate trade-off, including divergence |
| Temperature & top-p | Reshaping a probability distribution |

All labs compute in the browser — no API calls, no keys, nothing to rate-limit.

## Notes on the tutor endpoint

- **Streaming.** `/api/tutor` returns a `ReadableStream` of plain text; the
  client appends deltas as they arrive.
- **Prompt caching.** The tutor persona sits first in the `system` array behind
  a cache breakpoint, with per-lesson context after it. Caching is a prefix
  match, so anything variable must come last.
- **Model.** Defaults to `claude-opus-5`; override with `ANTHROPIC_MODEL`.
  Effort is set to `low` to keep replies snappy, with `max_tokens` headroom
  since thinking and output text share that budget.
- **Validation.** Message count, roles, and per-message length are checked
  before anything reaches the API.

## Two Next.js gotchas this codebase works around

Both cost real debugging time and are commented at the call sites:

1. **`next/dynamic` options must be inline object literals.** Hoisting them
   into a shared `const options` fails the build — the compiler reads them
   statically.
2. **A Server Component importing a value from a `"use client"` module gets a
   client *reference*, not the value.** Lab metadata therefore lives in
   `labs/meta.ts` (no directive) while the component map lives in
   `labs/registry.tsx`. Mixing them produced a `LAB_IDS.map is not a function`
   prerender error.

Additionally, `next.config.ts` sets `experimental.useTypeScriptCli` because
TypeScript 7 no longer exposes the compiler API Next.js links against. Drop the
flag if you pin TypeScript 6.
