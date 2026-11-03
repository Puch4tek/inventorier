import "server-only";

import { requireWarehouseDataManager, withWarehouseMutation } from "@/server/warehouses/permissions";
import { updateItemInTransaction, type UpdateItemInput } from "./update-item-transaction";

export type { UpdateItemInput } from "./update-item-transaction";

export async function updateItem(input: UpdateItemInput) {
  const current = await requireWarehouseDataManager();
  return withWarehouseMutation(current, true, (transaction) =>
    updateItemInTransaction(transaction, current, input),
  );
}
