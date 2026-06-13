import type { Metadata } from "next";

import { AdminBooksTable } from "@/components/admin/admin-books-table";
import { AdminContainer } from "@/components/ui/admin-container";
import { ButtonLink } from "@/components/ui/button";
import { listAdminBooks } from "@/lib/queries/books";

export const metadata: Metadata = {
  title: "Библиотека",
};

export default async function AdminBooksPage() {
  const books = await listAdminBooks();

  return (
    <AdminContainer className="py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Библиотека</h1>
        <ButtonLink href="/admin/books/new">Добавить книгу</ButtonLink>
      </div>

      <AdminBooksTable
        books={books.map((book) => ({
          id: book.id,
          title: book.title,
          author: book.author,
          status: book.status,
          rating: book.rating,
          readAt: book.readAt?.toISOString() ?? null,
          reviewTitle: book.reviewPost?.title ?? null,
        }))}
      />
    </AdminContainer>
  );
}
