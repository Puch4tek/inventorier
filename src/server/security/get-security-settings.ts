import "server-only";

import { prisma } from "@/lib/db/prisma";

export type SecuritySettingsData = {
  twoFactorEnabled: boolean;
  totpSetupPending: boolean;
  passkeys: Array<{
    id: string;
    name: string | null;
    createdAt: string | null;
    deviceType: string;
    backedUp: boolean;
  }>;
};

export async function getSecuritySettings(
  userId: string,
): Promise<SecuritySettingsData> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      twoFactorEnabled: true,
      twofactors: { select: { verified: true }, take: 1 },
      passkeys: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          deviceType: true,
          backedUp: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    throw new Error("Nie udało się odczytać ustawień bezpieczeństwa.");
  }

  return {
    twoFactorEnabled: user.twoFactorEnabled === true,
    totpSetupPending:
      user.twofactors[0]?.verified === false && user.twoFactorEnabled !== true,
    passkeys: user.passkeys.map((passkey) => ({
      id: passkey.id,
      name: passkey.name,
      createdAt: passkey.createdAt?.toISOString() ?? null,
      deviceType: passkey.deviceType,
      backedUp: passkey.backedUp,
    })),
  };
}
