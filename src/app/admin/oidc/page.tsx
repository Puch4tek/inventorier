import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { AppHeader } from "@/components/app-header";
import { getActiveSession } from "@/server/auth/get-current-user";
import {
  getOidcSettings,
  OidcSettingsError,
  type OidcSettings,
} from "@/server/settings/oidc";
import { AdminTabs } from "../admin-tabs";
import { OidcSettingsForm } from "./settings-form";

export const instant = false;

export default async function AdminOidcPage() {
  const [t, locale] = await Promise.all([
    getTranslations("admin"),
    getLocale(),
  ]);
  const active = await getActiveSession();
  if (!active) redirect("/login");
  if (active.user.mustChangePassword) redirect("/change-password");
  if (active.user.role !== "ADMIN") redirect("/dashboard");

  let settings: OidcSettings | undefined;
  let settingsError: string | undefined;
  try {
    settings = await getOidcSettings(active.user.id, active.session.id);
  } catch (error) {
    if (!(error instanceof OidcSettingsError)) {
      settingsError = t("oidcActions.errors.readFailed");
    } else if (error.code === "VALIDATION") {
      settingsError = t("oidcActions.errors.validation");
    } else if (error.code === "CONFIGURATION") {
      settingsError = t("oidcActions.errors.configuration");
    } else {
      settingsError = t("oidcActions.errors.encryption");
    }
  }

  return (
    <main className="app-shell">
      <AppHeader sectionLabel={t("usersPage.section")} />
      <section className="page-shell">
        <p className="page-kicker">{t("usersPage.section")}</p>
        <h1 className="page-title">{t("oidcSettings.title")}</h1>
        <p className="page-description max-w-2xl">
          {t("oidcSettings.description")}
        </p>
        <AdminTabs active="oidc" />
        <section className="panel-card mt-8 p-5 sm:p-6">
          <h2 className="text-xl font-semibold">{t("oidcSettings.configTitle")}</h2>
          {settings ? (
            <OidcSettingsForm key={locale} settings={settings} />
          ) : (
            <p role="alert" className="status-error mt-5">
              {settingsError}
            </p>
          )}
        </section>
      </section>
    </main>
  );
}
