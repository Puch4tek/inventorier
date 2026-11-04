import "server-only";

import { prisma } from "@/lib/db/prisma";
import { OIDC_PROVIDER_ID } from "@/lib/oidc-provider-config";

export type SecuritySettingsData = {
  twoFactorEnabled: boolean;
  totpSetupPending: boolean;
  oidcEnabled: boolean;
  oidcConnected: boolean;
  oidcStale: boolean;
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
      accounts: {
        where: { OR: [{ providerId: OIDC_PROVIDER_ID }, { providerId: { startsWith: "oidc-" } }] },
        select: { providerId: true },
      },
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
  const oidc = await prisma.appSettings.findUnique({
    where: { id: 1 },
    select: { oidcEnabled: true },
  });

  return {
    twoFactorEnabled: user.twoFactorEnabled === true,
    totpSetupPending:
      user.twofactors[0]?.verified === false && user.twoFactorEnabled !== true,
    oidcEnabled: oidc?.oidcEnabled === true,
    oidcConnected: user.accounts.some((account) => account.providerId === OIDC_PROVIDER_ID),
    oidcStale: user.accounts.some((account) => account.providerId !== OIDC_PROVIDER_ID),
    passkeys: user.passkeys.map((passkey) => ({
      id: passkey.id,
      name: passkey.name,
      createdAt: passkey.createdAt?.toISOString() ?? null,
      deviceType: passkey.deviceType,
      backedUp: passkey.backedUp,
    })),
  };
}
