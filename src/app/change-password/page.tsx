import { redirect } from "next/navigation";
import { getActiveSessionUser } from "@/server/auth/get-current-user";
import { logoutAction } from "@/app/dashboard/actions";
import { ChangePasswordForm } from "./change-password-form";

export const instant = false;

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const user = await getActiveSessionUser();
  if (!user) {
    redirect("/login");
  }

  const { next } = await searchParams;
  return (
    <main className="app-shell px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-lg items-center justify-center">
        <section className="panel-card w-full p-7 sm:p-12">
          <p className="text-sm font-medium text-app-muted">Inventory App</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">Ustaw nowe hasło</h1>
          <p className="mt-3 text-[15px] leading-6 text-app-muted">
            Administrator wymaga ustawienia własnego hasła przed dalszym korzystaniem z aplikacji.
          </p>
          <div className="mt-8"><ChangePasswordForm next={typeof next === "string" ? next : undefined} /></div>
          <form action={logoutAction} className="mt-5">
            <button type="submit" className="text-sm text-app-muted underline">
              Wyloguj się
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
