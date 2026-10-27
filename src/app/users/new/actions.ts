"use server";

import { createUser } from "@/server/users/create-user";
import {
    isRegistrationEnabled,
    REGISTRATION_DISABLED_MESSAGE,
} from "@/server/settings/registration";

export type CreateUserState = {
    error?: string;
    success?: string;
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
        return { error: "Uzupełnij wszystkie pola." };
    }

    if (password !== passwordConfirmation) {
        return { error: "Hasła muszą być takie same." };
    }

    try {
        if (!(await isRegistrationEnabled())) {
            return { error: REGISTRATION_DISABLED_MESSAGE };
        }
    } catch (error) {
        console.error("Nie udało się sprawdzić ustawienia rejestracji:", error);
        return { error: "Nie udało się sprawdzić dostępności rejestracji. Spróbuj ponownie później." };
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
            return { error: "Konto z tym adresem e-mail już istnieje." };
        }

        if (error instanceof Error) {
            return { error: error.message };
        }

        return { error: "Nie udało się utworzyć konta." };
    }

    return { success: "Konto zostało utworzone." };
}