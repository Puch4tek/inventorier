import { getCurrentUser } from "@/server/auth/get-current-user";
import { prisma } from "@/lib/db/prisma";
import * as bwipjs from "bwip-js/node";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getCurrentUser())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const itemId = Number((await params).id);
  if (!Number.isInteger(itemId) || itemId <= 0) {
    return new Response("Invalid item ID", { status: 400 });
  }

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { barcode: true },
  });

  if (!item) {
    return new Response("Item not found", { status: 404 });
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
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    if (format === "svg") {
      const svg = bwipjs.toSVG(options);
      return new Response(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    return new Response("Unsupported barcode format", { status: 400 });
  } catch {
    return new Response("Failed to generate barcode", { status: 500 });
  }
}
