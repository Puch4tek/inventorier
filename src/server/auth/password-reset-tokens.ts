import "server-only";

import { createHash } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";

export function passwordResetIdentifier(token: string): string {
  return `password-reset:${createHash("sha256").update(token, "utf8").digest("hex")}`;
}

export async function deleteUserPasswordResetTokens(
  transaction: Prisma.TransactionClient,
  userId: string,
) {
  await transaction.$executeRaw`
    DELETE FROM "verification"
    WHERE "value" = ${userId}
      AND "identifier" LIKE 'password-reset:%'
  `;
}
