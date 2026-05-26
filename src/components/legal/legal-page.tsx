import type { ReactNode } from "react";

import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <Container>
      <Section className="pt-10 pb-16">
        <header className="max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted">
            Дата последнего обновления: {updatedAt}
          </p>
        </header>
        <article className="prose prose-neutral mt-10 max-w-3xl dark:prose-invert">
          {children}
        </article>
      </Section>
    </Container>
  );
}
