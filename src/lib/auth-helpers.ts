import { Role } from "@prisma/client";

export function isAdminRole(role: string | undefined) {
  return role === Role.ADMIN;
}
