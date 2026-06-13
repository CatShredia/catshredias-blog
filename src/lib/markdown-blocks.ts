export type MarkdownBlocks = {
  blocks: string[];
  separator: string;
};

export function splitMarkdownBlocks(source: string): MarkdownBlocks {
  if (!source) {
    return { blocks: [""], separator: "\n\n" };
  }

  const blocks: string[] = [];
  const lines = source.split(/\r?\n/);
  let buffer: string[] = [];
  let inFence = false;
  let fenceMarker = "";

  const flush = () => {
    if (buffer.length === 0) return;
    blocks.push(buffer.join("\n"));
    buffer = [];
  };

  for (const line of lines) {
    const fence = line.match(/^(`{3,}|~{3,})/);
    if (fence) {
      const marker = fence[1];
      if (!inFence) {
        inFence = true;
        fenceMarker = marker[0];
      } else if (marker[0] === fenceMarker) {
        inFence = false;
      }
    }

    if (!inFence && line.trim() === "" && buffer.length > 0) {
      flush();
      continue;
    }

    buffer.push(line);
  }

  flush();

  if (blocks.length === 0) {
    blocks.push("");
  }

  return { blocks, separator: "\n\n" };
}

export function joinMarkdownBlocks(
  blocks: string[],
  separator = "\n\n",
): string {
  return blocks.join(separator);
}

export function replaceMarkdownBlock(
  source: string,
  index: number,
  newContent: string,
): string {
  const { blocks, separator } = splitMarkdownBlocks(source);
  if (index < 0 || index >= blocks.length) return source;
  blocks[index] = newContent;
  return joinMarkdownBlocks(blocks, separator);
}

export function appendMarkdownBlock(source: string, block: string): string {
  const trimmed = source.trimEnd();
  if (!trimmed) return block;
  return `${trimmed}\n\n${block}`;
}
