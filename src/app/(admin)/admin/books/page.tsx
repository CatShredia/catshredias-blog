import { AdminBooksTable } from "@/components/admin/admin-books-table";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { listAdminBooks } from "@/lib/queries/books";

export default async function AdminBooksPage() {
  const books = await listAdminBooks();

  return (
    <Container className="py-10">
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
    </Container>
  );
}
