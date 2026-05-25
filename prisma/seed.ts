import { PostStatus, PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";

import { mockPosts } from "../src/data/mock/posts";
import { mockProjects } from "../src/data/mock/projects";
import { siteProfile } from "../src/data/mock/site";
import { slugify } from "../src/lib/slug";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@catshredia.ru";
  const password = process.env.ADMIN_PASSWORD ?? "changeme";

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Admin",
      passwordHash: await hash(password, 12),
      role: Role.ADMIN,
    },
  });

  console.log(`Seeded admin user: ${email}`);

  const categoryMap = new Map<string, string>();
  for (const post of mockPosts) {
    for (const name of post.categories) {
      if (!categoryMap.has(name)) {
        const slug = slugify(name);
        const cat = await prisma.category.upsert({
          where: { slug },
          update: { name },
          create: { name, slug },
        });
        categoryMap.set(name, cat.id);
      }
    }
  }

  const tagMap = new Map<string, string>();
  for (const post of mockPosts) {
    for (const name of post.tags) {
      if (!tagMap.has(name)) {
        const slug = slugify(name) || name;
        const tag = await prisma.tag.upsert({
          where: { slug },
          update: { name },
          create: { name, slug },
        });
        tagMap.set(name, tag.id);
      }
    }
  }

  for (const post of mockPosts) {
    const categoryIds = post.categories.map((name) => categoryMap.get(name)!);
    const tagIds = post.tags.map((name) => tagMap.get(name)!);

    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(post.publishedAt),
        categories: { set: categoryIds.map((id) => ({ id })) },
        tags: { set: tagIds.map((id) => ({ id })) },
      },
      create: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(post.publishedAt),
        authorId: admin.id,
        categories: { connect: categoryIds.map((id) => ({ id })) },
        tags: { connect: tagIds.map((id) => ({ id })) },
      },
    });
  }

  console.log(`Seeded ${mockPosts.length} posts`);

  for (const project of mockProjects) {
    await prisma.project.upsert({
      where: { slug: project.slug },
      update: {
        title: project.title,
        description: project.description,
        problem: project.problem,
        solution: project.solution,
        result: project.result,
        stack: project.stack,
        roles: project.roles,
        repoUrl: project.repoUrl ?? null,
        demoUrl: project.demoUrl ?? null,
      },
      create: {
        title: project.title,
        slug: project.slug,
        description: project.description,
        problem: project.problem,
        solution: project.solution,
        result: project.result,
        stack: project.stack,
        roles: project.roles,
        repoUrl: project.repoUrl ?? null,
        demoUrl: project.demoUrl ?? null,
      },
    });
  }

  console.log(`Seeded ${mockProjects.length} projects`);

  const sampleResumePdf =
    "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

  await prisma.siteSettings.upsert({
    where: { id: "site" },
    update: {
      hhUrl: siteProfile.social.hh,
      resumePdf: sampleResumePdf,
    },
    create: {
      id: "site",
      hhUrl: siteProfile.social.hh,
      resumePdf: sampleResumePdf,
    },
  });

  console.log("Seeded site settings (portfolio hh.ru)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
