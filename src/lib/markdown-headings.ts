import GithubSlugger from "github-slugger";

export type MarkdownHeading = {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  id: string;
};

export function extractMarkdownHeadings(markdown: string): MarkdownHeading[] {
  const slugger = new GithubSlugger();
  const headings: MarkdownHeading[] = [];

  for (const line of markdown.split("\n")) {
    const match = /^(#{1,6})\s+(.+)$/.exec(line.trim());
    if (!match) continue;

    const level = match[1].length as MarkdownHeading["level"];
    const text = match[2]
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .replace(/`+/g, "")
      .trim();
    if (!text) continue;

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
