import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { lockInstanceMutation } from "@/server/warehouses/transaction-lock";

const DEFAULT_NAMESPACE = "smtp-test-limit";

function getIdentifierKey(identifier: string, namespace: string): string {
  if (
    typeof identifier !== "string" ||
    identifier.length === 0 ||
    identifier.length > 4096 ||
    !/^[a-z0-9][a-z0-9-]{0,63}$/.test(namespace)
  ) {
    throw new TypeError("Invalid email rate limit key.");
  }

  const digest = createHash("sha256").update(identifier, "utf8").digest("hex");
  return `${namespace}:${digest}`;
}

export async function consumeEmailRateLimit(
  identifier: string,
  max: number,
  windowMs: number,
  namespace = DEFAULT_NAMESPACE,
): Promise<boolean> {
  if (
    !Number.isSafeInteger(max) ||
    max < 1 ||
    !Number.isSafeInteger(windowMs) ||
    windowMs < 1 ||
    Date.now() + windowMs > 8_640_000_000_000_000
  ) {
    throw new TypeError("Invalid email rate limit configuration.");
  }

  const key = getIdentifierKey(identifier, namespace);
  return prisma.$transaction(async (transaction) => {
    await lockInstanceMutation(transaction);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + windowMs);
    await transaction.verification.deleteMany({
      where: { identifier: key, expiresAt: { lte: now } },
    });
    const expired = await transaction.verification.findMany({
      where: { identifier: { startsWith: `${namespace}:` }, expiresAt: { lte: now } },
      select: { id: true },
      take: 100,
    });
    if (expired.length) {
      await transaction.verification.deleteMany({ where: { id: { in: expired.map(({ id }) => id) } } });
    }
    const count = await transaction.verification.count({
      where: { identifier: key, expiresAt: { gt: now } },
    });
    if (count >= max) return false;

    await transaction.verification.create({
      data: {
        id: randomUUID(),
        identifier: key,
        value: "1",
        expiresAt,
      },
    });
    return true;
  });
}
