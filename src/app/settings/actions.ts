"use server";

import { changeCurrentUserPassword } from "@/server/users/change-password";
import { updateCurrentUserProfile } from "@/server/users/update-profile";
import { UserOperationError } from "@/server/users/public-errors";

export type SettingsActionState = {
  error?: "nameRequired" | "nameTooShort" | "nameTooLong" | "profileGeneric" | "requiredFields" | "passwordMismatch" | "passwordTooShort" | "passwordSame" | "notAuthenticated" | "invalidPassword" | "alreadyChanged" | "passwordGeneric";
  success?: "profileSaved" | "passwordChanged";
};

export async function updateProfileAction(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const name = formData.get("name");

  if (typeof name !== "string") {
    return { error: "nameRequired" };
  }

  try {
    await updateCurrentUserProfile(name);
    return { success: "profileSaved" };
  } catch (error) {
    if (error instanceof UserOperationError) {
      return {
        error: error.code === "profile-name-too-short"
          ? "nameTooShort"
          : error.code === "profile-name-too-long"
            ? "nameTooLong"
            : "profileGeneric",
      };
    }
    console.error("Could not save the current user's profile:", error);
    return { error: "profileGeneric" };
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
    return { error: "requiredFields" };
  }
  if (newPassword !== confirmation) {
    return { error: "passwordMismatch" };
  }

  try {
    await changeCurrentUserPassword(currentPassword, newPassword);
    return { success: "passwordChanged" };
  } catch (error) {
    if (error instanceof UserOperationError) {
      const errorKeys = {
        "password-too-short": "passwordTooShort",
        "password-same": "passwordSame",
        "not-authenticated": "notAuthenticated",
        "invalid-current-password": "invalidPassword",
        "password-already-changed": "alreadyChanged",
        "profile-name-too-short": "passwordGeneric",
        "profile-name-too-long": "passwordGeneric",
      } as const;
      return { error: errorKeys[error.code] };
    }
    console.error("Could not update the current user's password:", error);
    return { error: "passwordGeneric" };
  }
}
