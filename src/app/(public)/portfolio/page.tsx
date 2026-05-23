import type { Metadata } from "next";

import { PortfolioGrid } from "@/components/portfolio/portfolio-grid";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Портфолио",
  description: "Проекты, стек и кейсы",
};

export default function PortfolioPage() {
  return (
    <Container>
      <Section className="pt-10">
        <h1 className="text-3xl font-bold tracking-tight">Портфолио</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Фильтры по технологиям и роли работают на mock-данных.
        </p>
        <div className="mt-8">
          <PortfolioGrid />
        </div>
      </Section>
    </Container>
  );
}
