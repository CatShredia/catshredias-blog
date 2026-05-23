import type { Metadata } from "next";
import Link from "next/link";

import { BlogList } from "@/components/blog/blog-list";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Блог",
  description: "Статьи о разработке, инфраструктуре и UI",
};

export default function BlogPage() {
  return (
    <Container>
      <Section className="pt-10">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Блог</h1>
            <p className="mt-2 text-muted">
              Mock-лента для проверки UX до подключения API.
            </p>
          </div>
          <Link
            href="/blog/formatting"
            className="text-sm text-accent underline-offset-4 hover:underline"
          >
            Правила Markdown
          </Link>
        </div>
        <BlogList />
      </Section>
    </Container>
  );
}
