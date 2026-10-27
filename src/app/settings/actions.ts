"use server";

import { changeCurrentUserPassword } from "@/server/users/change-password";
import { updateCurrentUserProfile } from "@/server/users/update-profile";

export type SettingsActionState = {
  error?: string;
  success?: string;
};

export async function updateProfileAction(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const name = formData.get("name");

  if (typeof name !== "string") {
    return { error: "Podaj imię i nazwisko." };
  }

  try {
    await updateCurrentUserProfile(name);
    return { success: "Dane profilu zostały zapisane." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Nie udało się zapisać profilu.",
    };
  }
}

export async function updatePasswordAction(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");
  const confirmation = formData.get("confirmation");

  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    typeof confirmation !== "string"
  ) {
    return { error: "Uzupełnij wszystkie pola." };
  }
  if (newPassword !== confirmation) {
    return { error: "Nowe hasła nie są takie same." };
  }

  try {
    await changeCurrentUserPassword(currentPassword, newPassword);
    return { success: "Hasło zostało zmienione." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Nie udało się zmienić hasła.",
    };
  }
}
