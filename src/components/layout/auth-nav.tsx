"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

import { isAdminRole } from "@/lib/auth-helpers";

export function AuthNav() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span className="text-sm text-muted">…</span>;
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/login"
          className="rounded-lg border border-border px-3 py-2 hover:bg-card min-h-11 inline-flex items-center"
        >
          Войти
        </Link>
        <Link
          href="/register"
          className="hidden rounded-lg bg-accent px-3 py-2 text-accent-foreground sm:inline-flex min-h-11 items-center"
        >
          Регистрация
        </Link>
      </div>
    );
  }

  const displayName = session.user.name ?? session.user.email ?? "";
  const initial = displayName.charAt(0).toUpperCase() || "?";

  return (
    <div className="flex items-center gap-2 text-sm">
      <Link
        href="/profile"
        className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1 hover:bg-card"
        title={displayName}
      >
        <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border bg-card">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-medium">
              {initial}
            </span>
          )}
        </span>
        <span className="hidden max-w-[120px] truncate text-muted hover:text-foreground sm:inline">
          {displayName}
        </span>
      </Link>
      {isAdminRole(session.user.role) ? (
        <Link
          href="/admin"
          className="rounded-lg border border-border px-3 py-2 hover:bg-card min-h-11 inline-flex items-center"
        >
          Админка
        </Link>
      ) : null}
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-lg border border-border px-3 py-2 hover:bg-card min-h-11"
      >
        Выйти
      </button>
    </div>
  );
}
