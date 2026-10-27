import { getCurrentUser } from "@/server/auth/get-current-user";
import { getCurrentWarehouse } from "@/server/warehouses/current-warehouse";
import { withWarehouseRead } from "@/server/warehouses/permissions";
import { WarehouseAccessError } from "@/server/warehouses/transaction-lock";

export async function GET(request: Request) {
  if (!(await getCurrentUser())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const barcode = new URL(request.url).searchParams.get("barcode")?.trim();
  if (!barcode) {
    return new Response("Barcode is required", { status: 400 });
  }

  let current;
  try {
    current = await getCurrentWarehouse();
  } catch (error) {
    if (error instanceof WarehouseAccessError) return new Response("No active warehouse", { status: 403 });
    throw error;
  }
  if (!current) return new Response("No active warehouse", { status: 403 });
  let item;
  try {
    item = await withWarehouseRead(current, (transaction) => transaction.item.findFirst({
      where: { barcode, location: { warehouseId: current.warehouse.id } },
      select: { id: true },
    }));
  } catch (error) {
    if (error instanceof WarehouseAccessError) return new Response("No active warehouse", { status: 403 });
    throw error;
  }

  if (!item) {
    return new Response("Item not found", { status: 404 });
  }

  return Response.json(item, { headers: { "Cache-Control": "private, no-store" } });
}
