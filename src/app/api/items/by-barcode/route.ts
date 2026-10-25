import { getCurrentUser } from "@/server/auth/get-current-user";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  if (!(await getCurrentUser())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const barcode = new URL(request.url).searchParams.get("barcode")?.trim();
  if (!barcode) {
    return new Response("Barcode is required", { status: 400 });
  }

  const item = await prisma.item.findUnique({
    where: { barcode },
    select: { id: true },
  });

  if (!item) {
    return new Response("Item not found", { status: 404 });
  }

  return Response.json(item);
}
