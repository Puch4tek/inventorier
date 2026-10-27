import "server-only";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { getActiveSession } from "@/server/auth/get-current-user";

export async function changeCurrentUserPassword(
  currentPassword: string,
  newPassword: string,
) {
  if (newPassword.length < 8) {
    throw new Error("Hasło musi mieć co najmniej 8 znaków.");
  }
  if (currentPassword === newPassword) {
    throw new Error("Nowe hasło musi różnić się od obecnego.");
  }

  const activeSession = await getActiveSession();
  if (!activeSession) {
    throw new Error("Musisz być zalogowany.");
  }
  const { user, session } = activeSession;

  const account = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
    select: { password: true },
  });
  if (!account?.password || !(await bcrypt.compare(currentPassword, account.password))) {
    throw new Error("Nieprawidłowe obecne hasło.");
  }

  const password = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction([
    prisma.account.updateMany({
      where: { userId: user.id, providerId: "credential" },
      data: { password },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: password, mustChangePassword: false },
    }),
    prisma.session.deleteMany({
      where: { userId: user.id, id: { not: session.id } },
    }),
  ]);
}
