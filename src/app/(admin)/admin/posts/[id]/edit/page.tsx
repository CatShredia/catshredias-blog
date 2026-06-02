import Link from "next/link";
import { notFound } from "next/navigation";

import {
  deletePostAction,
  updatePostAction,
} from "@/app/(admin)/admin/posts/actions";
import { PostForm } from "@/components/admin/post-form";
import { Button } from "@/components/ui/button";
import { AdminContainer } from "@/components/ui/admin-container";
import { getAdminPost } from "@/lib/queries/admin";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export default async function EditPostPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const post = await getAdminPost(id);
  if (!post) notFound();

  const updateAction = updatePostAction.bind(null, id);

  return (
    <AdminContainer wide className="py-6">
      <Link href="/admin/posts" className="text-sm text-muted hover:text-foreground">
        ← К списку постов
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Редактирование</h1>
      {query.saved ? (
        <p className="mt-2 text-sm text-muted" role="status">
          Сохранено.
        </p>
      ) : null}

      <div className="mt-6">
        <PostForm
          mode="edit"
          post={post}
          saveAction={updateAction}
          syncContentFromServer={query.saved === "1"}
        />
      </div>

      <form action={deletePostAction.bind(null, id)} className="mt-8">
        <Button type="submit" variant="ghost">
          Удалить пост
        </Button>
      </form>
    </AdminContainer>
  );
}
