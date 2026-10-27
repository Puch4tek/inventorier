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

export const instant = false;

export default async function AdminPage() {
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
      <AppHeader sectionLabel="Administracja" />

      <section className="page-shell">
        <p className="page-kicker">Panel administratora</p>
        <h1 className="page-title">Panel administratora</h1>
        <p className="page-description max-w-2xl">
          Zarządzaj kontami, rolami globalnymi i ustawieniami systemu.
        </p>

        <section className="panel-card mt-8 p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Samodzielna rejestracja</h2>
          <p className="mt-2 text-sm text-app-muted">
            Określ, czy nowe osoby mogą samodzielnie zakładać konta.
            Administratorzy nadal mogą tworzyć użytkowników.
          </p>
          <RegistrationSettingsForm enabled={registrationEnabled} />
        </section>

        <section className="panel-card mt-8 p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Utwórz użytkownika</h2>
          <p className="mt-2 text-sm text-app-muted">
            Użytkownik otrzyma tymczasowe hasło ustawione przez administratora.
          </p>
          <div className="mt-5">
            <CreateUserForm />
          </div>
        </section>

        <section className="panel-card mt-8 overflow-hidden">
          <div className="border-b border-app-border p-5 text-sm text-app-muted sm:px-6">
            Rola globalna administratora daje dostęp do całej instancji. Dostęp
            pozostałych użytkowników nadaje się osobno dla każdego magazynu.
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
                    Konto od {listedUser.createdAt.toLocaleDateString("pl-PL")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className={listedUser.isActive ? "text-app-success" : "text-app-danger"}>
                      {listedUser.isActive ? "Aktywne" : "Zablokowane"}
                    </span>
                    {listedUser.mustChangePassword ? (
                      <span className="text-app-warning">Wymaga zmiany hasła</span>
                    ) : null}
                    {listedUser.twoFactorEnabled ? (
                      <span className="text-app-warning">Wymaga resetu uwierzytelniania dwuskładnikowego</span>
                    ) : null}
                  </div>
                </div>
                <div className="sm:min-w-80">
                  <UserRoleForm userId={listedUser.id} role={listedUser.role} />
                  <UserActions
                    userId={listedUser.id}
                    isActive={listedUser.isActive}
                    mustChangePassword={listedUser.mustChangePassword}
                    twoFactorEnabled={Boolean(listedUser.twoFactorEnabled)}
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
