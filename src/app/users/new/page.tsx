import Link from "next/link";
import { connection } from "next/server";
import {
  isRegistrationEnabled,
  REGISTRATION_DISABLED_MESSAGE,
} from "@/server/settings/registration";
import { RegisterForm } from "./register-form";

export const instant = false;

export default async function NewUserPage() {
  await connection();
  const registrationEnabled = await isRegistrationEnabled();

  return (
    <main className="app-shell px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl items-center justify-center">
        <section className="panel-card grid w-full overflow-hidden rounded-[2rem] shadow-modal lg:grid-cols-[0.9fr_1.1fr]">
          <div className="hidden bg-app-accent p-12 text-app-inverse lg:flex lg:flex-col lg:justify-between">
            <div>
              <p className="text-sm font-semibold tracking-[0.22em] text-app-inverse-muted uppercase">
                Inventory App
              </p>
              <h1 className="mt-16 max-w-sm text-5xl font-semibold leading-[1.05] tracking-[-0.04em]">
                Zacznij porządkować swój magazyn.
              </h1>
            </div>
            <p className="max-w-sm text-sm leading-6 text-app-inverse-muted">
              Jedno miejsce na przedmioty, lokalizacje i historię zmian.
            </p>
          </div>

          <div className="p-7 sm:p-12">
            <div className="mb-10">
              <p className="text-sm font-medium text-app-muted">Pierwszy krok</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
                Utwórz konto
              </h2>
              <p className="mt-3 text-[15px] leading-6 text-app-muted">
                {registrationEnabled
                  ? "Załóż konto, aby rozpocząć pracę z aplikacją."
                  : REGISTRATION_DISABLED_MESSAGE}
              </p>
            </div>

            {registrationEnabled ? <RegisterForm /> : null}

            <p className="mt-8 text-center text-sm text-app-muted">
              Masz już konto?{" "}
              <Link
                href="/login"
                className="font-medium text-app-foreground underline decoration-app-border-strong underline-offset-4 transition hover:decoration-app-foreground"
              >
                Zaloguj się
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
