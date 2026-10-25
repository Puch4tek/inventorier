import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { requireRole } from "@/server/auth/permissions";
import { listUsers } from "@/server/users/list-users";
import { logoutAction } from "@/app/dashboard/actions";
import { UserRoleForm } from "./user-role-form";
import { CreateUserForm } from "./create-user-form";
import { UserActions } from "./user-actions";
import { ThemeToggle } from "../theme-toggle";

export const instant = false;

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  try {
    await requireRole("ADMIN");
  } catch {
    redirect("/dashboard");
  }

  const users = await listUsers();

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="font-semibold tracking-[-0.02em]">
              Inventory App
            </Link>
            <span className="text-sm text-[#6e6e73]">Administracja</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action={logoutAction}>
              <button type="submit" className="primary-button px-3 py-2 text-xs sm:px-4 sm:text-sm">
                Wyloguj
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="page-shell">
        <p className="page-kicker">Panel administratora</p>
        <h1 className="page-title">
          Użytkownicy i role
        </h1>
        <p className="page-description max-w-2xl">
          Przydzielaj role określające zakres operacji dostępnych w magazynie.
        </p>

        <section className="panel-card mt-8 p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Utwórz użytkownika</h2>
          <p className="mt-2 text-sm text-[#6e6e73]">
            Użytkownik otrzyma tymczasowe hasło ustawione przez administratora.
          </p>
          <div className="mt-5">
            <CreateUserForm />
          </div>
        </section>

        <section className="panel-card mt-8 overflow-hidden">
          <div className="divide-y divide-black/[0.06]">
            {users.map((listedUser) => (
              <article
                key={listedUser.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
              >
                <div>
                  <p className="font-semibold">{listedUser.name}</p>
                  <p className="mt-1 text-sm text-[#6e6e73]">{listedUser.email}</p>
                  <p className="mt-2 text-xs text-[#86868b]">
                    Konto od {listedUser.createdAt.toLocaleDateString("pl-PL")}
                  </p>
                </div>
                <div className="sm:min-w-80">
                  <UserRoleForm userId={listedUser.id} role={listedUser.role} />
                  <UserActions userId={listedUser.id} />
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
