"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { requestPasswordReset } from "@/server/auth/password-reset";
import { createForgotPasswordAction, type ForgotPasswordActionState } from "./action-core";

export type { ForgotPasswordActionState } from "./action-core";

const action = createForgotPasswordAction({
  getHeaders: headers,
  schedule: after,
  requestReset: requestPasswordReset,
});

export async function forgotPasswordAction(
  _previousState: ForgotPasswordActionState,
  formData: FormData,
): Promise<ForgotPasswordActionState> {
  return action(_previousState, formData);
}
