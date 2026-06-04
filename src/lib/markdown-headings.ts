import GithubSlugger from "github-slugger";

export type MarkdownHeading = {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  id: string;
};

const ATX_HEADING_RE = /^(#{1,6})\s+(.+)$/;
const ORDERED_LIST_RE = /^\s{0,3}\d+\.\s+/;
const UNORDERED_LIST_RE = /^\s{0,3}[-*+]\s+/;
const NUMBERED_TITLE_RE = /^\d+\.\s+/;

function cleanHeadingText(raw: string): string {
  return raw
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`+/g, "")
    .trim();
}

function isListLine(line: string): boolean {
  if (ATX_HEADING_RE.test(line.trim())) return false;
  return ORDERED_LIST_RE.test(line) || UNORDERED_LIST_RE.test(line);
}

function isNumberedStepHeading(text: string): boolean {
  return NUMBERED_TITLE_RE.test(text);
}

export function extractMarkdownHeadings(markdown: string): MarkdownHeading[] {
  const slugger = new GithubSlugger();
  const headings: MarkdownHeading[] = [];
  let inCodeFence = false;

  for (const line of markdown.split("\n")) {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;
    if (isListLine(line)) continue;

    const match = ATX_HEADING_RE.exec(trimmed);
    if (!match) continue;

    const level = match[1].length as MarkdownHeading["level"];
    const text = cleanHeadingText(match[2]);
    if (!text || isNumberedStepHeading(text)) continue;

    headings.push({
      level,
      text,
      id: slugger.slug(text),
    });
  }

  return headings;
}

export function headingIndentClass(level: MarkdownHeading["level"]): string | undefined {
  if (level <= 1) return undefined;
  const steps: Record<number, string> = {
    2: "pl-0",
    3: "pl-3",
    4: "pl-6",
    5: "pl-9",
    6: "pl-12",
  };
  return steps[level];
}
