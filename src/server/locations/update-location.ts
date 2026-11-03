import "server-only";

import { requireWarehouseDataManager, withWarehouseMutation } from "@/server/warehouses/permissions";
import { updateLocationInTransaction, type UpdateLocationInput } from "./update-location-transaction";

export type { UpdateLocationInput } from "./update-location-transaction";

export async function updateLocation(input: UpdateLocationInput) {
  const current = await requireWarehouseDataManager();
  return withWarehouseMutation(current, true, (transaction) =>
    updateLocationInTransaction(transaction, current.warehouse.id, input),
  );
}
