"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { getActiveSession } from "@/server/auth/get-current-user";
import { messages } from "@/i18n/messages";
import type { Locale } from "@/i18n/locale";
import { OidcSettingsError, saveOidcSettings } from "@/server/settings/oidc";

export type OidcActionState = { error?: string; success?: string };

function text(data: FormData, key: string): string | null {
  const value = data.get(key);
  return typeof value === "string" ? value : null;
}

export async function saveOidcSettingsAction(
  _previous: OidcActionState,
  data: FormData,
): Promise<OidcActionState> {
  const locale = (await getLocale()) as Locale;
  const t = messages[locale].admin.oidcActions;
  const active = await getActiveSession();
  if (
    !active ||
    active.user.role !== "ADMIN" ||
    active.user.mustChangePassword
  ) {
    return { error: t.errors.unauthorized };
  }

  const enabled = data.get("enabled");
  const issuer = text(data, "issuer");
  const clientId = text(data, "clientId");
  const clientSecret = text(data, "clientSecret");
  if (
    (enabled !== null && enabled !== "on") ||
    issuer === null ||
    clientId === null ||
    clientSecret === null
  ) {
    return { error: t.errors.invalidForm };
  }

  try {
    await saveOidcSettings(
      {
        enabled: enabled === "on",
        issuer,
        clientId,
        clientSecret: clientSecret || undefined,
      },
      active.user.id,
      active.session.id,
    );
    revalidatePath("/admin/oidc");
    return { success: t.saved };
  } catch (error) {
    if (error instanceof OidcSettingsError) {
      const errorKey = {
        VALIDATION: "validation",
        CONFIGURATION: "configuration",
        ENCRYPTION: "encryption",
      } as const;
      return { error: t.errors[errorKey[error.code]] };
    }
    return { error: t.errors.saveFailed };
  }
}
