import Link from "next/link";

import { createPostAction } from "@/app/(admin)/admin/posts/actions";
import { PostForm } from "@/components/admin/post-form";
import { Container } from "@/components/ui/container";

export default function NewPostPage() {
  return (
    <Container className="py-10">
      <Link href="/admin/posts" className="text-sm text-muted hover:text-foreground">
        ← К списку постов
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Новый пост</h1>
      <div className="mt-8">
        <PostForm mode="create" saveAction={createPostAction} />
      </div>
    </Container>
  );
}
