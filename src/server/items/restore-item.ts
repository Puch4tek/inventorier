import "server-only";

import { setItemArchived } from "@/server/items/delete-item";

export async function restoreItem(id: number) {
  return setItemArchived(id, false);
}
