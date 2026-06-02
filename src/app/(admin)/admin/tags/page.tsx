import Link from "next/link";

import {
  createTagAction,
  deleteTagAction,
  updateTagAction,
} from "@/app/(admin)/admin/tags/actions";
import {
  AdminTaxonomyCreateForm,
  AdminTaxonomyRowForm,
} from "@/components/admin/admin-taxonomy-form";
import { Container } from "@/components/ui/container";
import { listAdminTags } from "@/lib/queries/admin";

export default async function AdminTagsPage() {
  const tags = await listAdminTags();

  return (
    <Container className="py-10">
      <Link href="/admin/posts" className="text-sm text-muted hover:text-foreground">
        ← К постам
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Теги</h1>
      <p className="mt-2 text-sm text-muted">
        Справочник тегов для постов блога.
      </p>

      <div className="mt-8 rounded-xl border border-border bg-card p-4">
        <AdminTaxonomyCreateForm label="Новый тег" action={createTagAction} />
      </div>

      <ul className="mt-6 space-y-3">
        {tags.map((tag) => (
          <AdminTaxonomyRowForm
            key={tag.id}
            id={tag.id}
            name={tag.name}
            slug={tag.slug}
            postsCount={tag._count.posts}
            updateAction={updateTagAction.bind(null, tag.id)}
            deleteAction={deleteTagAction}
          />
        ))}
      </ul>
      {tags.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Тегов пока нет.</p>
      ) : null}
    </Container>
  );
}
