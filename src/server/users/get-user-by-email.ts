import "server-only";

import { prisma } from "@/lib/db/prisma";

export async function getUserByEmail(email: string) {
    email = email.trim().toLowerCase();
    return prisma.user.findUnique({
        where: {
            email,
        },
    });
}