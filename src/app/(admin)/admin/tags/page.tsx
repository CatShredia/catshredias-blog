import Link from "next/link";

import {
  createTagAction,
  deleteTagAction,
  getTagPostsAction,
  transferTagPostsAction,
  updateTagAction,
} from "@/app/(admin)/admin/tags/actions";
import { AdminTaxonomyCreateForm } from "@/components/admin/admin-taxonomy-form";
import { AdminTaxonomyTable } from "@/components/admin/admin-taxonomy-table";
import { AdminContainer } from "@/components/ui/admin-container";
import { listAdminTags } from "@/lib/queries/admin";

export default async function AdminTagsPage() {
  const tags = await listAdminTags();

  return (
    <AdminContainer className="py-6">
      <Link href="/admin/posts" className="text-sm text-muted hover:text-foreground">
        ← К постам
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Теги</h1>
      <p className="mt-2 text-sm text-muted">
        Справочник тегов для постов блога. Можно просматривать связанные посты,
        переносить их в другие теги или снимать метку перед удалением.
      </p>

      <div className="mt-8 rounded-xl border border-border bg-card p-4">
        <AdminTaxonomyCreateForm label="Новый тег" action={createTagAction} />
      </div>

      <div className="mt-6">
        <AdminTaxonomyTable
          kind="tag"
          targets={tags.map((tag) => ({
            id: tag.id,
            name: tag.name,
          }))}
          rows={tags.map((tag) => ({
            id: tag.id,
            name: tag.name,
            slug: tag.slug,
            postsCount: tag._count.posts,
            updateAction: updateTagAction.bind(null, tag.id),
          }))}
          deleteAction={deleteTagAction}
          loadPosts={getTagPostsAction}
          transferAction={transferTagPostsAction}
        />
      </div>
    </AdminContainer>
  );
}
