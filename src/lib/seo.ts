import type { Post, Project, User } from "@prisma/client";

import { blogPostPath, portfolioProjectPath } from "@/lib/slug";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function articleJsonLd(
  post: Post & { author: Pick<User, "name" | "email"> },
) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: post.author.name ?? post.author.email,
    },
    mainEntityOfPage: `${siteUrl}${blogPostPath(post.slug)}`,
  };
}

export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Catshredia",
    url: siteUrl,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Catshredia",
    url: siteUrl,
  };
}

export function projectJsonLd(project: Project) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.description,
    url: `${siteUrl}${portfolioProjectPath(project.slug)}`,
  };
}

export { siteUrl };
