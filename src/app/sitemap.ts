import type { MetadataRoute } from "next";

import { getBookSlugs } from "@/lib/queries/books";
import { getPublishedPostSlugs } from "@/lib/queries/posts";
import { getProjectSlugs } from "@/lib/queries/projects";
import { siteUrl } from "@/lib/seo";
import {
  blogPostPath,
  libraryBookPath,
  portfolioProjectPath,
} from "@/lib/slug";

const staticRoutes: MetadataRoute.Sitemap = [
  "",
  "/blog",
  "/portfolio",
  "/contacts",
  "/library",
  "/privacy",
  "/personal-data-consent",
].map((path) => ({
  url: `${siteUrl}${path}`,
  lastModified: new Date(),
  changeFrequency: "weekly" as const,
  priority: path === "" ? 1 : 0.8,
}));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!process.env.DATABASE_URL) {
    return staticRoutes;
  }

  try {
    const [posts, projects, books] = await Promise.all([
      getPublishedPostSlugs(),
      getProjectSlugs(),
      getBookSlugs(),
    ]);

    const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
      url: `${siteUrl}${blogPostPath(post.slug)}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
      url: `${siteUrl}${portfolioProjectPath(project.slug)}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    const bookRoutes: MetadataRoute.Sitemap = books.map((book) => ({
      url: `${siteUrl}${libraryBookPath(book.slug)}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    return [...staticRoutes, ...postRoutes, ...projectRoutes, ...bookRoutes];
  } catch {
    return staticRoutes;
  }
}
