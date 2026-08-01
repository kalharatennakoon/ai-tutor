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
| AI | Local Ollama (`qwen2.5-coder:7b`), streamed |
| Progress | `localStorage` (no backend, no accounts) |

## Getting started

```bash
ollama pull qwen2.5-coder:7b   # once, if you haven't already
ollama serve                  # if it isn't already running
npm install
npm run dev
```

Open http://localhost:3000.

The courses, quizzes, and all five labs work regardless of the tutor. The
tutor chat streams from a local `ollama` instance — no API key needed. If
Ollama isn't reachable, the chat panel surfaces an inline error explaining
how to start it.

```bash
npm run build         # production build (includes the tutor API route)
npm run build:static  # static export for GitHub Pages → out/
npm run typecheck     # tsc --noEmit
```

## Deployment

### GitHub Pages (static)

Pushing to `main` triggers `.github/workflows/deploy-pages.yml`, which builds a
static export and publishes it. **One manual step is required the first time:**
Settings → Pages → Source → **GitHub Actions**. (The workflow asks to enable
this automatically, but that only succeeds if the token has permission.)

The site is served at `https://<user>.github.io/<repo>/`. The workflow passes
that path prefix to the build via `NEXT_PUBLIC_BASE_PATH`, so renaming the repo
needs no code change.

> **The AI tutor does not work on GitHub Pages.** Pages serves static files
> only, and `/api/tutor` needs a server to reach Ollama. The workflow deletes
> `src/app/api` before building, and the chat panel detects the static build
> and explains this instead of calling a dead endpoint.
>
> Deploy somewhere with server support instead, running Ollama alongside it.

Everything else — all lessons, quizzes, and all five labs — works fully on
Pages, since the labs compute in the browser.

### Anywhere that runs server code

For the complete app including the tutor, deploy to a host that supports
Next.js server rendering (Vercel, Netlify, Cloudflare, a container, a VPS)
and can also reach an Ollama instance (set `OLLAMA_HOST` if it isn't on
`localhost:11434`). No other config changes, since the export settings only
activate when `NEXT_PUBLIC_STATIC_EXPORT=true`.

## Project layout

```
src/
├── app/
│   ├── page.tsx                              # course catalog
│   ├── learn/[courseId]/page.tsx             # course outline
│   ├── learn/[courseId]/[lessonId]/page.tsx  # lesson (statically generated)
│   ├── playground/page.tsx                   # all labs, standalone
│   └── api/tutor/route.ts                    # streaming Ollama endpoint
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
  client appends deltas as they arrive. Internally it reads Ollama's
  newline-delimited JSON chunks from `/api/chat` and re-emits just the text.
- **Model.** Defaults to `qwen2.5-coder:7b`; override with `OLLAMA_MODEL`.
  Ollama host defaults to `http://localhost:11434`; override with
  `OLLAMA_HOST`.
- **Validation.** Message count, roles, and per-message length are checked
  before anything reaches Ollama.

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
