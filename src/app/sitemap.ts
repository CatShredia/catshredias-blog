import type { MetadataRoute } from "next";

import { getBookSlugs } from "@/lib/queries/books";
import { getPublishedPostSlugs } from "@/lib/queries/posts";
import { getProjectSlugs } from "@/lib/queries/projects";
import { siteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, projects, books] = await Promise.all([
    getPublishedPostSlugs(),
    getProjectSlugs(),
    getBookSlugs(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/blog",
    "/portfolio",
    "/contacts",
    "/library",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${siteUrl}/portfolio/${project.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const bookRoutes: MetadataRoute.Sitemap = books.map((book) => ({
    url: `${siteUrl}/library/${book.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...postRoutes, ...projectRoutes, ...bookRoutes];
}
