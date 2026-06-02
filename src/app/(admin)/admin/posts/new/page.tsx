import Link from "next/link";

import { createPostAction } from "@/app/(admin)/admin/posts/actions";
import { PostForm } from "@/components/admin/post-form";
import { AdminContainer } from "@/components/ui/admin-container";

export default function NewPostPage() {
  return (
    <AdminContainer wide className="py-6">
      <Link href="/admin/posts" className="text-sm text-muted hover:text-foreground">
        ← К списку постов
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Новый пост</h1>
      <div className="mt-6">
        <PostForm mode="create" saveAction={createPostAction} />
      </div>
    </AdminContainer>
  );
}
