import type { Metadata } from "next";

import { BlogListInfinite } from "@/components/blog/blog-list-infinite";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { listCategories, listPublishedPosts, listTags } from "@/lib/queries/posts";

export const metadata: Metadata = {
  title: "Блог",
  description: "Статьи о разработке, инфраструктуре и UI",
  openGraph: {
    title: "Блог | Catshredia",
    description: "Статьи о разработке, инфраструктуре и UI",
  },
};

export const revalidate = 60;
export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const [categories, tags, initial] = await Promise.all([
    listCategories(),
    listTags(),
    listPublishedPosts({ limit: 6 }),
  ]);

  return (
    <Container>
      <Section className="pt-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Блог</h1>
          <p className="mt-2 text-muted">
            Лента с поиском, фильтрами и подгрузкой при прокрутке.
          </p>
        </div>
        <BlogListInfinite
          categories={categories.map((category) => ({
            name: category.name,
            slug: category.slug,
          }))}
          tags={tags.map((item) => ({
            name: item.name,
            slug: item.slug,
          }))}
          initialItems={initial.items}
          initialCursor={initial.nextCursor}
        />
      </Section>
    </Container>
  );
}
