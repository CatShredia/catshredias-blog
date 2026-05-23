"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";

const contactSchema = z.object({
  name: z.string().min(2, "Минимум 2 символа"),
  email: z.string().email("Некорректный email"),
  message: z.string().min(10, "Минимум 10 символов"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = handleSubmit(async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    setSubmitted(true);
    reset();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          Имя
        </label>
        <input
          id="name"
          className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
          {...register("name")}
        />
        {errors.name ? (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        ) : null}
      </div>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
          {...register("email")}
        />
        {errors.email ? (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        ) : null}
      </div>
      <div>
        <label htmlFor="message" className="mb-1 block text-sm font-medium">
          Сообщение
        </label>
        <textarea
          id="message"
          rows={5}
          className="w-full rounded-lg border border-border bg-card px-3 py-2"
          {...register("message")}
        />
        {errors.message ? (
          <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
        ) : null}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Отправка…" : "Отправить"}
      </Button>
      {submitted ? (
        <p className="text-sm text-muted" role="status">
          Сообщение принято локально. Отправка на сервер — на этапе 3.
        </p>
      ) : null}
    </form>
  );
}
