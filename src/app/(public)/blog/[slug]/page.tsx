import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CommentSection, type CommentItem } from "@/components/blog/comment-section";
import { PostArticleLayout } from "@/components/blog/post-article-layout";
import { PostTrackPlayer } from "@/components/blog/post-track-player";
import { PostTaxonomyBadges } from "@/components/blog/post-taxonomy-badges";
import { Container } from "@/components/ui/container";
import { SafeImage } from "@/components/ui/safe-image";
import type { CommentTreeNode } from "@/lib/comments-tree";
import { auth } from "@/lib/auth";
import { listApprovedComments } from "@/lib/queries/comments";
import {
  getPublishedPostBySlug,
} from "@/lib/queries/posts";
import { blogPostPath } from "@/lib/slug";
import { articleJsonLd, siteUrl } from "@/lib/seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function mapCommentToItem(
  node: CommentTreeNode,
  viewerUserId: string | null,
): CommentItem {
  return {
    id: node.id,
    authorName: node.authorName,
    authorImage: node.authorImage,
    content: node.content,
    createdAt: node.createdAt,
    isOwn: Boolean(viewerUserId && node.authorUserId === viewerUserId),
    replies: node.replies.map((reply) => mapCommentToItem(reply, viewerUserId)),
  };
}

export const revalidate = 60;
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) return { title: "Не найдено" };

  const description = post.excerpt ?? post.title;
  const url = `${siteUrl}${blogPostPath(post.slug)}`;

  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      url,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
    alternates: { canonical: url },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  const [comments, session] = await Promise.all([
    listApprovedComments(post.id),
    auth(),
  ]);
  const viewerUserId = session?.user?.id ?? null;
  const jsonLd = articleJsonLd(post);

  return (
    <Container className="py-10 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link href="/blog" className="text-sm text-muted hover:text-foreground">
        ← К блогу
      </Link>
      <article className="mt-6 max-w-none">
        <PostArticleLayout
          content={post.content}
          beforeContent={
            <PostTrackPlayer
              trackType={post.trackType}
              trackAudioUrl={post.trackAudioUrl}
              trackTitle={post.trackTitle}
              trackArtist={post.trackArtist}
              trackCoverImage={post.trackCoverImage}
              trackEmbedSrc={post.trackEmbedSrc}
            />
          }
        >
          {post.coverImage ? (
            <div className="relative mb-6 aspect-[2/1] overflow-hidden rounded-xl border border-border">
              <SafeImage
                src={post.coverImage}
                alt=""
                fill
                priority
                sizes="(max-width: 768px) 100vw, 768px"
              />
            </div>
          ) : null}
          <time
            dateTime={post.publishedAt?.toISOString()}
            className="text-sm text-muted"
          >
            {post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString("ru-RU")
              : ""}
          </time>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {post.title}
          </h1>
          <div className="mt-4">
            <PostTaxonomyBadges
              categories={post.categories}
              tags={post.tags}
            />
          </div>
        </PostArticleLayout>
      </article>

      <CommentSection
        postId={post.id}
        postSlug={post.slug}
        initialComments={comments.map((node) =>
          mapCommentToItem(node, viewerUserId),
        )}
      />
    </Container>
  );
}
