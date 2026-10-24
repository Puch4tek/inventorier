import Link from "next/link";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f7] px-5 py-8 text-[#1d1d1f] sm:px-8 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[2rem] border border-black/[0.06] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.08)] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="hidden bg-[#1d1d1f] p-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#a7a7ad]">
                Inventory App
              </p>
              <h1 className="mt-16 max-w-sm text-5xl font-semibold leading-[1.05] tracking-[-0.04em]">
                Witaj z powrotem.
              </h1>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[#a7a7ad]">
              Zaloguj się, aby zarządzać przedmiotami i lokalizacjami.
            </p>
          </div>

          <div className="p-7 sm:p-12">
            <div className="mb-10">
              <p className="text-sm font-medium text-[#6e6e73]">Inventory App</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
                Zaloguj się
              </h2>
              <p className="mt-3 text-[15px] leading-6 text-[#6e6e73]">
                Wprowadź dane swojego konta, aby kontynuować.
              </p>
            </div>

            <LoginForm />

            <p className="mt-8 text-center text-sm text-[#6e6e73]">
              Nie masz jeszcze konta?{" "}
              <Link
                href="/users/new"
                className="font-medium text-[#1d1d1f] underline decoration-[#c7c7cc] underline-offset-4 transition hover:decoration-[#1d1d1f]"
              >
                Utwórz konto
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}