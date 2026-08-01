"use client";

import { useEffect, useRef, useState } from "react";
import Markdown from "@/components/Markdown";

type Message = { role: "user" | "assistant"; content: string };

export type LessonContext = {
  courseTitle: string;
  lessonTitle: string;
  summary: string;
};

const SUGGESTIONS = [
  "Explain that last section more simply",
  "Give me a worked example",
  "How is this used in production?",
];

/**
 * The tutor needs `/api/tutor`, a server route that proxies to a locally
 * running Ollama instance. A static export (GitHub Pages) has no server, so
 * the panel explains itself instead of firing requests at an endpoint that
 * isn't there.
 */
const IS_STATIC_BUILD = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";

export default function TutorChat({ lessonContext }: { lessonContext?: LessonContext }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Pin to the bottom as tokens arrive.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, streaming]);

  // Abort any in-flight request if the component unmounts mid-stream.
  useEffect(() => () => abortRef.current?.abort(), []);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    setError(null);
    setInput("");

    const history: Message[] = [...messages, { role: "user", content: trimmed }];
    // Push the user turn plus an empty assistant turn we stream into.
    setMessages([...history, { role: "assistant", content: "" }]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, lessonContext }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.error ?? `Request failed (${response.status})`);
      }
      if (!response.body) throw new Error("No response stream.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Append to the trailing assistant message as text arrives.
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, content: last.content + chunk };
          return next;
        });
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // User pressed Stop — keep whatever streamed so far.
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong.");
        // Drop the empty placeholder so the transcript isn't left with a blank turn.
        setMessages((prev) =>
          prev[prev.length - 1]?.content === "" ? prev.slice(0, -1) : prev,
        );
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-950/50 transition-transform hover:scale-105 active:scale-95"
      >
        <span aria-hidden="true">{open ? "✕" : "✦"}</span>
        <span className="hidden sm:inline">{open ? "Close" : "Ask the tutor"}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="AI tutor chat"
          className="animate-fade-rise fixed inset-x-3 bottom-20 z-50 flex max-h-[min(70dvh,34rem)] flex-col overflow-hidden rounded-2xl border border-ink-700 bg-ink-900/95 shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:right-5 sm:w-[26rem]"
        >
          <header className="flex items-center justify-between gap-3 border-b border-ink-800 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-100">AI Tutor</p>
              <p className="truncate text-[11px] text-ink-500">
                {lessonContext
                  ? `Context: ${lessonContext.lessonTitle}`
                  : "Ask anything about the course"}
              </p>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  abortRef.current?.abort();
                  setMessages([]);
                  setError(null);
                }}
                className="shrink-0 rounded-md border border-ink-700 px-2 py-1 text-[11px] text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-200"
              >
                Clear
              </button>
            )}
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
            {IS_STATIC_BUILD ? (
              <div className="py-2">
                <p className="text-sm leading-relaxed text-ink-300">
                  The tutor isn&apos;t available on this deployment.
                </p>
                <p className="mt-2.5 text-[13px] leading-relaxed text-ink-400">
                  It streams from a locally running{" "}
                  <code className="rounded border border-ink-700 bg-ink-850 px-1 py-0.5 font-mono text-[11px] text-indigo-300">
                    ollama
                  </code>{" "}
                  model through a server route. GitHub Pages only serves
                  static files, so there&apos;s no server to reach Ollama on
                  your machine.
                </p>
                <p className="mt-2.5 text-[13px] leading-relaxed text-ink-400">
                  To use it, run the app locally with{" "}
                  <code className="rounded border border-ink-700 bg-ink-850 px-1 py-0.5 font-mono text-[11px] text-indigo-300">
                    ollama serve
                  </code>{" "}
                  and the{" "}
                  <code className="rounded border border-ink-700 bg-ink-850 px-1 py-0.5 font-mono text-[11px] text-indigo-300">
                    qwen2.5-coder:7b
                  </code>{" "}
                  model pulled, or deploy somewhere that runs server code.
                </p>
                <p className="mt-3 text-[13px] leading-relaxed text-ink-500">
                  Everything else — lessons, quizzes, and all five labs — works
                  here exactly as intended.
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="py-4">
                <p className="text-sm leading-relaxed text-ink-400">
                  I can explain anything in this course, work through examples,
                  or check your reasoning. What&apos;s on your mind?
                </p>
                <div className="mt-3 flex flex-col gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-lg border border-ink-700 bg-ink-850/60 px-3 py-2 text-left text-[13px] text-ink-300 transition-colors hover:border-indigo-500/50 hover:text-ink-100"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((message, i) => (
                  <div
                    key={i}
                    className={
                      message.role === "user"
                        ? "ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-indigo-500/20 px-3.5 py-2 text-[13px] leading-relaxed text-ink-100"
                        : "max-w-full text-[13px] leading-relaxed text-ink-300"
                    }
                  >
                    {message.role === "user" ? (
                      message.content
                    ) : message.content === "" ? (
                      <span className="flex gap-1 py-1" aria-label="Tutor is typing">
                        {[0, 1, 2].map((d) => (
                          <span
                            key={d}
                            className="h-1.5 w-1.5 rounded-full bg-indigo-400"
                            style={{
                              animation: "pulse-dot 1.2s ease-in-out infinite",
                              animationDelay: `${d * 0.16}s`,
                            }}
                          />
                        ))}
                      </span>
                    ) : (
                      <Markdown body={message.content} className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {error && (
              <p className="mt-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                {error}
              </p>
            )}
          </div>

          {!IS_STATIC_BUILD && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-end gap-2 border-t border-ink-800 p-3"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                // Enter sends; Shift+Enter inserts a newline.
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Ask a question…"
              aria-label="Message the tutor"
              className="max-h-28 flex-1 resize-none rounded-xl border border-ink-700 bg-ink-950 px-3 py-2.5 text-[13px] text-ink-100 outline-none transition-colors placeholder:text-ink-600 focus:border-indigo-500"
            />
            {streaming ? (
              <button
                type="button"
                onClick={() => abortRef.current?.abort()}
                className="shrink-0 rounded-xl border border-ink-700 px-3 py-2.5 text-[13px] font-medium text-ink-300 transition-colors hover:bg-ink-800"
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="shrink-0 rounded-xl bg-indigo-500 px-3.5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Send
              </button>
            )}
          </form>
          )}
        </div>
      )}
    </>
  );
}
