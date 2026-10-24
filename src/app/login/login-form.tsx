"use client";

import { useActionState } from "react";
import { loginAction, LoginActionState } from "@/app/login/actions";

const initialState: LoginActionState = {};

export default function LoginForm() {
    const [state, formAction, isPending] = useActionState(
        loginAction,
        initialState
    );
    return (
        <form action={formAction} className="space-y-5">
            <div>
                <label htmlFor="email" className="field-label">
                    Adres e-mail
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="field-input"
                    placeholder="Wprowadź adres e-mail"
                />

            </div>
            <div>
                <label htmlFor="password" className="field-label">
                    Hasło
                </label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="field-input"
                    placeholder="Wprowadź hasło"
                />
            </div>
            {state.error ? (
                <p
                    role="alert"
                    className="rounded-xl bg-[#fff2f2] px-4 py-3 text-sm text-[#b42318]"
                >
                    {state.error}
                </p>
            ) : null}
            <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-xl bg-[#1d1d1f] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#424245] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {isPending ? "Logowanie..." : "Zaloguj się"}
            </button>
        </form>
    )
}