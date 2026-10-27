import { Fragment, type ReactNode } from "react";

/**
 * Minimal, safe Markdown for chat answers: paragraphs, headings, bullet and
 * numbered lists, **bold** and `code`. Builds React elements only — no HTML
 * injection, so model output can never run as markup.
 */

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`)/g;
const BULLET = /^\s*[-*•]\s+/;
const NUMBERED = /^\s*\d+[.)]\s+/;
const HEADING = /^\s*#{1,6}\s+/;

type Block =
  | { kind: "p"; lines: string[] }
  | { kind: "h"; text: string }
  | { kind: "ul" | "ol"; items: string[] };

function renderInline(text: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={i} className="px-1 rounded bg-[color-mix(in_srgb,var(--n-text)_8%,transparent)]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function parseBlocks(markdown: string): Block[] {
  const blocks: Block[] = [];
  for (const line of markdown.split("\n")) {
    const last = blocks[blocks.length - 1];
    if (!line.trim()) {
      blocks.push({ kind: "p", lines: [] });
    } else if (HEADING.test(line)) {
      blocks.push({ kind: "h", text: line.replace(HEADING, "") });
    } else if (BULLET.test(line) || NUMBERED.test(line)) {
      const kind = BULLET.test(line) ? "ul" : "ol";
      const item = line.replace(kind === "ul" ? BULLET : NUMBERED, "");
      if (last?.kind === kind) last.items.push(item);
      else blocks.push({ kind, items: [item] });
    } else if (last?.kind === "p") {
      last.lines.push(line);
    } else {
      blocks.push({ kind: "p", lines: [line] });
    }
  }
  return blocks.filter((b) => b.kind !== "p" || b.lines.length > 0);
}

export default function ChatMarkdown({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-2">
      {parseBlocks(text).map((block, i) => {
        switch (block.kind) {
          case "h":
            return (
              <p key={i} className="m-0 font-semibold">
                {renderInline(block.text)}
              </p>
            );
          case "ul":
          case "ol": {
            const List = block.kind;
            return (
              <List
                key={i}
                className={`m-0 pl-5 flex flex-col gap-1 ${block.kind === "ul" ? "list-disc" : "list-decimal"}`}
              >
                {block.items.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </List>
            );
          }
          default:
            return (
              <p key={i} className="m-0">
                {block.lines.map((line, j) => (
                  <Fragment key={j}>
                    {j > 0 && <br />}
                    {renderInline(line)}
                  </Fragment>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
}
