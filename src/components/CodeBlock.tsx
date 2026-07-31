"use client";

import { useState } from "react";

export default function CodeBlock({
  code,
  lang,
  caption,
}: {
  code: string;
  lang: string;
  caption?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked (insecure context or denied permission) — the code
      // is still selectable, so fail quietly rather than throwing.
    }
  };

  return (
    <figure className="my-6 overflow-hidden rounded-2xl border border-ink-700 bg-ink-950">
      <div className="flex items-center justify-between gap-3 border-b border-ink-800 bg-ink-900/60 px-4 py-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">
          {lang}
        </span>
        <button
          type="button"
          onClick={copy}
          className="rounded-md border border-ink-700 px-2 py-1 text-[11px] font-medium text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-200"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <pre className="overflow-x-auto px-4 py-3.5">
        <code className="font-mono text-[13px] leading-relaxed text-ink-200">
          {code}
        </code>
      </pre>

      {caption && (
        <figcaption className="border-t border-ink-800 px-4 py-2 text-xs text-ink-500">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
