import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getProjectBySlug, mockProjects } from "@/data/mock/projects";
import { siteProfile } from "@/data/mock/site";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return mockProjects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return { title: "Не найдено" };
  return {
    title: project.title,
    description: project.description,
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  return (
    <Container className="py-10 sm:py-14">
      <Link
        href="/portfolio"
        className="text-sm text-muted hover:text-foreground"
      >
        ← К портфолио
      </Link>
      <header className="mt-6 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {project.title}
        </h1>
        <p className="mt-3 text-muted">{project.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {project.stack.map((item) => (
            <Badge key={item}>{item}</Badge>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {project.demoUrl ? (
            <ButtonLink href={project.demoUrl}>Демо</ButtonLink>
          ) : null}
          {project.repoUrl ? (
            <ButtonLink href={project.repoUrl} variant="secondary">
              GitHub
            </ButtonLink>
          ) : null}
          <ButtonLink href={siteProfile.social.hh} variant="ghost">
            hh.ru
          </ButtonLink>
        </div>
      </header>

      <Section title="Проблема">
        <p className="max-w-3xl text-muted leading-relaxed">{project.problem}</p>
      </Section>
      <Section title="Решение">
        <p className="max-w-3xl text-muted leading-relaxed">{project.solution}</p>
      </Section>
      <Section title="Результат">
        <p className="max-w-3xl text-muted leading-relaxed">{project.result}</p>
      </Section>

      <Section title="Резюме (PDF)">
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-muted">
          PDF viewer и загрузка резюме — этап 5.
          <br />
          <span className="text-sm">Сейчас: ссылка на hh.ru выше.</span>
        </div>
      </Section>
    </Container>
  );
}
