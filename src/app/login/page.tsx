import Link from "next/link";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { isRegistrationEnabled } from "@/server/settings/registration";
import LoginForm from "./login-form";

export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; error?: string | string[] }>;
}) {
  await connection();
  const [registrationEnabled, t, registrationT] = await Promise.all([
    isRegistrationEnabled(),
    getTranslations("auth.login"),
    getTranslations("auth.registration"),
  ]);
  const { next, error } = await searchParams;

  return (
    <main className="app-shell px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl items-center justify-center">
        <section className="panel-card grid w-full overflow-hidden rounded-4xl shadow-modal lg:grid-cols-[0.9fr_1.1fr]">
          <div className="hidden bg-app-accent p-12 text-app-inverse lg:flex lg:flex-col lg:justify-between">
            <div>
              <p className="text-sm font-semibold tracking-[0.22em] text-app-inverse-muted">
                Inventorier
              </p>
              <p className="mt-16 max-w-sm text-5xl font-semibold leading-[1.05] tracking-[-0.04em]">
                {t("welcome")}
              </p>
            </div>
            <p className="max-w-sm text-sm leading-6 text-app-inverse-muted">
              {t("welcomeDescription")}
            </p>
          </div>

          <div className="p-7 sm:p-12">
            <div className="mb-10">
              <p className="text-sm font-medium text-app-muted">Inventorier</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
                {t("title")}
              </h1>
              <p className="mt-3 text-[15px] leading-6 text-app-muted">
                {t("introduction")}
              </p>
            </div>

            {error ? (
              <p role="alert" className="status-error mb-5">
                {error === "account_not_linked" ? t("oidcAccountNotLinked") : t("oidcError")}
              </p>
            ) : null}
            <LoginForm next={typeof next === "string" ? next : undefined} />

            <p className="mt-8 text-center text-sm text-app-muted">
              {registrationEnabled ? (
                <>
                  {t("registrationPrompt")}{" "}
                  <Link
                    href="/users/new"
                    className="font-medium text-app-foreground underline decoration-app-border-strong underline-offset-4 transition hover:decoration-app-foreground"
                  >
                    {t("createAccount")}
                  </Link>
                </>
              ) : registrationT("errors.unavailable")}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
