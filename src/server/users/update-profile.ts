import "server-only";

import { prisma } from "@/lib/db/prisma";
import { requireCurrentUser } from "@/server/auth/get-current-user";
import { UserOperationError } from "./public-errors";

export async function updateCurrentUserProfile(name: string) {
  const normalizedName = name.trim().replace(/\s+/g, " ");

  if (normalizedName.length < 2) {
    throw new UserOperationError("profile-name-too-short", "Imię i nazwisko muszą mieć co najmniej 2 znaki.");
  }
  if (normalizedName.length > 100) {
    throw new UserOperationError("profile-name-too-long", "Imię i nazwisko mogą mieć maksymalnie 100 znaków.");
  }

  const user = await requireCurrentUser();

  return prisma.user.update({
    where: { id: user.id },
    data: { name: normalizedName },
    select: { id: true, name: true, email: true },
  });
}
