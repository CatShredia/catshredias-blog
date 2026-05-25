export const STAR_FILLED = "⭐";
export const STAR_EMPTY = "☆";

export function formatStarRating(rating: number, max = 5): string {
  return Array.from({ length: max }, (_, index) =>
    index < rating ? STAR_FILLED : STAR_EMPTY,
  ).join("");
}
