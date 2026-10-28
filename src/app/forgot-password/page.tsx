import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata = {
  title: "Resetowanie hasła",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <main className="app-shell px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-lg items-center justify-center">
        <section className="panel-card w-full p-7 sm:p-12">
          <p className="text-sm font-medium text-app-muted">Inventorier</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
            Nie pamiętasz hasła?
          </h1>
          <p className="mt-3 text-[15px] leading-6 text-app-muted">
            Podaj adres e-mail powiązany z kontem. Jeśli można zresetować dla
            niego hasło, wyślemy instrukcję.
          </p>
          <div className="mt-8"><ForgotPasswordForm /></div>
          <p className="mt-6 text-center text-sm text-app-muted">
            <Link href="/login" className="underline underline-offset-4">
              Wróć do logowania
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
