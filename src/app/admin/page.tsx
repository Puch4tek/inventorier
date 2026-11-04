import { AppHeader } from "@/components/app-header";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { requireRole } from "@/server/auth/permissions";
import { listUsers } from "@/server/users/list-users";
import { UserRoleForm } from "./user-role-form";
import { CreateUserForm } from "./create-user-form";
import { UserActions } from "./user-actions";
import { isRegistrationEnabled } from "@/server/settings/registration";
import { RegistrationSettingsForm } from "./registration-settings-form";
import { AdminTabs } from "./admin-tabs";
import { getLocale, getTranslations } from "next-intl/server";

export const instant = false;

export default async function AdminPage() {
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

  const [users, registrationEnabled] = await Promise.all([
    listUsers(),
    isRegistrationEnabled(),
  ]);

  return (
    <main className="app-shell">
      <AppHeader sectionLabel={t("usersPage.section")} />

      <section className="page-shell">
        <p className="page-kicker">{t("usersPage.section")}</p>
        <h1 className="page-title">{t("usersPage.title")}</h1>
        <p className="page-description max-w-2xl">{t("usersPage.description")}</p>

        <AdminTabs active="users" />

        <section className="panel-card mt-8 p-5 sm:p-6">
          <h2 className="text-xl font-semibold">{t("usersPage.registrationTitle")}</h2>
          <p className="mt-2 text-sm text-app-muted">
            {t("usersPage.registrationDescription")}
          </p>
          <RegistrationSettingsForm key={locale} enabled={registrationEnabled} />
        </section>

        <section className="panel-card mt-8 p-5 sm:p-6">
          <h2 className="text-xl font-semibold">{t("usersPage.createTitle")}</h2>
          <p className="mt-2 text-sm text-app-muted">
            {t("usersPage.createDescription")}
          </p>
          <div className="mt-5">
            <CreateUserForm key={locale} />
          </div>
        </section>

        <section className="panel-card mt-8 overflow-hidden">
          <div className="border-b border-app-border p-5 text-sm text-app-muted sm:px-6">
            {t("usersPage.globalRoleNotice")}
          </div>
          <div className="divide-y divide-app-border">
            {users.map((listedUser) => (
              <article
                key={listedUser.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
              >
                <div>
                  <p className="font-semibold">{listedUser.name}</p>
                  <p className="mt-1 text-sm text-app-muted">{listedUser.email}</p>
                  <p className="mt-2 text-xs text-app-subtle">
                    {t("usersPage.createdAt", {
                      date: new Intl.DateTimeFormat(locale).format(listedUser.createdAt),
                    })}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className={listedUser.isActive ? "text-app-success" : "text-app-danger"}>
                      {listedUser.isActive ? t("usersPage.active") : t("usersPage.blocked")}
                    </span>
                    {listedUser.mustChangePassword ? (
                      <span className="text-app-warning">{t("usersPage.passwordChangeRequired")}</span>
                    ) : null}
                    {listedUser.twoFactorEnabled ? (
                      <span className="text-app-muted">{t("usersPage.totpEnabled")}</span>
                    ) : null}
                    <span className="text-app-muted">{t(`usersPage.authStatus.${listedUser.authStatus}`)}</span>
                    {listedUser.hasOidc && !listedUser.oidcEnabled ? <span className="text-app-warning">{t("usersPage.oidcDisabled")}</span> : null}
                    {listedUser._count.passkeys > 0 ? (
                      <span className="text-app-warning">{t("usersPage.passkeys", { count: String(listedUser._count.passkeys) })}</span>
                    ) : null}
                  </div>
                </div>
                <div className="sm:min-w-80">
                  <UserRoleForm key={locale} userId={listedUser.id} role={listedUser.role} />
                  <UserActions
                    key={locale}
                    userId={listedUser.id}
                    isActive={listedUser.isActive}
                    mustChangePassword={listedUser.mustChangePassword}
                    twoFactorEnabled={Boolean(listedUser.twoFactorEnabled)}
                    passkeyCount={listedUser._count.passkeys}
                    hasOidc={listedUser.hasOidc}
                    hasPassword={listedUser.hasPassword}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
