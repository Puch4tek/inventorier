import "server-only";

import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import type { Role } from "@/generated/prisma/client";
import { lockInstanceMutation, requireAdminInTransaction } from "@/server/warehouses/transaction-lock";

type CreateUserInput = {
    name: string;
    email: string;
    password: string;
    role?: Role;
    mustChangePassword?: boolean;
    actorId?: string;
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
    const userId = randomUUID();

    return prisma.$transaction(async (transaction) => {
        await lockInstanceMutation(transaction);
        if (input.role !== undefined) {
            if (!input.actorId) throw new Error("Nie masz uprawnień do tworzenia kont o wybranej roli.");
            await requireAdminInTransaction(transaction, input.actorId);
        } else {
            const settings = await transaction.appSettings.findUnique({
                where: { id: 1 },
                select: { registrationEnabled: true },
            });
            if (settings?.registrationEnabled === false) {
                throw new Error("Samodzielna rejestracja jest wyłączona. Skontaktuj się z administratorem, aby utworzyć konto.");
            }
        }
        const role = input.role ?? (
            await transaction.user.count() === 0 ? "ADMIN" : "USER"
        );
        return transaction.user.create({
            data: {
                id: userId,
                name,
                email,
                passwordHash,
                mustChangePassword: input.mustChangePassword ?? false,
                role,
                accounts: {
                    create: {
                        id: randomUUID(),
                        accountId: userId,
                        providerId: "credential",
                        password: passwordHash,
                    },
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });
    });
}