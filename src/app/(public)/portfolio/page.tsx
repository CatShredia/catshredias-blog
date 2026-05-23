import type { Metadata } from "next";

import { PortfolioGridClient } from "@/components/portfolio/portfolio-grid-client";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { listProjectFilters, listProjects } from "@/lib/queries/projects";

export const metadata: Metadata = {
  title: "Портфолио",
  description: "Проекты, стек и кейсы",
  openGraph: {
    title: "Портфолио | Catshredia",
    description: "Проекты, стек и кейсы",
  },
};

export const revalidate = 60;

export default async function PortfolioPage() {
  const [filters, items] = await Promise.all([
    listProjectFilters(),
    listProjects(),
  ]);

  return (
    <Container>
      <Section className="pt-10">
        <h1 className="text-3xl font-bold tracking-tight">Портфолио</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Проекты из базы данных с фильтрами по технологиям и роли.
        </p>
        <div className="mt-8">
          <PortfolioGridClient
            technologies={filters.technologies}
            roles={filters.roles}
            initialItems={items}
          />
        </div>
      </Section>
    </Container>
  );
}
