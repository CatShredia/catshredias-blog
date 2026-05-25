"use client";

import { useState } from "react";

import { STAR_EMPTY, STAR_FILLED } from "@/lib/book-rating";

export function StarRatingDisplay({
  value,
  max = 5,
  className = "",
}: {
  value: number;
  max?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex gap-0.5 text-lg leading-none ${className}`}
      aria-label={`Рейтинг ${value} из ${max}`}
    >
      {Array.from({ length: max }, (_, index) => (
        <span key={index} aria-hidden>
          {index < value ? STAR_FILLED : STAR_EMPTY}
        </span>
      ))}
    </span>
  );
}

export function StarRatingInput({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: number | null;
}) {
  const [rating, setRating] = useState(defaultValue ?? 0);

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={rating > 0 ? String(rating) : ""} />
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, index) => {
            const star = index + 1;
            return (
              <button
                key={star}
                type="button"
                className="rounded p-0.5 text-2xl leading-none transition hover:scale-110"
                aria-label={`Оценка ${star} из 5`}
                onClick={() => setRating(star === rating ? 0 : star)}
              >
                {star <= rating ? STAR_FILLED : STAR_EMPTY}
              </button>
            );
          })}
        </div>
        {rating > 0 ? (
          <button
            type="button"
            className="text-xs text-muted underline"
            onClick={() => setRating(0)}
          >
            Сбросить
          </button>
        ) : (
          <span className="text-xs text-muted">Без оценки</span>
        )}
      </div>
    </div>
  );
}
