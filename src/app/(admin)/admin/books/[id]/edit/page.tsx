import Link from "next/link";
import { notFound } from "next/navigation";
import { PostStatus } from "@prisma/client";

import {
  deleteBookAction,
  linkReviewPostAction,
  updateBookAction,
} from "@/app/(admin)/admin/books/actions";
import { BookForm } from "@/components/admin/book-form";
import { Button } from "@/components/ui/button";
import { AdminContainer } from "@/components/ui/admin-container";
import { getAdminBook } from "@/lib/queries/books";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export default async function EditBookPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const book = await getAdminBook(id);
  if (!book) notFound();

  const publishedPosts = await prisma.post.findMany({
    where: { status: PostStatus.PUBLISHED, bookId: null },
    select: { id: true, title: true, slug: true },
    orderBy: { title: "asc" },
  });

  const updateAction = updateBookAction.bind(null, id);
  const linkReview = linkReviewPostAction.bind(null, id);

  return (
    <AdminContainer className="py-6">
      <Link href="/admin/books" className="text-sm text-muted hover:text-foreground">
        ← Библиотека
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Редактирование книги</h1>
      {query.saved ? (
        <p className="mt-2 text-sm text-muted" role="status">
          Сохранено.
        </p>
      ) : null}
      <div className="mt-8">
        <BookForm
          mode="edit"
          book={book}
          saveAction={updateAction}
          publishedPosts={publishedPosts}
          linkReviewAction={linkReview}
        />
      </div>
      <form action={deleteBookAction.bind(null, id)} className="mt-8">
        <Button type="submit" variant="ghost">
          Удалить книгу
        </Button>
      </form>
    </AdminContainer>
  );
}
