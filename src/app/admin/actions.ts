"use server";

import type { Role } from "@/generated/prisma/client";
import { requireRole } from "@/server/auth/permissions";
import { updateUserRole } from "@/server/users/update-user-role";
import { createUser } from "@/server/users/create-user";
import { deleteUser } from "@/server/users/delete-user";
import { resetUserPassword } from "@/server/users/reset-user-password";
import { setUserStatus } from "@/server/users/set-user-status";
import { setPasswordChangeRequired } from "@/server/users/set-password-change-required";
import { setRegistrationEnabled } from "@/server/settings/registration";
import { resetUserTwoFactor } from "@/server/users/reset-user-two-factor";
import { revalidatePath } from "next/cache";

export type AdminActionState = { error?: string; success?: string };

export async function resetUserTwoFactorAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const currentUser = await requireRole("ADMIN");
    const userId = formData.get("userId");
    if (typeof userId !== "string" || !userId) return { error: "Nieprawidłowy użytkownik." };
    await resetUserTwoFactor(userId, currentUser.id);
    revalidatePath("/admin");
    return { success: "Metody uwierzytelniania dwuskładnikowego usunięto, a istniejące sesje unieważniono." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Nie udało się zresetować uwierzytelniania." };
  }
}

export async function setRegistrationEnabledAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  let currentUser: Awaited<ReturnType<typeof requireRole>>;
  try {
    currentUser = await requireRole("ADMIN");
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Nie masz uprawnień do wykonania tej operacji.",
    };
  }

  const enabled = formData.get("enabled");
  if (enabled !== "true" && enabled !== "false") {
    return { error: "Nieprawidłowe ustawienie rejestracji." };
  }

  try {
    await setRegistrationEnabled(enabled === "true", currentUser.id);
    revalidatePath("/admin");
    revalidatePath("/users/new");
    revalidatePath("/login");
    revalidatePath("/");
    return {
      success: enabled === "true"
        ? "Samodzielna rejestracja została włączona."
        : "Samodzielna rejestracja została wyłączona.",
    };
  } catch (error) {
    console.error("Nie udało się zmienić ustawienia rejestracji:", error);
    return { error: "Nie udało się zmienić ustawienia rejestracji." };
  }
}

export async function setUserStatusAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const currentUser = await requireRole("ADMIN");
    const userId = formData.get("userId");
    const active = formData.get("active");
    if (typeof userId !== "string" || !userId || (active !== "true" && active !== "false")) {
      return { error: "Nieprawidłowe dane użytkownika." };
    }
    await setUserStatus(userId, active === "true", currentUser.id);
    revalidatePath("/admin");
    return { success: active === "true" ? "Konto zostało odblokowane." : "Konto zostało zablokowane." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Nie udało się zmienić statusu konta." };
  }
}

export async function requirePasswordChangeAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const currentUser = await requireRole("ADMIN");
    const userId = formData.get("userId");
    if (typeof userId !== "string" || !userId) {
      return { error: "Nieprawidłowy użytkownik." };
    }
    await setPasswordChangeRequired(userId, currentUser.id);
    revalidatePath("/admin");
    return { success: "Wymuszono zmianę hasła przy następnym logowaniu." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Nie udało się wymusić zmiany hasła." };
  }
}

export async function createAdminUserAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const currentUser = await requireRole("ADMIN");
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const role = formData.get("role");

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !["USER", "ADMIN"].includes(String(role))
    ) {
      return { error: "Uzupełnij poprawnie wszystkie dane." };
    }

    await createUser({
      name,
      email,
      password,
      role: role as Role,
      actorId: currentUser.id,
      mustChangePassword: true,
    });
    revalidatePath("/admin");
    return { success: "Użytkownik został utworzony." };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { error: "Konto z tym adresem e-mail już istnieje." };
    }
    return {
      error: error instanceof Error
        ? error.message
        : "Nie udało się utworzyć użytkownika.",
    };
  }
}

export async function updateUserRoleAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const currentUser = await requireRole("ADMIN");
    const userId = formData.get("userId");
    const role = formData.get("role");

    if (typeof userId !== "string" || !userId || !["USER", "ADMIN"].includes(String(role))) {
      return { error: "Nieprawidłowe dane użytkownika." };
    }

    await updateUserRole(userId, role as Role, currentUser.id);
    revalidatePath("/admin");
    return { success: "Rola użytkownika została zaktualizowana." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Nie udało się zmienić roli.",
    };
  }
}

export async function resetUserPasswordAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const currentUser = await requireRole("ADMIN");
    const userId = formData.get("userId");
    const password = formData.get("password");
    if (typeof userId !== "string" || !userId || typeof password !== "string") {
      return { error: "Nieprawidłowe dane resetowania hasła." };
    }

    await resetUserPassword(userId, password, currentUser.id);
    return { success: "Hasło zostało zresetowane." };
  } catch (error) {
    return {
      error: error instanceof Error
        ? error.message
        : "Nie udało się zresetować hasła.",
    };
  }
}

export async function deleteUserAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const currentUser = await requireRole("ADMIN");
    const userId = formData.get("userId");
    if (typeof userId !== "string" || !userId) {
      return { error: "Nieprawidłowy użytkownik." };
    }

    await deleteUser(userId, currentUser.id);
    revalidatePath("/admin");
    return { success: "Użytkownik został usunięty." };
  } catch (error) {
    return {
      error: error instanceof Error
        ? error.message
        : "Nie udało się usunąć użytkownika.",
    };
  }
}
