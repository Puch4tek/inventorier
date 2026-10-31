import { AppHeader } from "@/components/app-header";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { PasswordForm, ProfileForm } from "./settings-forms";
import { AccountTabs } from "./account-tabs";
import { getSecuritySettings } from "@/server/security/get-security-settings";
import { SecuritySettings } from "./security-settings";
import { EmailChangeForm } from "./email-change-form";
import { prisma } from "@/lib/db/prisma";

export const instant = false;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  const t = await getTranslations("auth.settings");

  if (!user) {
    redirect("/login");
  }
  const credentialAccount = await prisma.account.findFirst({
    where: {
      userId: user.id,
      providerId: "credential",
      password: { not: null },
    },
    select: { id: true },
  });
  const hasLocalPassword = Boolean(credentialAccount);

  const params = await searchParams;
  const rawTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const tab =
    (rawTab === "password" && hasLocalPassword) ||
    rawTab === "email" ||
    rawTab === "security"
      ? rawTab
      : "profile";
  const securitySettings =
    tab === "security" ? await getSecuritySettings(user.id) : null;
  const emailChangeCompleted =
    params.emailChange === "success" && !params.error;

  return (
    <main className="app-shell pb-24 sm:pb-0">
      <AppHeader sectionLabel={t("title")} />
      <section className="page-shell page-shell-narrow">
        <p className="page-kicker">{t("title")}</p>
        <h1 className="page-title">{t("title")}</h1>
        <p className="page-description">
          {t("description")}
        </p>
        {!hasLocalPassword ? (
          <p
            role="status"
            className="mt-5 rounded-xl border border-app-border bg-app-surface-muted p-4 text-sm text-app-muted"
          >
            {t("passwordUnavailable")}
          </p>
        ) : null}
        <AccountTabs active={tab} hasLocalPassword={hasLocalPassword} />

        <div className="mt-5">
          {tab === "profile" ? (
          <section className="panel-card p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold tracking-[-0.03em]">
                {t("profile.heading")}
              </h2>
              <p className="mt-2 text-sm text-app-muted">
                {t("profile.description")}
              </p>
            </div>
            <ProfileForm name={user.name} />
          </section>
          ) : null}
          {tab === "password" && hasLocalPassword ? (
          <section className="panel-card p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold tracking-[-0.03em]">
                {t("password.heading")}
              </h2>
              <p className="mt-2 text-sm text-app-muted">
                {t("password.description")}
              </p>
            </div>
            <PasswordForm />
          </section>
          ) : null}
          {tab === "email" ? (
          <section className="panel-card p-6 sm:p-8">
            <div className="mb-2">
              <h2 className="text-xl font-semibold tracking-[-0.03em]">
                {t("email.heading")}
              </h2>
              <p className="mt-2 text-sm text-app-muted">
                {t("email.description")}
              </p>
            </div>
            <div className="mt-5">
              {emailChangeCompleted ? (
                <p role="status" className="status-success mb-5">
                  {t("email.changeCompleted")}
                </p>
              ) : null}
              {params.error ? (
                <p role="alert" className="status-error mb-5">
                  {t("email.confirmationFailed")}
                </p>
              ) : null}
              <EmailChangeForm currentEmail={user.email} />
            </div>
          </section>
          ) : null}
          {tab === "security" && securitySettings ? (
            <SecuritySettings
              initialSettings={securitySettings}
              canManageWithPassword={hasLocalPassword}
            />
          ) : null}
        </div>
      </section>
    </main>
  );
}
