import Link from "next/link";

import { createBookAction } from "@/app/(admin)/admin/books/actions";
import { BookForm } from "@/components/admin/book-form";
import { Container } from "@/components/ui/container";

export default function NewBookPage() {
  return (
    <Container className="py-10">
      <Link href="/admin/books" className="text-sm text-muted hover:text-foreground">
        ← Библиотека
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Новая книга</h1>
      <div className="mt-8">
        <BookForm mode="create" saveAction={createBookAction} />
      </div>
    </Container>
  );
}
