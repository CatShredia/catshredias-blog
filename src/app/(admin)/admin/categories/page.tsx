import Link from "next/link";

import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/app/(admin)/admin/categories/actions";
import {
  AdminTaxonomyCreateForm,
  AdminTaxonomyRowForm,
} from "@/components/admin/admin-taxonomy-form";
import { Container } from "@/components/ui/container";
import { listAdminCategories } from "@/lib/queries/admin";

export default async function AdminCategoriesPage() {
  const categories = await listAdminCategories();

  return (
    <Container className="py-10">
      <Link href="/admin/posts" className="text-sm text-muted hover:text-foreground">
        ← К постам
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Категории</h1>
      <p className="mt-2 text-sm text-muted">
        Справочник категорий для постов блога. В форме поста можно вводить
        названия через запятую — они создадутся автоматически.
      </p>

      <div className="mt-8 rounded-xl border border-border bg-card p-4">
        <AdminTaxonomyCreateForm
          label="Новая категория"
          action={createCategoryAction}
        />
      </div>

      <ul className="mt-6 space-y-3">
        {categories.map((category) => (
          <AdminTaxonomyRowForm
            key={category.id}
            id={category.id}
            name={category.name}
            slug={category.slug}
            postsCount={category._count.posts}
            updateAction={updateCategoryAction.bind(null, category.id)}
            deleteAction={deleteCategoryAction}
          />
        ))}
      </ul>
      {categories.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Категорий пока нет.</p>
      ) : null}
    </Container>
  );
}
