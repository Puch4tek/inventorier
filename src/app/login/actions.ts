"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAPIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { localReturnPath } from "@/lib/local-return-path";

export type LoginActionState = {
    error?:
        | "invalidCredentials"
        | "twoFactorReset"
        | "passkeyReset"
        | "accountDisabled"
        | "passwordChangeRequired"
        | "invalidVerificationCode"
        | "challengeExpired"
        | "tooManyAttempts"
        | "accountLocked"
        | "requiredFields"
        | "codeRequired"
        | "methodInvalid"
        | "passkeyConfirmationFailure"
        | "passkeyNotFound"
        | "passkeyCancelled"
        | "passkeyUnsupported"
        | "passkeyFailure"
        | "generic";
    step?: "two-factor";
}

type LoginErrorKey = NonNullable<LoginActionState["error"]>;

function messageForAuthError(
    error: unknown,
    messages: Record<string, LoginErrorKey>,
): LoginErrorKey | undefined {
    if (!isAPIError(error)) return undefined;

    switch (error.body?.code) {
        case "INVALID_EMAIL_OR_PASSWORD":
            return messages.invalidCredentials;
        case "TWO_FACTOR_RESET_REQUIRED":
        case "TWO_FACTOR_RESET":
            return messages.twoFactorReset;
        case "PASSKEY_RESET":
            return messages.passkeyReset;
        case "ACCOUNT_DISABLED":
            return messages.accountDisabled;
        case "PASSWORD_CHANGE_REQUIRED":
            return messages.passwordChangeRequired;
        case "INVALID_CODE":
        case "INVALID_BACKUP_CODE":
            return messages.invalidVerificationCode;
        case "INVALID_TWO_FACTOR_COOKIE":
            return messages.challengeExpired;
        case "TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE":
            return messages.tooManyAttempts;
        case "ACCOUNT_TEMPORARILY_LOCKED":
            return messages.accountLocked;
        default:
            return undefined;
    }
}

function reportLoginError(
    label: string,
    error: unknown,
    messages: Record<string, LoginErrorKey>,
): LoginActionState {
    const message = messageForAuthError(error, messages);
    if (message) return { error: message };

    console.error(label, error);
    return { error: messages.generic };
}

export async function loginAction(
    _previousState: LoginActionState,
    formData: FormData
): Promise<LoginActionState> {
    const messages = {
        invalidCredentials: "invalidCredentials",
        twoFactorReset: "twoFactorReset",
        passkeyReset: "passkeyReset",
        accountDisabled: "accountDisabled",
        passwordChangeRequired: "passwordChangeRequired",
        invalidVerificationCode: "invalidVerificationCode",
        challengeExpired: "challengeExpired",
        tooManyAttempts: "tooManyAttempts",
        accountLocked: "accountLocked",
        requiredFields: "requiredFields",
        generic: "generic",
    } as const;
    let email = formData.get("email");
    const password = formData.get("password");
    if (typeof email !== "string" || typeof password !== "string" || !password) {
        return { error: messages.requiredFields };
    }

    email = email.trim().toLowerCase();
    let user: { isActive: boolean; mustChangePassword: boolean } | null;
    try {
        user = await prisma.user.findUnique({
            where: { email },
            select: { isActive: true, mustChangePassword: true },
        });
    } catch (error) {
        console.error("Could not check the account during sign-in:", error);
        return { error: messages.generic };
    }
    if (user && !user.isActive) {
        return { error: messages.accountDisabled };
    }

    let requiresTwoFactor = false;
    try {
        const result = await auth.api.signInEmail({
            body: { email, password },
            headers: await headers(),
        });
        requiresTwoFactor = "twoFactorRedirect" in result && result.twoFactorRedirect === true;
    } catch (error) {
        return reportLoginError("Sign-in failed:", error, messages);
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
    const messages = {
        invalidVerificationCode: "invalidVerificationCode",
        codeRequired: "codeRequired",
        methodInvalid: "methodInvalid",
        accountDisabled: "accountDisabled",
        generic: "generic",
        invalidCredentials: "invalidCredentials",
        twoFactorReset: "twoFactorReset",
        passkeyReset: "passkeyReset",
        passwordChangeRequired: "passwordChangeRequired",
        challengeExpired: "challengeExpired",
        tooManyAttempts: "tooManyAttempts",
        accountLocked: "accountLocked",
    } as const;
    const code = formData.get("code");
    const method = formData.get("method");
    if (typeof code !== "string" || !code.trim()) {
        return { step: "two-factor", error: messages.codeRequired };
    }
    if (method !== "totp" && method !== "backup") {
        return { step: "two-factor", error: messages.methodInvalid };
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
                error: messages.accountDisabled,
            };
        }
        mustChangePassword = user.mustChangePassword;
    } catch (error) {
        return { ...reportLoginError("Two-factor verification failed:", error, messages), step: "two-factor" };
    }

    const next = localReturnPath(formData.get("next"));
    if (mustChangePassword) {
        redirect(`/change-password?next=${encodeURIComponent(next)}`);
    }
    redirect(next);
}

export async function finishPasskeyLogin(nextPath: string): Promise<LoginActionState> {
    const messages = {
        invalidCredentials: "invalidCredentials",
        twoFactorReset: "twoFactorReset",
        passkeyReset: "passkeyReset",
        accountDisabled: "accountDisabled",
        passwordChangeRequired: "passwordChangeRequired",
        invalidVerificationCode: "invalidVerificationCode",
        challengeExpired: "challengeExpired",
        tooManyAttempts: "tooManyAttempts",
        accountLocked: "accountLocked",
        generic: "generic",
        passkeyConfirmationFailure: "passkeyConfirmationFailure",
    } as const;
    let mustChangePassword = false;
    try {
        const requestHeaders = await headers();
        const session = await auth.api.getSession({
            headers: requestHeaders,
            query: { disableCookieCache: true },
        });
        if (!session) {
            return { error: messages.passkeyConfirmationFailure };
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isActive: true, mustChangePassword: true },
        });
        if (!user?.isActive) {
            await auth.api.signOut({ headers: requestHeaders });
            return { error: messages.accountDisabled };
        }
        mustChangePassword = user.mustChangePassword;
    } catch (error) {
        return reportLoginError("Passkey sign-in could not be completed:", error, messages);
    }

    const next = localReturnPath(nextPath);
    if (mustChangePassword) {
        redirect(`/change-password?next=${encodeURIComponent(next)}`);
    }
    redirect(next);
}
