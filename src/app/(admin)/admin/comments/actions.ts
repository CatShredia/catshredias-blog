"use server";

import { CommentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import {
  deleteComment,
  updateCommentStatus,
} from "@/lib/queries/comments";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
}

export async function approveComment(id: string) {
  await requireAdmin();
  await updateCommentStatus(id, CommentStatus.APPROVED);
  revalidatePath("/admin/comments");
  revalidatePath("/blog", "layout");
}

export async function rejectComment(id: string) {
  await requireAdmin();
  await updateCommentStatus(id, CommentStatus.REJECTED);
  revalidatePath("/admin/comments");
}

export async function removeComment(id: string) {
  await requireAdmin();
  await deleteComment(id);
  revalidatePath("/admin/comments");
  revalidatePath("/blog", "layout");
}

function getCommentId(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    throw new Error("Missing comment id");
  }
  return id;
}

export async function approveCommentForm(formData: FormData) {
  await approveComment(getCommentId(formData));
}

export async function rejectCommentForm(formData: FormData) {
  await rejectComment(getCommentId(formData));
}

export async function removeCommentForm(formData: FormData) {
  await removeComment(getCommentId(formData));
}
