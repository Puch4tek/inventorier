"use server";

import { redirect } from "next/navigation";
import { changeCurrentUserPassword } from "@/server/users/change-password";
import { localReturnPath } from "@/lib/local-return-path";

export type ChangePasswordActionState = { error?: string };

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
    return { error: "Uzupełnij wszystkie pola." };
  }
  if (newPassword !== confirmation) {
    return { error: "Nowe hasła nie są takie same." };
  }

  try {
    await changeCurrentUserPassword(currentPassword, newPassword);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Nie udało się zmienić hasła.",
    };
  }
  redirect(localReturnPath(formData.get("next")));
}
