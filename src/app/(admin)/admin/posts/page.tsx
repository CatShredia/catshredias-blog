import Link from "next/link";
import { PostStatus } from "@prisma/client";

import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { listAdminPosts } from "@/lib/queries/admin";

const statusLabel: Record<PostStatus, string> = {
  DRAFT: "Черновик",
  PUBLISHED: "Опубликован",
  SCHEDULED: "Запланирован",
};

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

      <div className="mt-8 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-card">
            <tr>
              <th className="px-4 py-3 font-medium">Заголовок</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Обновлён</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-muted">
                  Постов пока нет.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{post.title}</p>
                    <p className="text-xs text-muted">/{post.slug}</p>
                  </td>
                  <td className="px-4 py-3">{statusLabel[post.status]}</td>
                  <td className="px-4 py-3 text-muted">
                    {post.updatedAt.toLocaleDateString("ru-RU")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/posts/${post.id}/edit`}
                      className="text-accent underline-offset-4 hover:underline"
                    >
                      Редактировать
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
