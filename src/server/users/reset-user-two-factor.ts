import "server-only";

import { prisma } from "@/lib/db/prisma";
import { lockInstanceMutation, requireAdminInTransaction } from "@/server/warehouses/transaction-lock";

export async function resetUserTwoFactor(userId: string, actorId: string) {
  await prisma.$transaction(async (transaction) => {
    await lockInstanceMutation(transaction);
    await requireAdminInTransaction(transaction, actorId);
    const user = await transaction.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false },
      select: { id: true },
    });

    const verificationRows = await transaction.verification.findMany({
      where: {
        value: user.id,
        OR: [
          { identifier: { startsWith: "2fa-" } },
          { identifier: { startsWith: "trust-device-" } },
        ],
      },
      select: { id: true, identifier: true },
    });
    const challengeIdentifiers = verificationRows
      .map(({ identifier }) => identifier)
      .filter((identifier) => identifier.startsWith("2fa-"));
    const attemptIdentifiers = challengeIdentifiers.map((identifier) =>
      `2fa-attempts-${identifier}`,
    );

    await transaction.twoFactor.deleteMany({ where: { userId: user.id } });
    await transaction.passkey.deleteMany({ where: { userId: user.id } });
    if (verificationRows.length > 0) {
      await transaction.verification.deleteMany({
        where: { id: { in: verificationRows.map(({ id }) => id) } },
      });
    }
    if (attemptIdentifiers.length > 0) {
      await transaction.verification.deleteMany({
        where: { identifier: { in: attemptIdentifiers } },
      });
    }
    await transaction.session.deleteMany({ where: { userId: user.id } });
  });
}
