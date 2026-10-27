"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { isAPIError } from "better-auth/api";
import { localReturnPath } from "@/lib/local-return-path";
import { TWO_FACTOR_RESET_REQUIRED_MESSAGE } from "@/server/auth/two-factor-policy";

export type LoginActionState = {
    error?: string;
}

export async function loginAction(_previousState: LoginActionState, formData: FormData): Promise<LoginActionState> {
    let email = formData.get("email") ;
    const password = formData.get("password") ;
    if (typeof email !== "string" || typeof password !== "string") {
        return {error: "Uzupełnij wszystkie pola."};
    }
    email = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
        where: { email },
        select: { isActive: true, mustChangePassword: true },
    });
    if (user && !user.isActive) {
        return {error: "To konto jest zablokowane. Skontaktuj się z administratorem."};
    }
    try {
        await auth.api.signInEmail({
            body: {
                email,
                password,
            },
        });
    } catch (error) {
        if (isAPIError(error) && error.body?.code === "TWO_FACTOR_RESET_REQUIRED") {
            return {error: TWO_FACTOR_RESET_REQUIRED_MESSAGE};
        }
        if (isAPIError(error) && error.body?.code === "INVALID_EMAIL_OR_PASSWORD") {
            return {error: "Nieprawidłowy adres email lub hasło."};
        }
        console.error("Nie udało się zalogować:", error);
        return {error: "Nie udało się zalogować. Spróbuj ponownie."};
    }
    const next = localReturnPath(formData.get("next"));
    if (user?.mustChangePassword) {
        return redirect(`/change-password?next=${encodeURIComponent(next)}`);
    }
    return redirect(next);
}