import "server-only";

import { randomUUID } from "node:crypto";

export function generateBarcode(): string {
  return `I-${randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase()}`;
}