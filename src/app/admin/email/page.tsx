import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { getActiveSession, getCurrentUser } from "@/server/auth/get-current-user";
import { requireRole } from "@/server/auth/permissions";
import { EmailSettingsError, getEmailSettings, type EmailSettings } from "@/server/settings/email";
import { AdminTabs } from "../admin-tabs";
import { EmailSettingsForm, TestEmailForm } from "./settings-forms";
import { getLocale, getTranslations } from "next-intl/server";

export const instant = false;

export default async function AdminEmailPage() {
  const [t, locale] = await Promise.all([
    getTranslations("admin"),
    getLocale(),
  ]);
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  try {
    await requireRole("ADMIN");
  } catch {
    redirect("/dashboard");
  }
  const active = await getActiveSession();
  if (!active || active.user.id !== user.id) redirect("/login");
  let settings: EmailSettings | undefined;
  let settingsError: string | undefined;
  try {
    settings = await getEmailSettings(user.id, active.session.id);
  } catch (error) {
    settingsError =
      error instanceof EmailSettingsError
        ? t(
            error.code === "VALIDATION"
              ? "emailActions.errors.validation"
              : error.code === "CONFIGURATION"
                ? "emailActions.errors.configuration"
                : "emailActions.errors.encryption",
          )
        : t("emailActions.errors.readFailed");
  }

  return (
    <main className="app-shell">
      <AppHeader sectionLabel={t("usersPage.section")} />
      <section className="page-shell">
        <p className="page-kicker">{t("usersPage.title")}</p>
        <h1 className="page-title">{t("emailSettings.title")}</h1>
        <p className="page-description max-w-2xl">{t("emailSettings.description")}</p>
        <AdminTabs active="email" />
        {process.env.NODE_ENV === "production" && process.env.TRUSTED_PROXY_IP_HEADER !== "x-real-ip" ? (
          <p role="alert" className="status-error mt-5">
            {t("emailSettings.proxyWarning")}
          </p>
        ) : null}
        <section className="panel-card mt-8 p-5 sm:p-6">
          <h2 className="text-xl font-semibold">{t("emailSettings.smtpTitle")}</h2>
          {settings ? <EmailSettingsForm key={locale} settings={settings} /> : (
            <p role="alert" className="status-error mt-5">{settingsError}</p>
          )}
        </section>
        <section className="panel-card mt-8 p-5 sm:p-6">
          <h2 className="text-xl font-semibold">{t("emailSettings.testTitle")}</h2>
          <p className="mt-2 text-sm text-app-muted">
            {t("emailSettings.testDescription")}
          </p>
          <TestEmailForm key={locale} />
        </section>
        <p className="mt-6 text-sm text-app-muted">
          {t("emailSettings.proxyDescription")}
        </p>
      </section>
    </main>
  );
}
