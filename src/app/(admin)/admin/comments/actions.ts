"use server";

import { ReportStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-auth";
import {
  deleteComment,
  hideComment,
  markAllCommentsSeen,
  markCommentSeen,
  updateReportStatus,
} from "@/lib/queries/comments";

export async function markAllSeenAction() {
  await requireAdmin();
  await markAllCommentsSeen();
  revalidatePath("/admin/comments");
  revalidatePath("/admin");
}

export async function markSeenAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await markCommentSeen(id);
  revalidatePath("/admin/comments");
  revalidatePath("/admin");
}

export async function hideCommentAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await hideComment(id);
  revalidatePath("/admin/comments");
  revalidatePath("/blog", "layout");
}

export async function deleteCommentAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await deleteComment(id);
  revalidatePath("/admin/comments");
  revalidatePath("/blog", "layout");
}

export async function resolveReportAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  const status = formData.get("status");
  const note = formData.get("note");
  const commentId = formData.get("commentId");
  const hide = formData.get("hide") === "1";
  if (typeof id !== "string" || typeof status !== "string") return;

  if (hide && typeof commentId === "string") {
    await hideComment(commentId);
  }

  await updateReportStatus(
    id,
    status as ReportStatus,
    typeof note === "string" ? note : undefined,
  );
  revalidatePath("/admin/reports");
  revalidatePath("/admin/comments");
  revalidatePath("/admin");
  revalidatePath("/blog", "layout");
}
