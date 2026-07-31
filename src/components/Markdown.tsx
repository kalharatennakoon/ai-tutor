import { Fragment, type ReactNode } from "react";

/**
 * Deliberately tiny markdown subset: paragraphs, `- ` bullet lists, **bold**,
 * *italic*, and `inline code`. It renders to React elements rather than HTML
 * strings, so there is no `dangerouslySetInnerHTML` and no XSS surface.
 */

const INLINE_PATTERN = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(INLINE_PATTERN).map((part, i) => {
    const key = `${keyPrefix}-${i}`;

    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={key} className="font-semibold text-ink-100">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={key}
          className="rounded border border-ink-700 bg-ink-850 px-[0.35em] py-[0.15em] font-mono text-[0.875em] text-indigo-300"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={key} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }

    return <Fragment key={key}>{part}</Fragment>;
  });
}

export default function Markdown({
  body,
  className = "",
}: {
  body: string;
  className?: string;
}) {
  // Blank lines separate blocks; a run of "- " lines becomes one list.
  const blocks = body.split(/\n{2,}/);

  return (
    <div className={className}>
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n").filter((l) => l.trim() !== "");
        if (lines.length === 0) return null;

        const isList = lines.every((l) => l.trimStart().startsWith("- "));

        if (isList) {
          return (
            <ul
              key={blockIndex}
              className="my-4 flex flex-col gap-2 pl-1 text-[15px] leading-relaxed text-ink-300"
            >
              {lines.map((line, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400/70"
                  />
                  <span>{renderInline(line.trimStart().slice(2), `${blockIndex}-${i}`)}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p
            key={blockIndex}
            className="my-4 text-[15px] leading-relaxed text-ink-300"
          >
            {renderInline(block.replace(/\n/g, " "), String(blockIndex))}
          </p>
        );
      })}
    </div>
  );
}
