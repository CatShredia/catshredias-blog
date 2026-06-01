import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MarkdownContent } from "@/components/markdown/markdown-content";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getProjectBySlug } from "@/lib/queries/projects";
import { projectJsonLd, siteUrl } from "@/lib/seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Не найдено" };

  const plainDescription = project.description.replace(/[#>*_`[\]]/g, "").slice(0, 160);
  const url = `${siteUrl}/portfolio/${project.slug}`;
  return {
    title: project.title,
    description: plainDescription,
    openGraph: {
      title: project.title,
      description: plainDescription,
      url,
    },
    alternates: { canonical: url },
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const jsonLd = projectJsonLd(project);

  return (
    <Container className="py-10 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
        </div>
      </header>

      <Section title="Описание" compact>
        <div className="max-w-3xl text-muted">
          <MarkdownContent content={project.description} />
        </div>
      </Section>

      {project.problem ? (
        <Section title="Проблема" compact>
          <div className="max-w-3xl text-muted">
            <MarkdownContent content={project.problem} />
          </div>
        </Section>
      ) : null}

      {project.solution ? (
        <Section title="Решение" compact>
          <div className="max-w-3xl text-muted">
            <MarkdownContent content={project.solution} />
          </div>
        </Section>
      ) : null}

      {project.result ? (
        <Section title="Результат" compact>
          <div className="max-w-3xl text-muted">
            <MarkdownContent content={project.result} />
          </div>
        </Section>
      ) : null}
    </Container>
  );
}
