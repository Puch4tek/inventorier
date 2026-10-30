"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/button";
import { authClient } from "@/lib/auth-client";
import {
    finishPasskeyLogin,
    loginAction,
    verifyTwoFactorAction,
    type LoginActionState,
} from "@/app/login/actions";

const initialState: LoginActionState = {};

function TwoFactorForm({ next, onBack }: { next?: string; onBack: () => void }) {
    const t = useTranslations("auth.login");
    const [twoFactorState, twoFactorFormAction, isTwoFactorPending] = useActionState(
        verifyTwoFactorAction,
        initialState
    );

    return (
        <form action={twoFactorFormAction} className="space-y-5">
            {next ? <input type="hidden" name="next" value={next} /> : null}
            <div>
                <label htmlFor="two-factor-method" className="field-label">
                    {t("twoFactorMethod")}
                </label>
                <select
                    id="two-factor-method"
                    name="method"
                    className="field-input field-select"
                    defaultValue="totp"
                >
                    <option value="totp">{t("authenticatorApp")}</option>
                    <option value="backup">{t("backupCode")}</option>
                </select>
            </div>
            <div>
                <label htmlFor="two-factor-code" className="field-label">
                    {t("verificationCode")}
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
                    placeholder={t("verificationCodePlaceholder")}
                />
            </div>
            <label className="flex items-start gap-3 text-sm text-app-muted">
                <input
                    type="checkbox"
                    name="trustDevice"
                    className="mt-1"
                />
                <span>{t("trustDevice")}</span>
            </label>
            {twoFactorState.error ? (
                <p role="alert" className="status-error">
                    {t(`errors.${twoFactorState.error}`)}
                </p>
            ) : null}
            <Button
                variant="primary"
                type="submit"
                disabled={isTwoFactorPending}
                className="w-full px-5 py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
                {isTwoFactorPending ? t("verifying") : t("verify")}
            </Button>
            <Button
                variant="secondary"
                type="button"
                onClick={onBack}
                disabled={isTwoFactorPending}
                className="w-full px-5 py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
                {t("backToPassword")}
            </Button>
        </form>
    );
}

export default function LoginForm({ next }: { next?: string }) {
    const t = useTranslations("auth.login");
    const [loginState, loginFormAction, isLoginPending] = useActionState(
        loginAction,
        initialState
    );
    const [passkeyError, setPasskeyError] = useState<LoginActionState["error"]>();
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
                const code = "code" in result.error ? result.error.code : undefined;
                if (code === "PASSKEY_NOT_FOUND" || code === "USER_NOT_FOUND") {
                    setPasskeyError("passkeyNotFound");
                } else if (code === "PASSKEY_RESET") {
                    setPasskeyError("passkeyReset");
                } else if (code === "ACCOUNT_DISABLED") {
                    setPasskeyError("accountDisabled");
                } else if (code === "AUTH_CANCELLED") {
                    setPasskeyError("passkeyCancelled");
                } else {
                    setPasskeyError("passkeyFailure");
                }
                return;
            }
            if (!result.data) {
                setPasskeyError("passkeyConfirmationFailure");
                return;
            }

            const completion = await finishPasskeyLogin(next ?? "/dashboard");
            if (completion.error) setPasskeyError(completion.error);
        } catch (error) {
            const errorName = error instanceof Error ? error.name : undefined;
            setPasskeyError(
                errorName === "NotAllowedError" || errorName === "AbortError"
                    ? "passkeyCancelled"
                    : errorName === "NotSupportedError"
                      ? "passkeyUnsupported"
                      : "passkeyFailure",
            );
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
                            {t("email")}
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="field-input"
                            placeholder={t("emailPlaceholder")}
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="field-label">
                            {t("password")}
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            className="field-input"
                            placeholder={t("passwordPlaceholder")}
                        />
                    </div>
                    <Link
                        href="/forgot-password"
                        className="inline-block text-sm font-medium underline underline-offset-4"
                    >
                        {t("forgotPassword")}
                    </Link>
                    {loginState.error ? (
                        <p role="alert" className="status-error">
                            {t(`errors.${loginState.error}`)}
                        </p>
                    ) : null}
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={isLoginPending}
                        className="w-full px-5 py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isLoginPending ? t("submitting") : t("submit")}
                    </Button>
                </form>
            )}

            <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs text-app-muted">
                    <span className="h-px flex-1 bg-app-border" />
                    <span>{t("or")}</span>
                    <span className="h-px flex-1 bg-app-border" />
                </div>
                <Button
                    variant="secondary"
                    type="button"
                    onClick={signInWithPasskey}
                    disabled={isPasskeyPending}
                    className="w-full px-5 py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isPasskeyPending ? t("passkeyWaiting") : t("passkey")}
                </Button>
                {passkeyError ? (
                    <p role="alert" className="status-error">
                        {t(`errors.${passkeyError}`)}
                    </p>
                ) : null}
            </div>
        </div>
    );
}
