import type { Locale } from "@/i18n/locale";

export type ForgotPasswordActionState = {
  submitted?: boolean;
  error?: "invalidEmail";
};

type Dependencies = {
  getHeaders: () => Promise<Pick<Headers, "get">>;
  getLocale?: () => Promise<Locale>;
  schedule: (callback: () => Promise<void>) => void;
  requestReset: (email: string, context: { headers: Pick<Headers, "get">; locale: Locale }) => Promise<void>;
};

export function createForgotPasswordAction(deps: Dependencies) {
  return async (_previousState: ForgotPasswordActionState, formData: FormData): Promise<ForgotPasswordActionState> => {
    const email = formData.get("email");
    if (typeof email !== "string") {
      return { error: "invalidEmail" };
    }

    const [requestHeaders, locale] = await Promise.all([
      deps.getHeaders(),
      deps.getLocale?.() ?? Promise.resolve("pl" as const),
    ]);
    deps.schedule(() => deps.requestReset(email, { headers: requestHeaders, locale }));
    return { submitted: true };
  };
}
