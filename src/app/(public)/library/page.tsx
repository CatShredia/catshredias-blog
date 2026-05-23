import type { Metadata } from "next";

import { LibraryGrid } from "@/components/library/library-grid";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { listBookTags, listBooks } from "@/lib/queries/books";

export const metadata: Metadata = {
  title: "Библиотека",
  description: "Книги: статусы чтения, рейтинги и отзывы",
};

export const revalidate = 60;

export default async function LibraryPage() {
  const [books, tags] = await Promise.all([listBooks(), listBookTags()]);

  return (
    <Container>
      <Section className="pt-10">
        <h1 className="text-3xl font-bold tracking-tight">Библиотека</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Книги с отметками «В планах», «Читаю», «Прочитано», рейтингом и тегами.
        </p>
        <div className="mt-8">
          <LibraryGrid books={books} tags={tags} />
        </div>
      </Section>
    </Container>
  );
}
