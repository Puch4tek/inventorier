"use server";

import type { Role } from "@/generated/prisma/client";
import { requireRole } from "@/server/auth/permissions";
import { updateUserRole } from "@/server/users/update-user-role";
import { createUser } from "@/server/users/create-user";
import { deleteUser } from "@/server/users/delete-user";
import { resetUserPassword } from "@/server/users/reset-user-password";
import { revalidatePath } from "next/cache";

export type AdminActionState = { error?: string; success?: string };

export async function createAdminUserAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    await requireRole("ADMIN");
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const role = formData.get("role");

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !["USER", "MANAGER", "ADMIN"].includes(String(role))
    ) {
      return { error: "Uzupełnij poprawnie wszystkie dane." };
    }

    await createUser({ name, email, password, role: role as Role });
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
    const userId = Number(formData.get("userId"));
    const role = formData.get("role");

    if (!Number.isInteger(userId) || !["USER", "MANAGER", "ADMIN"].includes(String(role))) {
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
    await requireRole("ADMIN");
    const userId = Number(formData.get("userId"));
    const password = formData.get("password");
    if (!Number.isInteger(userId) || typeof password !== "string") {
      return { error: "Nieprawidłowe dane resetowania hasła." };
    }

    await resetUserPassword(userId, password);
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
    const userId = Number(formData.get("userId"));
    if (!Number.isInteger(userId)) {
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
