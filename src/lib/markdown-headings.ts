import GithubSlugger from "github-slugger";

export type MarkdownHeading = {
  level: 2 | 3;
  text: string;
  id: string;
};

export function extractMarkdownHeadings(markdown: string): MarkdownHeading[] {
  const slugger = new GithubSlugger();
  const headings: MarkdownHeading[] = [];

  for (const line of markdown.split("\n")) {
    const match = /^(#{2,3})\s+(.+)$/.exec(line.trim());
    if (!match) continue;

    const level = match[1].length as 2 | 3;
    const text = match[2].replace(/\[(.*?)\]\(.*?\)/g, "$1").trim();
    if (!text) continue;

    headings.push({
      level,
      text,
      id: slugger.slug(text),
    });
  }

  return headings;
}
