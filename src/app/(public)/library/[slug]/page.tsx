import type { Metadata } from "next";
import { SafeImage } from "@/components/ui/safe-image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MarkdownContent } from "@/components/markdown/markdown-content";
import { StarRatingDisplay } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getBookBySlug } from "@/lib/queries/books";
import { formatDateRu } from "@/lib/dates";
import { blogPostPath, libraryBookPath } from "@/lib/slug";
import { siteUrl } from "@/lib/seo";
import { BOOK_STATUS_LABELS } from "@/lib/validations/book";

type PageProps = { params: Promise<{ slug: string }> };

export const revalidate = 60;
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) return { title: "Не найдено" };
  return {
    title: book.title,
    description: book.description ?? book.title,
    openGraph: {
      title: book.title,
      images: book.coverImage ? [book.coverImage] : undefined,
      url: `${siteUrl}${libraryBookPath(book.slug)}`,
    },
  };
}

export default async function BookPage({ params }: PageProps) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) notFound();

  return (
    <Container className="py-10 sm:py-14">
      <Link href="/library" className="text-sm text-muted hover:text-foreground">
        ← Библиотека
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[240px_1fr]">
        {book.coverImage ? (
          <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-border">
            <SafeImage
              src={book.coverImage}
              alt={book.title}
              fill
              priority
            />
          </div>
        ) : null}

        <div>
          <p className="text-sm text-muted">{BOOK_STATUS_LABELS[book.status]}</p>
          <h1 className="mt-2 text-3xl font-bold">{book.title}</h1>
          {book.author ? (
            <p className="mt-2 text-lg text-muted">{book.author}</p>
          ) : null}
          {book.readAt ? (
            <p className="mt-2 text-sm text-muted">
              Прочитано: {formatDateRu(book.readAt)}
            </p>
          ) : null}
          {book.rating ? (
            <p className="mt-3">
              <StarRatingDisplay value={book.rating} className="text-2xl" />
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {book.tags.map((tag) => (
              <Badge key={tag.slug}>{tag.name}</Badge>
            ))}
          </div>
        </div>
      </div>

      {book.description ? (
        <Section title="О книге" className="mt-10">
          <div className="max-w-3xl prose prose-neutral dark:prose-invert">
            <MarkdownContent content={book.description} />
          </div>
        </Section>
      ) : null}

      {book.reviewPost ? (
        <Section title="Отзыв в блоге" className="mt-10">
          <ButtonLink href={blogPostPath(book.reviewPost.slug)}>
            {book.reviewPost.title}
          </ButtonLink>
          {book.reviewPost.excerpt ? (
            <p className="mt-3 text-muted">{book.reviewPost.excerpt}</p>
          ) : null}
        </Section>
      ) : null}
    </Container>
  );
}
