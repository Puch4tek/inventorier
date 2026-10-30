"use server";

import { redirect } from "next/navigation";
import { changeCurrentUserPassword } from "@/server/users/change-password";
import { UserOperationError } from "@/server/users/public-errors";
import { localReturnPath } from "@/lib/local-return-path";

export type ChangePasswordActionState = {
  error?: "requiredFields" | "passwordMismatch" | "passwordTooShort" | "passwordSame" | "notAuthenticated" | "invalidPassword" | "alreadyChanged" | "generic";
};

export async function changePasswordAction(
  _previousState: ChangePasswordActionState,
  formData: FormData,
): Promise<ChangePasswordActionState> {
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
  } catch (error) {
    if (error instanceof UserOperationError) {
      const errorKeys = {
        "password-too-short": "passwordTooShort",
        "password-same": "passwordSame",
        "not-authenticated": "notAuthenticated",
        "invalid-current-password": "invalidPassword",
        "password-already-changed": "alreadyChanged",
        "profile-name-too-short": "generic",
        "profile-name-too-long": "generic",
      } as const;
      return { error: errorKeys[error.code] };
    }
    console.error("Could not change the current user's password:", error);
    return { error: "generic" };
  }
  redirect(localReturnPath(formData.get("next")));
}
