import { blogPostPath } from "@/lib/slug";
import { siteUrl } from "@/lib/seo";

export type CommentForNotify = {
  authorName: string;
  content: string;
  post: { title: string; slug: string };
};

function excerpt(text: string, max = 140): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

/** Текст дайджеста / списка комментариев с группировкой по постам. */
export function formatCommentsGroupedByPost(
  comments: CommentForNotify[],
  options?: { maxPosts?: number; maxPerPost?: number },
): string {
  const maxPosts = options?.maxPosts ?? 8;
  const maxPerPost = options?.maxPerPost ?? 5;

  const byPost = new Map<
    string,
    { title: string; slug: string; items: CommentForNotify[] }
  >();

  for (const comment of comments) {
    const key = comment.post.slug;
    const group = byPost.get(key);
    if (group) {
      group.items.push(comment);
    } else {
      byPost.set(key, {
        title: comment.post.title,
        slug: comment.post.slug,
        items: [comment],
      });
    }
  }

  const groups = [...byPost.values()].slice(0, maxPosts);
  const hiddenPosts = byPost.size - groups.length;
  const lines: string[] = [];

  for (const group of groups) {
    lines.push(`📌 «${group.title}»`);
    const shown = group.items.slice(0, maxPerPost);
    for (const item of shown) {
      lines.push(`  • ${item.authorName}: ${excerpt(item.content)}`);
    }
    if (group.items.length > maxPerPost) {
      lines.push(`  …ещё ${group.items.length - maxPerPost} в этом посте`);
    }
    lines.push("");
  }

  if (hiddenPosts > 0) {
    lines.push(`…и ещё ${hiddenPosts} пост(ов) с комментариями`);
  }

  return lines.join("\n").trim();
}

export function formatInstantCommentTelegram(comment: CommentForNotify): string {
  const postUrl = `${siteUrl}${blogPostPath(comment.post.slug)}#comments`;
  return [
    `📌 «${comment.post.title}»`,
    "",
    `${comment.authorName}:`,
    excerpt(comment.content, 500),
    "",
    postUrl,
  ].join("\n");
}

export function formatDigestCommentTelegram(
  comments: CommentForNotify[],
  periodLabel: string,
): string {
  const grouped = formatCommentsGroupedByPost(comments);
  return [
    `Комментарии (${comments.length}) ${periodLabel}`,
    "",
    grouped,
    "",
    `${siteUrl}/admin/comments`,
  ].join("\n");
}
