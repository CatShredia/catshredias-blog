import Link from "next/link";

import { auth, signOut } from "@/lib/auth";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { listAdminPosts, listAdminProjects } from "@/lib/queries/admin";
import { countUnreadNotifications } from "@/lib/notifications";
import { countPendingReports, countUnseenComments } from "@/lib/queries/comments";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const session = await auth();
  const [postsCount, projectsCount, booksCount, unseenComments, pendingReports, unreadNotifications] =
    await Promise.all([
      prisma.post.count(),
      listAdminProjects().then((items) => items.length),
      prisma.book.count(),
      countUnseenComments(),
      countPendingReports(),
      countUnreadNotifications(),
    ]);

  const recentPosts = await listAdminPosts();

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-bold">Панель управления</h1>
      <p className="mt-2 text-muted">
        Вы вошли как {session?.user?.email ?? "администратор"}.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Link
          href="/admin/posts"
          className="rounded-xl border border-border bg-card p-5 hover:border-accent/40"
        >
          <p className="text-2xl font-bold">{postsCount}</p>
          <p className="text-sm text-muted">Постов</p>
        </Link>
        <Link
          href="/admin/books"
          className="rounded-xl border border-border bg-card p-5 hover:border-accent/40"
        >
          <p className="text-2xl font-bold">{booksCount}</p>
          <p className="text-sm text-muted">Книг</p>
        </Link>
        <Link
          href="/admin/projects"
          className="rounded-xl border border-border bg-card p-5 hover:border-accent/40"
        >
          <p className="text-2xl font-bold">{projectsCount}</p>
          <p className="text-sm text-muted">Проектов</p>
        </Link>
        <Link
          href="/admin/notifications"
          className="rounded-xl border border-border bg-card p-5 hover:border-accent/40"
        >
          <p className="text-2xl font-bold">{unreadNotifications}</p>
          <p className="text-sm text-muted">Уведомлений</p>
        </Link>
        <Link
          href="/admin/comments"
          className="rounded-xl border border-border bg-card p-5 hover:border-accent/40"
        >
          <p className="text-2xl font-bold">{unseenComments}</p>
          <p className="text-sm text-muted">Новых комментариев</p>
        </Link>
        <Link
          href="/admin/reports"
          className="rounded-xl border border-border bg-card p-5 hover:border-accent/40"
        >
          <p className="text-2xl font-bold">{pendingReports}</p>
          <p className="text-sm text-muted">Жалоб</p>
        </Link>
      </div>

      <div className="mt-10 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-semibold">Последние посты</h2>
          <Link href="/admin/posts/new" className="text-sm text-accent underline">
            Создать
          </Link>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {recentPosts.slice(0, 5).map((post) => (
            <li key={post.id} className="flex justify-between gap-4">
              <Link
                href={`/admin/posts/${post.id}/edit`}
                className="hover:text-accent"
              >
                {post.title}
              </Link>
              <span className="text-muted">{post.status}</span>
            </li>
          ))}
        </ul>
      </div>

      <form
        className="mt-8"
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/admin/login" });
        }}
      >
        <Button type="submit" variant="secondary">
          Выйти
        </Button>
      </form>
    </Container>
  );
}
