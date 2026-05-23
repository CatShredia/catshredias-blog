"use client";

import Link from "next/link";
import { useActionState } from "react";

import { registerUser, type RegisterState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

const initialState: RegisterState = {};

export function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState(registerUser, initialState);

  return (
    <form action={action} className="mx-auto max-w-sm space-y-4">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          Имя
        </label>
        <input
          id="name"
          name="name"
          required
          autoComplete="name"
          className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
        />
        {state.fieldErrors?.name ? (
          <p className="mt-1 text-sm text-red-600">{state.fieldErrors.name[0]}</p>
        ) : null}
      </div>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
        />
        {state.fieldErrors?.email ? (
          <p className="mt-1 text-sm text-red-600">{state.fieldErrors.email[0]}</p>
        ) : null}
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">
          Пароль
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
        />
        {state.fieldErrors?.password ? (
          <p className="mt-1 text-sm text-red-600">
            {state.fieldErrors.password[0]}
          </p>
        ) : null}
      </div>
      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-1 block text-sm font-medium"
        >
          Повторите пароль
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
        />
        {state.fieldErrors?.confirmPassword ? (
          <p className="mt-1 text-sm text-red-600">
            {state.fieldErrors.confirmPassword[0]}
          </p>
        ) : null}
      </div>
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Регистрация…" : "Зарегистрироваться"}
      </Button>
      <p className="text-center text-sm text-muted">
        Уже есть аккаунт?{" "}
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="text-accent underline-offset-4 hover:underline"
        >
          Войти
        </Link>
      </p>
    </form>
  );
}
