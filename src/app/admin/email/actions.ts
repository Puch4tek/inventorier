"use server";

import { revalidatePath } from "next/cache";
import { getActiveSession } from "@/server/auth/get-current-user";
import { sendTestEmail } from "@/server/email/send-mail";
import { consumeEmailRateLimit } from "@/server/settings/email-rate-limit";
import { EmailSettingsError, getAdminSmtpConfig, saveEmailSettings } from "@/server/settings/email";
import { createEmailActions, type EmailActionState } from "./action-core";
import { getLocale } from "next-intl/server";
import { adminMessages } from "@/i18n/messages/admin";
import type { Locale } from "@/i18n/locale";

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
  sendTest: (config, to, locale) => sendTestEmail(config, to, locale),
  revalidate: () => revalidatePath("/admin/email"),
  settingsError: (error, locale) => {
    if (!(error instanceof EmailSettingsError)) return undefined;
    const errorKey = {
      VALIDATION: "validation",
      CONFIGURATION: "configuration",
      ENCRYPTION: "encryption",
    } as const;
    return adminMessages[locale].emailActions.errors[errorKey[error.code]];
  },
});

export async function saveEmailSettingsAction(previous: EmailActionState, data: FormData) {
  const locale: Locale = await getLocale();
  return actions.save(previous, data, locale);
}

export async function sendTestEmailAction(previous: EmailActionState, data: FormData) {
  const locale: Locale = await getLocale();
  return actions.send(previous, data, locale);
}
