import "server-only"

import { prisma } from "@/lib/db/prisma";
import {cookies} from "next/headers";

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;
    if (!sessionToken) {
        return null;
    }
    const session = await prisma.session.findUnique({
        where: {
            sessionToken: sessionToken,
        },
        select: {
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                },
            },
            expiresAt: true,
        },
    });
    if (!session) {
        return null;
    }
    if (session.expiresAt <= new Date()) {
        return null;
    }
    return session.user;
}