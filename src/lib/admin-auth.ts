import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/auth-helpers";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || !isAdminRole(session.user.role)) {
    throw new Error("Unauthorized");
  }
  return session;
}
