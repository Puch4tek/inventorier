export type ForgotPasswordActionState = {
  submitted?: boolean;
  error?: string;
};

type Dependencies = {
  getHeaders: () => Promise<Pick<Headers, "get">>;
  schedule: (callback: () => Promise<void>) => void;
  requestReset: (email: string, context: { headers: Pick<Headers, "get"> }) => Promise<void>;
};

export function createForgotPasswordAction(deps: Dependencies) {
  return async (_previousState: ForgotPasswordActionState, formData: FormData): Promise<ForgotPasswordActionState> => {
    const email = formData.get("email");
    if (typeof email !== "string") {
      return { error: "Wprowadź prawidłowy adres e-mail." };
    }

    const requestHeaders = await deps.getHeaders();
    deps.schedule(() => deps.requestReset(email, { headers: requestHeaders }));
    return { submitted: true };
  };
}
