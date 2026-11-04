"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireCurrentSession } from "@/server/auth/get-current-user";
import { unlinkOidcAccounts } from "@/server/security/oidc-accounts";

export type OidcLinkActionState = { error?: string; success?: string };

export async function unlinkOidcAction(): Promise<OidcLinkActionState> {
  const t = await getTranslations("auth.security.oidc");
  try {
    const active = await requireCurrentSession();
    await unlinkOidcAccounts(active.user.id, active.user.id, active.session.id, false);
    revalidatePath("/settings");
    return { success: t("unlinked") };
  } catch (error) {
    console.error("Could not unlink OIDC account:", error);
    return { error: t("unlinkError") };
  }
}
