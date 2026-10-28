"use server";

import { revalidatePath } from "next/cache";
import { getActiveSession } from "@/server/auth/get-current-user";
import { sendTestEmail } from "@/server/email/send-mail";
import { consumeEmailRateLimit } from "@/server/settings/email-rate-limit";
import { EmailSettingsError, getAdminSmtpConfig, saveEmailSettings } from "@/server/settings/email";
import { createEmailActions, type EmailActionState } from "./action-core";

const actions = createEmailActions({
  requireAdmin: async () => {
    const active = await getActiveSession();
    if (!active || active.user.role !== "ADMIN" || active.user.mustChangePassword) {
      throw new Error("Nie masz uprawnień do wykonania tej operacji.");
    }
    return { id: active.user.id, sessionId: active.session.id };
  },
  save: saveEmailSettings,
  consumeTestLimit: (actorId) => consumeEmailRateLimit(actorId, 5, 60 * 60 * 1000),
  getConfig: getAdminSmtpConfig,
  sendTest: sendTestEmail,
  revalidate: () => revalidatePath("/admin/email"),
  settingsError: (error) => error instanceof EmailSettingsError ? error.message : undefined,
});

export async function saveEmailSettingsAction(previous: EmailActionState, data: FormData) {
  return actions.save(previous, data);
}

export async function sendTestEmailAction(previous: EmailActionState, data: FormData) {
  return actions.send(previous, data);
}
