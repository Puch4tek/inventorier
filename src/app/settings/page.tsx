import { AppHeader } from "@/components/app-header";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { PasswordForm, ProfileForm } from "./settings-forms";
import { AccountTabs } from "./account-tabs";
import { getSecuritySettings } from "@/server/security/get-security-settings";
import { SecuritySettings } from "./security-settings";

export const instant = false;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }
  const params = await searchParams;
  const rawTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const tab =
    rawTab === "password" || rawTab === "email" || rawTab === "security"
      ? rawTab
      : "profile";
  const securitySettings =
    tab === "security" ? await getSecuritySettings(user.id) : null;

  return (
    <main className="app-shell pb-24 sm:pb-0">
      <AppHeader sectionLabel="Ustawienia konta" />
      <section className="page-shell page-shell-narrow">
        <p className="page-kicker">Konto</p>
        <h1 className="page-title">Ustawienia konta</h1>
        <p className="page-description">
          Zarządzaj swoimi danymi i bezpieczeństwem konta.
        </p>
        <AccountTabs active={tab} />

        <div className="mt-5">
          {tab === "profile" ? (
          <section className="panel-card p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold tracking-[-0.03em]">
                Dane profilu
              </h2>
              <p className="mt-2 text-sm text-app-muted">
                Zmień sposób, w jaki Twoje konto jest wyświetlane w aplikacji.
              </p>
            </div>
            <ProfileForm name={user.name} />
          </section>
          ) : null}
          {tab === "password" ? (
          <section className="panel-card p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold tracking-[-0.03em]">
                Hasło
              </h2>
              <p className="mt-2 text-sm text-app-muted">
                Użyj obecnego hasła, aby ustawić nowe.
              </p>
            </div>
            <PasswordForm />
          </section>
          ) : null}
          {tab === "email" ? (
          <section className="panel-card p-6 sm:p-8">
            <div className="mb-2">
              <h2 className="text-xl font-semibold tracking-[-0.03em]">
                Adres e-mail
              </h2>
              <p className="mt-2 text-sm text-app-muted">
                Zmiana adresu e-mail będzie dostępna po wdrożeniu weryfikacji
                przez wiadomość e-mail.
              </p>
            </div>
            <p className="mt-5 rounded-xl bg-app-surface-muted px-4 py-3 text-sm text-app-muted">
              {user.email}
            </p>
          </section>
          ) : null}
          {tab === "security" && securitySettings ? (
            <SecuritySettings initialSettings={securitySettings} />
          ) : null}
        </div>
      </section>
    </main>
  );
}
