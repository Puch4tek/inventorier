"use server";

import { createUser } from "@/server/users/create-user";
import {
    isRegistrationEnabled,
} from "@/server/settings/registration";

export type CreateUserState = {
    error?: "requiredFields" | "passwordMismatch" | "unavailable" | "unavailableCheck" | "duplicateEmail" | "createFailed" | "passwordTooShort";
    success?: "created";
};

export async function createUserAction(
    _previousState: CreateUserState,
    formData: FormData,
): Promise<CreateUserState> {
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const passwordConfirmation = formData.get("passwordConfirmation");

    if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string" ||
        typeof passwordConfirmation !== "string"
    ) {
        return { error: "requiredFields" };
    }

    if (password !== passwordConfirmation) {
        return { error: "passwordMismatch" };
    }

    try {
        if (!(await isRegistrationEnabled())) {
            return { error: "unavailable" };
        }
    } catch (error) {
        console.error("Could not check the registration setting:", error);
        return { error: "unavailableCheck" };
    }

    try {
        await createUser({
            name,
            email,
            password,
        });
    } catch (error) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "P2002"
        ) {
            return { error: "duplicateEmail" };
        }

        if (error instanceof Error && error.message === "Password must be at least 8 characters long") {
            return { error: "passwordTooShort" };
        }

        console.error("Could not create an account:", error);
        return { error: "createFailed" };
    }

    return { success: "created" };
}