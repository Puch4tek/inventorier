"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAPIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { localReturnPath } from "@/lib/local-return-path";
import { TWO_FACTOR_RESET_REQUIRED_MESSAGE } from "@/server/auth/two-factor-policy";

export type LoginActionState = {
    error?: string;
    step?: "two-factor";
}

function messageForAuthError(error: unknown): string | undefined {
    if (!isAPIError(error)) return undefined;

    switch (error.body?.code) {
        case "INVALID_EMAIL_OR_PASSWORD":
            return "Nieprawidłowy adres e-mail lub hasło.";
        case "TWO_FACTOR_RESET_REQUIRED":
            return TWO_FACTOR_RESET_REQUIRED_MESSAGE;
        case "ACCOUNT_DISABLED":
            return "To konto jest zablokowane. Skontaktuj się z administratorem.";
        case "PASSWORD_CHANGE_REQUIRED":
            return "Zmień hasło, aby kontynuować.";
        case "INVALID_CODE":
        case "INVALID_BACKUP_CODE":
            return "Nieprawidłowy kod weryfikacyjny.";
        case "INVALID_TWO_FACTOR_COOKIE":
            return "Wyzwanie wygasło. Zaloguj się ponownie.";
        case "TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE":
            return "Wykorzystano limit prób. Zaloguj się ponownie.";
        case "ACCOUNT_TEMPORARILY_LOCKED":
            return "Konto jest tymczasowo zablokowane. Spróbuj ponownie później.";
        default:
            return undefined;
    }
}

function reportLoginError(label: string, error: unknown): LoginActionState {
    const message = messageForAuthError(error);
    if (message) return { error: message };

    console.error(label, error);
    return { error: "Nie udało się zalogować. Spróbuj ponownie." };
}

export async function loginAction(
    _previousState: LoginActionState,
    formData: FormData
): Promise<LoginActionState> {
    let email = formData.get("email");
    const password = formData.get("password");
    if (typeof email !== "string" || typeof password !== "string" || !password) {
        return { error: "Uzupełnij wszystkie pola." };
    }

    email = email.trim().toLowerCase();
    let user: { isActive: boolean; mustChangePassword: boolean } | null;
    try {
        user = await prisma.user.findUnique({
            where: { email },
            select: { isActive: true, mustChangePassword: true },
        });
    } catch (error) {
        console.error("Nie udało się sprawdzić konta podczas logowania:", error);
        return { error: "Nie udało się zalogować. Spróbuj ponownie." };
    }
    if (user && !user.isActive) {
        return { error: "To konto jest zablokowane. Skontaktuj się z administratorem." };
    }

    let requiresTwoFactor = false;
    try {
        const result = await auth.api.signInEmail({
            body: { email, password },
            headers: await headers(),
        });
        requiresTwoFactor = "twoFactorRedirect" in result && result.twoFactorRedirect === true;
    } catch (error) {
        return reportLoginError("Nie udało się zalogować:", error);
    }

    if (requiresTwoFactor) return { step: "two-factor" };

    const next = localReturnPath(formData.get("next"));
    if (user?.mustChangePassword) {
        redirect(`/change-password?next=${encodeURIComponent(next)}`);
    }
    redirect(next);
}

export async function verifyTwoFactorAction(
    _previousState: LoginActionState,
    formData: FormData
): Promise<LoginActionState> {
    const code = formData.get("code");
    const method = formData.get("method");
    if (typeof code !== "string" || !code.trim()) {
        return { step: "two-factor", error: "Wprowadź kod weryfikacyjny." };
    }
    if (method !== "totp" && method !== "backup") {
        return { step: "two-factor", error: "Wybierz prawidłowy sposób weryfikacji." };
    }

    const trustDevice = formData.get("trustDevice") === "on";
    let mustChangePassword = false;
    try {
        const requestHeaders = await headers();
        const result = method === "totp"
            ? await auth.api.verifyTOTP({
                body: { code: code.trim(), trustDevice },
                headers: requestHeaders,
            })
            : await auth.api.verifyBackupCode({
                body: { code: code.trim(), trustDevice },
                headers: requestHeaders,
            });

        const user = await prisma.user.findUnique({
            where: { id: result.user.id },
            select: { isActive: true, mustChangePassword: true },
        });
        if (!user?.isActive) {
            return {
                step: "two-factor",
                error: "To konto jest zablokowane. Skontaktuj się z administratorem.",
            };
        }
        mustChangePassword = user.mustChangePassword;
    } catch (error) {
        return { ...reportLoginError("Nie udało się zweryfikować kodu:", error), step: "two-factor" };
    }

    const next = localReturnPath(formData.get("next"));
    if (mustChangePassword) {
        redirect(`/change-password?next=${encodeURIComponent(next)}`);
    }
    redirect(next);
}

export async function finishPasskeyLogin(nextPath: string): Promise<LoginActionState> {
    let mustChangePassword = false;
    try {
        const requestHeaders = await headers();
        const session = await auth.api.getSession({
            headers: requestHeaders,
            query: { disableCookieCache: true },
        });
        if (!session) {
            return { error: "Nie udało się potwierdzić logowania passkey. Spróbuj ponownie." };
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isActive: true, mustChangePassword: true },
        });
        if (!user?.isActive) {
            await auth.api.signOut({ headers: requestHeaders });
            return { error: "To konto jest zablokowane. Skontaktuj się z administratorem." };
        }
        mustChangePassword = user.mustChangePassword;
    } catch (error) {
        return reportLoginError("Nie udało się zakończyć logowania passkey:", error);
    }

    const next = localReturnPath(nextPath);
    if (mustChangePassword) {
        redirect(`/change-password?next=${encodeURIComponent(next)}`);
    }
    redirect(next);
}
