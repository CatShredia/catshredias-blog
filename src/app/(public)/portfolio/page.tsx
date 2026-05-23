import type { Metadata } from "next";

import { PortfolioGridClient } from "@/components/portfolio/portfolio-grid-client";
import { PortfolioProfile } from "@/components/portfolio/portfolio-profile";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { listProjectFilters, listProjects } from "@/lib/queries/projects";
import { getSiteSettings } from "@/lib/queries/site-settings";

export const metadata: Metadata = {
  title: "Портфолио",
  description: "Проекты, стек и кейсы",
  openGraph: {
    title: "Портфолио | Catshredia",
    description: "Проекты, стек и кейсы",
  },
};

export const revalidate = 60;
export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const [filters, items, settings] = await Promise.all([
    listProjectFilters(),
    listProjects(),
    getSiteSettings(),
  ]);

  return (
    <Container>
      <Section className="pt-10">
        <h1 className="text-3xl font-bold tracking-tight">Портфолио</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Проекты с фильтрами по технологиям и роли, резюме и профиль на hh.ru.
        </p>
        <div className="mt-8">
          <PortfolioProfile
            hhUrl={settings.hhUrl}
            resumePdf={settings.resumePdf}
            lookingForWork={settings.lookingForWork}
          />
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
