"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/button";
import { authClient } from "@/lib/auth-client";
import {
    finishPasskeyLogin,
    loginAction,
    verifyTwoFactorAction,
    type LoginActionState,
} from "@/app/login/actions";

const initialState: LoginActionState = {};

function getPasskeyError(code?: string, errorName?: string): string {
    if (code === "AUTH_CANCELLED" || errorName === "NotAllowedError" || errorName === "AbortError") {
        return "Logowanie passkey zostało anulowane.";
    }
    if (code === "PASSKEY_NOT_FOUND" || code === "USER_NOT_FOUND") {
        return "Nie znaleziono passkey dla tego konta.";
    }
    if (code === "ACCOUNT_DISABLED") {
        return "To konto jest zablokowane. Skontaktuj się z administratorem.";
    }
    if (errorName === "NotSupportedError") {
        return "Ta przeglądarka lub urządzenie nie obsługuje passkey.";
    }
    return "Nie udało się zalogować passkey. Spróbuj ponownie.";
}

function TwoFactorForm({ next, onBack }: { next?: string; onBack: () => void }) {
    const [twoFactorState, twoFactorFormAction, isTwoFactorPending] = useActionState(
        verifyTwoFactorAction,
        initialState
    );

    return (
        <form action={twoFactorFormAction} className="space-y-5">
            {next ? <input type="hidden" name="next" value={next} /> : null}
            <div>
                <label htmlFor="two-factor-method" className="field-label">
                    Sposób weryfikacji
                </label>
                <select
                    id="two-factor-method"
                    name="method"
                    className="field-input field-select"
                    defaultValue="totp"
                >
                    <option value="totp">Aplikacja uwierzytelniająca</option>
                    <option value="backup">Kod zapasowy</option>
                </select>
            </div>
            <div>
                <label htmlFor="two-factor-code" className="field-label">
                    Kod weryfikacyjny
                </label>
                <input
                    id="two-factor-code"
                    name="code"
                    type="text"
                    inputMode="text"
                    autoComplete="one-time-code"
                    required
                    autoFocus
                    className="field-input"
                    placeholder="Wprowadź kod"
                />
            </div>
            <label className="flex items-start gap-3 text-sm text-app-muted">
                <input
                    type="checkbox"
                    name="trustDevice"
                    className="mt-1"
                />
                <span>Zaufaj temu urządzeniu</span>
            </label>
            {twoFactorState.error ? (
                <p role="alert" className="status-error">
                    {twoFactorState.error}
                </p>
            ) : null}
            <Button
                variant="primary"
                type="submit"
                disabled={isTwoFactorPending}
                className="w-full px-5 py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
                {isTwoFactorPending ? "Weryfikowanie..." : "Potwierdź i zaloguj się"}
            </Button>
            <Button
                variant="secondary"
                type="button"
                onClick={onBack}
                disabled={isTwoFactorPending}
                className="w-full px-5 py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
                Wróć do logowania hasłem
            </Button>
        </form>
    );
}

export default function LoginForm({ next }: { next?: string }) {
    const [loginState, loginFormAction, isLoginPending] = useActionState(
        loginAction,
        initialState
    );
    const [passkeyError, setPasskeyError] = useState<string>();
    const [isPasskeyPending, setIsPasskeyPending] = useState(false);
    // Stan, z którego użytkownik wrócił do kroku hasła; nowy wynik loginAction znów otwiera krok 2FA.
    const [dismissedState, setDismissedState] = useState<LoginActionState>();
    const isTwoFactorStep = loginState.step === "two-factor" && dismissedState !== loginState;

    async function signInWithPasskey() {
        setPasskeyError(undefined);
        setIsPasskeyPending(true);
        try {
            const result = await authClient.signIn.passkey();
            if (result.error) {
                setPasskeyError(getPasskeyError(
                    "code" in result.error ? result.error.code : undefined,
                    result.error.statusText
                ));
                return;
            }
            if (!result.data) {
                setPasskeyError("Nie udało się potwierdzić logowania passkey. Spróbuj ponownie.");
                return;
            }

            const completion = await finishPasskeyLogin(next ?? "/dashboard");
            if (completion.error) setPasskeyError(completion.error);
        } catch (error) {
            const errorName = error instanceof Error ? error.name : undefined;
            setPasskeyError(getPasskeyError(undefined, errorName));
        } finally {
            setIsPasskeyPending(false);
        }
    }

    return (
        <div className="space-y-5">
            {isTwoFactorStep ? (
                <TwoFactorForm next={next} onBack={() => setDismissedState(loginState)} />
            ) : (
                <form action={loginFormAction} className="space-y-5">
                    {next ? <input type="hidden" name="next" value={next} /> : null}
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
                    <Link
                        href="/forgot-password"
                        className="inline-block text-sm font-medium underline underline-offset-4"
                    >
                        Nie pamiętasz hasła?
                    </Link>
                    {loginState.error ? (
                        <p role="alert" className="status-error">
                            {loginState.error}
                        </p>
                    ) : null}
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={isLoginPending}
                        className="w-full px-5 py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isLoginPending ? "Logowanie..." : "Zaloguj się"}
                    </Button>
                </form>
            )}

            <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs text-app-muted">
                    <span className="h-px flex-1 bg-app-border" />
                    <span>lub</span>
                    <span className="h-px flex-1 bg-app-border" />
                </div>
                <Button
                    variant="secondary"
                    type="button"
                    onClick={signInWithPasskey}
                    disabled={isPasskeyPending}
                    className="w-full px-5 py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isPasskeyPending ? "Oczekiwanie na passkey..." : "Zaloguj się passkey"}
                </Button>
                {passkeyError ? (
                    <p role="alert" className="status-error">
                        {passkeyError}
                    </p>
                ) : null}
            </div>
        </div>
    );
}
