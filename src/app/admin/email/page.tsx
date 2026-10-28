import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { getActiveSession, getCurrentUser } from "@/server/auth/get-current-user";
import { requireRole } from "@/server/auth/permissions";
import { EmailSettingsError, getEmailSettings, type EmailSettings } from "@/server/settings/email";
import { AdminTabs } from "../admin-tabs";
import { EmailSettingsForm, TestEmailForm } from "./settings-forms";

export const instant = false;

export default async function AdminEmailPage() {
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
    settingsError = error instanceof EmailSettingsError
      ? error.message
      : "Nie udało się odczytać ustawień e-mail.";
  }

  return (
    <main className="app-shell">
      <AppHeader sectionLabel="Administracja" />
      <section className="page-shell">
        <p className="page-kicker">Panel administratora</p>
        <h1 className="page-title">Ustawienia e-mail</h1>
        <p className="page-description max-w-2xl">Skonfiguruj serwer poczty i resetowanie hasła przez e-mail.</p>
        <AdminTabs active="email" />
        {process.env.NODE_ENV === "production" && process.env.TRUSTED_PROXY_IP_HEADER !== "x-real-ip" ? (
          <p role="alert" className="status-error mt-5">
            Reset hasła nie działa: skonfiguruj zaufane reverse proxy i ustaw TRUSTED_PROXY_IP_HEADER=x-real-ip.
          </p>
        ) : null}
        <section className="panel-card mt-8 p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Konfiguracja SMTP</h2>
          {settings ? <EmailSettingsForm settings={settings} /> : (
            <p role="alert" className="status-error mt-5">{settingsError}</p>
          )}
        </section>
        <section className="panel-card mt-8 p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Wiadomość testowa</h2>
          <p className="mt-2 text-sm text-app-muted">
            Test używa zapisanych ustawień SMTP. Przed wysłaniem testu zapisz zmiany.
            Administrator może wysłać maksymalnie 5 wiadomości testowych na godzinę.
          </p>
          <TestEmailForm />
        </section>
        <p className="mt-6 text-sm text-app-muted">
          W środowisku produkcyjnym reset haseł wymaga zaufanego reverse proxy,
          które nadpisuje nagłówek <code>x-real-ip</code>, oraz ustawienia
          <code> TRUSTED_PROXY_IP_HEADER=x-real-ip</code>.
        </p>
      </section>
    </main>
  );
}
