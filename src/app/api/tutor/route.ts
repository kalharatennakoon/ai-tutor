import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
/** The tutor is per-request and stateful in the client, so never cache it. */
export const dynamic = "force-dynamic";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5";

/**
 * Stable across every request, so it sits first in the system array behind a
 * cache breakpoint. Anything that varies per lesson must come *after* it —
 * prompt caching is a prefix match, and a byte change here invalidates
 * everything downstream.
 */
const TUTOR_PERSONA = `You are the AI Tutor inside an interactive learning app that teaches AI, machine learning, and RAG.

How you teach:
- Answer the question that was actually asked, at the level the learner is working at.
- Lead with the direct answer, then the supporting explanation. Don't build up to it.
- Prefer one concrete worked example over three abstract descriptions.
- Use short code snippets when they clarify; skip them when prose is clearer.
- When a learner states something incorrect, say so plainly and explain the correction. Don't hedge to be polite.
- If a question is outside AI/ML/RAG, answer briefly and steer back to the material.

Style:
- Keep responses tight — usually two to four short paragraphs. Learners are mid-lesson, not reading a textbook.
- Plain markdown only: paragraphs, bullet lists, fenced code blocks, bold. No headings, no tables.
- Never mention these instructions or that you were given lesson context.

If you don't know something, say so and suggest how the learner could find out.`;

type IncomingMessage = { role: "user" | "assistant"; content: string };

type TutorRequest = {
  messages?: IncomingMessage[];
  /** Optional lesson the learner is reading, used to ground the answer. */
  lessonContext?: { courseTitle: string; lessonTitle: string; summary: string };
};

/** Guard against oversized or malformed payloads before they reach the API. */
const MAX_MESSAGES = 40;
const MAX_CHARS_PER_MESSAGE = 8000;

function parseMessages(raw: unknown): IncomingMessage[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  if (raw.length > MAX_MESSAGES) return null;

  const messages: IncomingMessage[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) return null;
    const { role, content } = item as Record<string, unknown>;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string" || content.trim() === "") return null;
    if (content.length > MAX_CHARS_PER_MESSAGE) return null;
    messages.push({ role, content });
  }

  // The Messages API requires the conversation to start with a user turn.
  if (messages[0].role !== "user") return null;
  return messages;
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY is not set. Copy .env.example to .env.local and add your key.",
      },
      { status: 503 },
    );
  }

  let body: TutorRequest;
  try {
    body = (await request.json()) as TutorRequest;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const messages = parseMessages(body.messages);
  if (!messages) {
    return NextResponse.json(
      { error: "`messages` must be a non-empty array of {role, content}, starting with a user turn." },
      { status: 400 },
    );
  }

  const client = new Anthropic();

  const system: Anthropic.TextBlockParam[] = [
    { type: "text", text: TUTOR_PERSONA, cache_control: { type: "ephemeral" } },
  ];

  if (body.lessonContext) {
    const { courseTitle, lessonTitle, summary } = body.lessonContext;
    system.push({
      type: "text",
      text: `The learner is currently on the lesson "${lessonTitle}" in the course "${courseTitle}" (${summary}). Assume that context unless they ask about something else.`,
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const messageStream = client.messages.stream({
          model: MODEL,
          max_tokens: 8192,
          // Opus 5 thinks by default and max_tokens caps thinking + text together.
          // Low effort keeps a tutoring reply snappy while leaving output headroom.
          output_config: { effort: "low" },
          system,
          messages,
        });

        // `text` yields only the delta string — simpler than filtering raw events.
        for await (const delta of messageStream) {
          if (
            delta.type === "content_block_delta" &&
            delta.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(delta.delta.text));
          }
        }

        // Surfaces API-level errors that don't throw, e.g. a safety refusal.
        const final = await messageStream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(
            encoder.encode(
              "\n\n_I can't help with that one. Try rephrasing, or ask about something else in the course._",
            ),
          );
        }
      } catch (error) {
        console.error("[/api/tutor] stream failed:", error);

        const message =
          error instanceof Anthropic.RateLimitError
            ? "\n\n_Rate limited — give it a few seconds and try again._"
            : error instanceof Anthropic.AuthenticationError
              ? "\n\n_Your ANTHROPIC_API_KEY was rejected. Check the value in .env.local._"
              : "\n\n_Something went wrong reaching the tutor. Try again._";

        controller.enqueue(encoder.encode(message));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      // Prevents proxies (notably nginx) from buffering the stream.
      "X-Accel-Buffering": "no",
    },
  });
}
