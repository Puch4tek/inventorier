import Link from "next/link";
import { connection } from "next/server";
import { isRegistrationEnabled, REGISTRATION_DISABLED_MESSAGE } from "@/server/settings/registration";
import LoginForm from "./login-form";

export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  await connection();
  const registrationEnabled = await isRegistrationEnabled();
  const { next } = await searchParams;

  return (
    <main className="app-shell px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl items-center justify-center">
        <section className="panel-card grid w-full overflow-hidden rounded-[2rem] shadow-modal lg:grid-cols-[0.9fr_1.1fr]">
          <div className="hidden bg-app-accent p-12 text-app-inverse lg:flex lg:flex-col lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-app-inverse-muted">
                Inventory App
              </p>
              <p className="mt-16 max-w-sm text-5xl font-semibold leading-[1.05] tracking-[-0.04em]">
                Witaj z powrotem.
              </p>
            </div>
            <p className="max-w-sm text-sm leading-6 text-app-inverse-muted">
              Zaloguj się, aby zarządzać przedmiotami i lokalizacjami.
            </p>
          </div>

          <div className="p-7 sm:p-12">
            <div className="mb-10">
              <p className="text-sm font-medium text-app-muted">Inventory App</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
                Zaloguj się
              </h1>
              <p className="mt-3 text-[15px] leading-6 text-app-muted">
                Wprowadź dane swojego konta, aby kontynuować.
              </p>
            </div>

            <LoginForm next={typeof next === "string" ? next : undefined} />

            <p className="mt-8 text-center text-sm text-app-muted">
              {registrationEnabled ? (
                <>
                  Nie masz jeszcze konta?{" "}
                  <Link
                    href="/users/new"
                    className="font-medium text-app-foreground underline decoration-app-border-strong underline-offset-4 transition hover:decoration-app-foreground"
                  >
                    Utwórz konto
                  </Link>
                </>
              ) : REGISTRATION_DISABLED_MESSAGE}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}