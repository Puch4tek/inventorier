import "server-only";

import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";
import {cookies} from "next/headers";

export async function createSession(userId: number) {
    const sessionToken = crypto.randomUUID();
    await prisma.session.create(
        {
            data: {
                userId: userId,
                sessionToken: sessionToken,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
            },
        }
    )
    const cookieStore = await cookies()
    cookieStore.set({
        name: "sessionToken",
        value: sessionToken,
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
    })

}