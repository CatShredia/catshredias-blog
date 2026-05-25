"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function DeleteAccountSection() {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirm === "УДАЛИТЬ";

  async function handleDelete() {
    if (!canDelete) return;

    setDeleting(true);
    setError(null);

    const response = await fetch("/api/user/account", { method: "DELETE" });

    setDeleting(false);

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Не удалось удалить аккаунт");
      return;
    }

    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mt-10 rounded-xl border border-red-500/30 bg-red-500/5 p-5">
      <h2 className="font-medium text-red-700 dark:text-red-400">
        Удаление аккаунта
      </h2>
      <p className="mt-2 text-sm text-muted">
        Аккаунт будет деактивирован. Комментарии останутся, но имя сменится на
        «удаленный пользователь». Войти снова будет нельзя.
      </p>
      <label className="mt-4 block text-sm">
        Введите <span className="font-mono font-medium">УДАЛИТЬ</span> для
        подтверждения
        <input
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          className="mt-1 min-h-11 w-full rounded-lg border border-border bg-card px-3 font-mono text-sm"
          autoComplete="off"
        />
      </label>
      {error ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        className="mt-4 border border-red-500/40 text-red-700 hover:bg-red-500/10 dark:text-red-400"
        disabled={!canDelete || deleting}
        onClick={() => void handleDelete()}
      >
        {deleting ? "Удаление…" : "Удалить аккаунт"}
      </Button>
    </div>
  );
}
