"use server";

import { redirect } from "next/navigation";
import { updatePasswordAction } from "@/app/settings/actions";
import { localReturnPath } from "@/lib/local-return-path";

export type ChangePasswordActionState = {
  error?: "requiredFields" | "passwordMismatch" | "passwordTooShort" | "passwordSame" | "notAuthenticated" | "invalidPassword" | "alreadyChanged" | "generic";
};

export async function changePasswordAction(
  _previousState: ChangePasswordActionState,
  formData: FormData,
): Promise<ChangePasswordActionState> {
  const result = await updatePasswordAction({}, formData);
  if ("error" in result) {
    return { error: result.error === "passwordGeneric" ? "generic" : result.error };
  }
  redirect(localReturnPath(formData.get("next")));
}
