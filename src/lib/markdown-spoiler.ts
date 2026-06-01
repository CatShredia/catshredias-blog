export type MarkdownSegment =
  | { kind: "markdown"; content: string }
  | { kind: "spoiler"; title: string; content: string };

const SPOILER_RE = /:::spoiler\s+([^\n]+)\r?\n([\s\S]*?)\r?\n:::/g;

export const SPOILER_MARKDOWN_SNIPPET = `:::spoiler Заголовок спойлера
Скрытый текст в **Markdown**.
:::`;

export function splitMarkdownSpoilers(source: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = [];
  let lastIndex = 0;

  for (const match of source.matchAll(SPOILER_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      const chunk = source.slice(lastIndex, index);
      if (chunk.trim().length > 0) {
        segments.push({ kind: "markdown", content: chunk });
      }
    }
    segments.push({
      kind: "spoiler",
      title: match[1].trim(),
      content: match[2].trim(),
    });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < source.length) {
    const tail = source.slice(lastIndex);
    if (tail.trim().length > 0) {
      segments.push({ kind: "markdown", content: tail });
    }
  }

  if (segments.length === 0) {
    segments.push({ kind: "markdown", content: source });
  }

  return segments;
}
