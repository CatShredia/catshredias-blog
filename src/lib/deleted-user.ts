export const DELETED_USER_DISPLAY_NAME = "удаленный пользователь";

export type UserWithDeletion = {
  deletedAt: Date | null;
  name?: string | null;
  image?: string | null;
} | null;

export function isUserDeleted(user: UserWithDeletion): boolean {
  return user?.deletedAt != null;
}

export function mapCommentAuthor(
  user: UserWithDeletion,
  fallbackName: string,
): { authorName: string; authorImage: string | null } {
  if (isUserDeleted(user)) {
    return {
      authorName: DELETED_USER_DISPLAY_NAME,
      authorImage: null,
    };
  }

  return {
    authorName: user?.name ?? fallbackName,
    authorImage: user?.image ?? null,
  };
}
