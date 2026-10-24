import "server-only";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";

type CreateUserInput = {
    name: string;
    email: string;
    password: string;
};

export async function createUser(input: CreateUserInput) {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();

    if (!name || !email || !input.password) {
        throw new Error("Name, email and password are required");
    }

    if (input.password.length < 8) {
        throw new Error("Password must be at least 8 characters long");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    return prisma.user.create({
        data: {
            name,
            email,
            passwordHash,
        },
        select: {
            id: true,
            name: true,
            email: true,
        },
    });
}