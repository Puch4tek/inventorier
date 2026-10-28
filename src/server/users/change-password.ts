import "server-only";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { getActiveSession } from "@/server/auth/get-current-user";
import { lockInstanceMutation } from "@/server/warehouses/transaction-lock";
import {
  deleteUserPasswordResetTokens,
} from "@/server/auth/password-reset-tokens";

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
  await prisma.$transaction(async (transaction) => {
    await lockInstanceMutation(transaction);
    const active = await transaction.session.findFirst({
      where: { id: session.id, userId: user.id, expiresAt: { gt: new Date() }, user: { isActive: true } },
      select: { id: true },
    });
    if (!active) throw new Error("Musisz być zalogowany.");
    const updated = await transaction.account.updateMany({
      where: { userId: user.id, providerId: "credential", password: account.password },
      data: { password },
    });
    if (updated.count !== 1) throw new Error("Hasło zostało już zmienione. Zaloguj się ponownie.");
    await transaction.user.update({
      where: { id: user.id },
      data: { mustChangePassword: false },
    });
    await deleteUserPasswordResetTokens(transaction, user.id);
    await transaction.session.deleteMany({
      where: { userId: user.id, id: { not: session.id } },
    });
  });
}
