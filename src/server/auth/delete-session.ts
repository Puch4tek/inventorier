import "server-only"

import { prisma } from "@/lib/db/prisma";
import { cookies } from "next/headers";

export async function deleteSession() {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;
    if (!sessionToken) {
        return;
    }
    await prisma.session.deleteMany({
        where: {
            sessionToken,
        },
    });
    cookieStore.delete({
        name: "sessionToken",
        path: "/",
    });
}