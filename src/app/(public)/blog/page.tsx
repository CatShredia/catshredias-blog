import type { Metadata } from "next";
import Link from "next/link";

import { BlogListInfinite } from "@/components/blog/blog-list-infinite";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { listCategories, listPublishedPosts } from "@/lib/queries/posts";

export const metadata: Metadata = {
  title: "Блог",
  description: "Статьи о разработке, инфраструктуре и UI",
  openGraph: {
    title: "Блог | Catshredia",
    description: "Статьи о разработке, инфраструктуре и UI",
  },
};

export const revalidate = 60;

export default async function BlogPage() {
  const [categories, initial] = await Promise.all([
    listCategories(),
    listPublishedPosts({ limit: 6 }),
  ]);

  return (
    <Container>
      <Section className="pt-10">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Блог</h1>
            <p className="mt-2 text-muted">
              Лента с поиском, фильтрами и подгрузкой при прокрутке.
            </p>
          </div>
          <Link
            href="/blog/formatting"
            className="text-sm text-accent underline-offset-4 hover:underline"
          >
            Правила Markdown
          </Link>
        </div>
        <BlogListInfinite
          categories={categories.map((category) => ({
            name: category.name,
            slug: category.slug,
          }))}
          initialItems={initial.items}
          initialCursor={initial.nextCursor}
        />
      </Section>
    </Container>
  );
}
