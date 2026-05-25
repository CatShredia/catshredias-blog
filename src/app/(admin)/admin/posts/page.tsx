import { AdminPostsTable } from "@/components/admin/admin-posts-table";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { listAdminPosts } from "@/lib/queries/admin";

export default async function AdminPostsPage() {
  const posts = await listAdminPosts();

  return (
    <Container className="py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Посты</h1>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/admin/posts/new">Новый пост</ButtonLink>
          <ButtonLink href="/admin/formatting" variant="secondary">
            Правила Markdown
          </ButtonLink>
        </div>
      </div>

      <AdminPostsTable
        posts={posts.map((post) => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          status: post.status,
          publishedAt: post.publishedAt?.toISOString() ?? null,
          updatedAt: post.updatedAt.toISOString(),
        }))}
      />
    </Container>
  );
}
