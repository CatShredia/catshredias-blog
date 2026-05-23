import { auth, signOut } from "@/lib/auth";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const session = await auth();

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-bold">Панель управления</h1>
      <p className="mt-2 text-muted">
        Вы вошли как {session?.user?.email ?? "администратор"}.
      </p>
      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold">Этап 3</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>CRUD постов и проектов</li>
          <li>Markdown-редактор с live preview</li>
          <li>Загрузка файлов в /uploads</li>
        </ul>
      </div>
      <form
        className="mt-6"
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
