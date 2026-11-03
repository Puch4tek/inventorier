import "server-only";

import { requireWarehouseDataManager, withWarehouseMutation } from "@/server/warehouses/permissions";
import { setItemArchivedInTransaction } from "./delete-item-transaction";

export async function deleteItem(id: number) {
  return setItemArchived(id, true);
}

export async function setItemArchived(id: number, archived: boolean) {
  const current = await requireWarehouseDataManager();
  return withWarehouseMutation(current, true, (transaction) =>
    setItemArchivedInTransaction(transaction, current, id, archived),
  );
}
