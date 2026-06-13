import type { Html, PhrasingContent, Root, Text } from "mdast";
import type { Root as HastRoot } from "hast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

export const MARKDOWN_TEXT_STYLE_IDS = [
  "bold",
  "semibold",
  "italic",
  "underline",
  "strikethrough",
] as const;

export type MarkdownTextStyleId = (typeof MARKDOWN_TEXT_STYLE_IDS)[number];

export type MarkdownTextStyleOption = {
  id: MarkdownTextStyleId;
  label: string;
  previewClass: string;
  wrap: (text: string) => string;
};

export const MARKDOWN_TEXT_STYLES: MarkdownTextStyleOption[] = [
  {
    id: "bold",
    label: "Жирный",
    previewClass: "font-bold",
    wrap: (text) => `**${text}**`,
  },
  {
    id: "semibold",
    label: "Полужирный",
    previewClass: "markdown-text-semibold",
    wrap: (text) => `[semibold]${text}[/semibold]`,
  },
  {
    id: "italic",
    label: "Курсив",
    previewClass: "italic",
    wrap: (text) => `*${text}*`,
  },
  {
    id: "underline",
    label: "Подчёркнутый",
    previewClass: "markdown-text-underline",
    wrap: (text) => `[underline]${text}[/underline]`,
  },
  {
    id: "strikethrough",
    label: "Зачёркнутый",
    previewClass: "line-through",
    wrap: (text) => `~~${text}~~`,
  },
];

const CUSTOM_TEXT_STYLE_RE =
  /\[(semibold|underline)\]([\s\S]*?)\[\/(semibold|underline)\]/g;

export function buildTextStyleMarkdown(style: MarkdownTextStyleId, text: string) {
  const option = MARKDOWN_TEXT_STYLES.find((item) => item.id === style);
  return option ? option.wrap(text) : text;
}

export function splitTextIntoStyleNodes(value: string): PhrasingContent[] {
  const parts: PhrasingContent[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  CUSTOM_TEXT_STYLE_RE.lastIndex = 0;
  while ((match = CUSTOM_TEXT_STYLE_RE.exec(value)) !== null) {
    if (match[1] !== match[3]) continue;

    if (match.index > lastIndex) {
      parts.push({ type: "text", value: value.slice(lastIndex, match.index) });
    }

    const style = match[1];
    const inner = match[2];
    parts.push({
      type: "html",
      value: `<span class="markdown-text-${style}">${inner}</span>`,
    } satisfies Html);
    lastIndex = match.index + match[0].length;
  }

  if (parts.length === 0) return [{ type: "text", value }];
  if (lastIndex < value.length) {
    parts.push({ type: "text", value: value.slice(lastIndex) });
  }
  return parts;
}

export const remarkTextStyle: Plugin<[], Root> = () => (tree) => {
  visit(tree, "text", (node: Text, index, parent) => {
    if (!parent || index == null || !("children" in parent)) return;
    const parentType = (parent as { type: string }).type;
    if (
      parentType === "link" ||
      parentType === "linkReference" ||
      parentType === "inlineCode" ||
      parentType === "code"
    ) {
      return;
    }

    const next = splitTextIntoStyleNodes(node.value);
    if (next.length === 1 && next[0].type === "text" && next[0].value === node.value) {
      return;
    }

    parent.children.splice(index, 1, ...next);
  });
};

const TEXT_STYLE_RAW_RE =
  /^<span class="markdown-text-(semibold|underline)">([\s\S]*?)<\/span>$/;

/** Превращает raw HTML от remarkTextStyle в hast-элементы для react-markdown */
export const rehypeTextStyle: Plugin<[], HastRoot> = () => (tree) => {
  visit(tree, "raw", (node, index, parent) => {
    if (!parent || index == null || node.type !== "raw") return;

    const match = TEXT_STYLE_RAW_RE.exec(String(node.value).trim());
    if (!match) return;

    parent.children[index] = {
      type: "element",
      tagName: "span",
      properties: { className: [`markdown-text-${match[1]}`] },
      children: [{ type: "text", value: match[2] }],
    };
  });
};
