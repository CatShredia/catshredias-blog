import type { Link, PhrasingContent, Root, Text } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

import { slugify } from "@/lib/slug";

const TAG_RE = /#([a-zA-Z0-9_\u0400-\u04ff-]+)/g;

export function tagHref(tag: string): string {
  return `/blog?tag=${encodeURIComponent(slugify(tag) || tag.toLowerCase())}`;
}

function splitTextIntoTagNodes(value: string): PhrasingContent[] {
  const parts: PhrasingContent[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  TAG_RE.lastIndex = 0;
  while ((match = TAG_RE.exec(value)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: value.slice(lastIndex, match.index) });
    }

    const tag = match[1];
    parts.push({
      type: "link",
      url: tagHref(tag),
      children: [{ type: "text", value: `#${tag}` }],
    } satisfies Link);
    lastIndex = match.index + match[0].length;
  }

  if (parts.length === 0) return [{ type: "text", value }];
  if (lastIndex < value.length) {
    parts.push({ type: "text", value: value.slice(lastIndex) });
  }
  return parts;
}

export const remarkTags: Plugin<[], Root> = () => (tree) => {
  visit(tree, "text", (node: Text, index, parent) => {
    if (!parent || index == null || !("children" in parent)) return;
    const parentType = (parent as { type: string }).type;
    if (
      parentType === "link" ||
      parentType === "linkReference" ||
      parentType === "inlineCode"
    ) {
      return;
    }

    const next = splitTextIntoTagNodes(node.value);
    if (next.length === 1 && next[0].type === "text" && next[0].value === node.value) {
      return;
    }

    parent.children.splice(index, 1, ...next);
  });
};
