"use server";

import { headers } from "next/headers";
import {
  PasswordResetError,
  resetPassword,
} from "@/server/auth/password-reset";

export type ResetPasswordActionState = {
  success?: boolean;
  error?: "invalidLink" | "passwordMismatch";
};

export async function resetPasswordAction(
  _previousState: ResetPasswordActionState,
  formData: FormData,
): Promise<ResetPasswordActionState> {
  const token = formData.get("token");
  const password = formData.get("password");
  const confirmation = formData.get("confirmation");

  if (
    typeof token !== "string" ||
    typeof password !== "string" ||
    typeof confirmation !== "string"
  ) {
    return { error: "invalidLink" };
  }
  if (password !== confirmation) {
    return { error: "passwordMismatch" };
  }

  try {
    await resetPassword(token, password, { headers: await headers() });
    return { success: true };
  } catch (error) {
    if (!(error instanceof PasswordResetError)) {
      console.error("Password reset could not be completed.");
    }
    return { error: "invalidLink" };
  }
}
