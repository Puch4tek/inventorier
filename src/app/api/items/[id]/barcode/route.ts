import { getCurrentUser } from "@/server/auth/get-current-user";
import { getCurrentWarehouse } from "@/server/warehouses/current-warehouse";
import { withWarehouseRead } from "@/server/warehouses/permissions";
import { WarehouseAccessError } from "@/server/warehouses/transaction-lock";
import * as bwipjs from "bwip-js/node";
import { getTranslations } from "next-intl/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const t = await getTranslations("items");
  if (!(await getCurrentUser())) {
    return new Response(t("api.unauthorized"), { status: 401 });
  }

  const itemId = Number((await params).id);
  if (!Number.isInteger(itemId) || itemId <= 0) {
    return new Response(t("api.invalidItemId"), { status: 400 });
  }

  let current;
  try {
    current = await getCurrentWarehouse();
  } catch (error) {
    if (error instanceof WarehouseAccessError) return new Response(t("api.noActiveWarehouse"), { status: 403 });
    throw error;
  }
  if (!current) return new Response(t("api.noActiveWarehouse"), { status: 403 });

  let item;
  try {
    item = await withWarehouseRead(current, (transaction) => transaction.item.findFirst({
      where: { id: itemId, location: { warehouseId: current.warehouse.id } },
      select: { barcode: true },
    }));
  } catch (error) {
    if (error instanceof WarehouseAccessError) return new Response(t("api.noActiveWarehouse"), { status: 403 });
    throw error;
  }

  if (!item) {
    return new Response(t("api.itemNotFound"), { status: 404 });
  }

  const format = new URL(request.url).searchParams.get("format") ?? "svg";
  const options = {
    bcid: "code128",
    text: item.barcode,
    scale: 4,
    height: 24,
    includetext: true,
    textsize: 12,
    textxalign: "center" as const,
    padding: 8,
    backgroundcolor: "ffffff",
  };

  try {
    if (format === "png") {
      const png = await bwipjs.toBuffer(options);
      return new Response(Uint8Array.from(png), {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "private, no-store",
        },
      });
    }

    if (format === "svg") {
      const svg = bwipjs.toSVG(options);
      return new Response(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "private, no-store",
        },
      });
    }

    return new Response(t("api.unsupportedBarcodeFormat"), { status: 400 });
  } catch {
    return new Response(t("api.barcodeGenerationFailed"), { status: 500 });
  }
}
