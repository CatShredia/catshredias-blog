import Link from "next/link";

import {
  createCategoryAction,
  deleteCategoryAction,
  getCategoryPostsAction,
  transferCategoryPostsAction,
  updateCategoryAction,
} from "@/app/(admin)/admin/categories/actions";
import { AdminTaxonomyCreateForm } from "@/components/admin/admin-taxonomy-form";
import { AdminTaxonomyTable } from "@/components/admin/admin-taxonomy-table";
import { AdminContainer } from "@/components/ui/admin-container";
import { listAdminCategories } from "@/lib/queries/admin";

export default async function AdminCategoriesPage() {
  const categories = await listAdminCategories();

  return (
    <AdminContainer className="py-6">
      <Link href="/admin/posts" className="text-sm text-muted hover:text-foreground">
        ← К постам
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Категории</h1>
      <p className="mt-2 text-sm text-muted">
        Справочник категорий для постов блога. Можно просматривать связанные посты,
        переносить их в другие категории или снимать метку перед удалением.
      </p>

      <div className="mt-8 rounded-xl border border-border bg-card p-4">
        <AdminTaxonomyCreateForm
          label="Новая категория"
          action={createCategoryAction}
        />
      </div>

      <div className="mt-6">
        <AdminTaxonomyTable
          kind="category"
          targets={categories.map((category) => ({
            id: category.id,
            name: category.name,
          }))}
          rows={categories.map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            postsCount: category._count.posts,
            updateAction: updateCategoryAction.bind(null, category.id),
          }))}
          deleteAction={deleteCategoryAction}
          loadPosts={getCategoryPostsAction}
          transferAction={transferCategoryPostsAction}
        />
      </div>
    </AdminContainer>
  );
}
