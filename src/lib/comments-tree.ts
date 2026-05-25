export const MAX_COMMENT_DEPTH = 5;

export type CommentRow = {
  id: string;
  parentId: string | null;
  authorName: string;
  authorImage: string | null;
  content: string;
  createdAt: Date;
};

export type CommentTreeNode = CommentRow & {
  replies: CommentTreeNode[];
};

export function buildCommentTree<T extends CommentRow>(comments: T[]): CommentTreeNode[] {
  const nodes = new Map<string, CommentTreeNode>();

  for (const comment of comments) {
    nodes.set(comment.id, { ...comment, replies: [] });
  }

  const roots: CommentTreeNode[] = [];

  for (const comment of comments) {
    const node = nodes.get(comment.id);
    if (!node) continue;

    if (comment.parentId) {
      const parent = nodes.get(comment.parentId);
      if (parent) parent.replies.push(node);
      else roots.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export function getCommentDepth(
  commentId: string,
  parentById: Map<string, string | null>,
): number {
  let depth = 0;
  let currentId: string | null = commentId;

  while (currentId) {
    depth += 1;
    currentId = parentById.get(currentId) ?? null;
  }

  return depth;
}

export function canReplyToDepth(parentDepth: number): boolean {
  return parentDepth < MAX_COMMENT_DEPTH;
}
