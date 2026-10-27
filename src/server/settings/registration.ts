import "server-only";

import { prisma } from "@/lib/db/prisma";
import { lockInstanceMutation, requireAdminInTransaction } from "@/server/warehouses/transaction-lock";

const SETTINGS_ID = 1;

export const REGISTRATION_DISABLED_MESSAGE =
  "Samodzielna rejestracja jest wyłączona. Skontaktuj się z administratorem, aby utworzyć konto.";

export async function isRegistrationEnabled() {
  const settings = await prisma.appSettings.findUnique({
    where: { id: SETTINGS_ID },
    select: { registrationEnabled: true },
  });

  return settings?.registrationEnabled ?? true;
}

export async function setRegistrationEnabled(enabled: boolean, actorId: string) {
  await prisma.$transaction(async (transaction) => {
    await lockInstanceMutation(transaction);
    await requireAdminInTransaction(transaction, actorId);
    await transaction.appSettings.upsert({
      where: { id: SETTINGS_ID },
      update: { registrationEnabled: enabled },
      create: { id: SETTINGS_ID, registrationEnabled: enabled },
    });
  });
}
