import Link from "next/link";

import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { listAdminBooks } from "@/lib/queries/books";
import { BOOK_STATUS_LABELS } from "@/lib/validations/book";

export default async function AdminBooksPage() {
  const books = await listAdminBooks();

  return (
    <Container className="py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Библиотека</h1>
        <ButtonLink href="/admin/books/new">Добавить книгу</ButtonLink>
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-card">
            <tr>
              <th className="px-4 py-3 font-medium">Книга</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Рейтинг</th>
              <th className="px-4 py-3 font-medium">Отзыв</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {books.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-muted">
                  Книг пока нет.
                </td>
              </tr>
            ) : (
              books.map((book) => (
                <tr key={book.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{book.title}</p>
                    {book.author ? (
                      <p className="text-xs text-muted">{book.author}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{BOOK_STATUS_LABELS[book.status]}</td>
                  <td className="px-4 py-3">
                    {book.rating ? `${book.rating} ★` : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {book.reviewPost ? book.reviewPost.title : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/books/${book.id}/edit`}
                      className="text-accent underline"
                    >
                      Редактировать
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
