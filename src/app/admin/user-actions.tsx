"use client";

import { Button } from "@/components/button";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  deleteUserAction,
  requirePasswordChangeAction,
  setUserStatusAction,
  resetUserPasswordAction,
  resetUserTwoFactorAction,
  type AdminActionState,
} from "./actions";

const initialState: AdminActionState = {};

export function UserActions({
  userId,
  isActive,
  mustChangePassword,
  twoFactorEnabled,
  passkeyCount,
}: {
  userId: string;
  isActive: boolean;
  mustChangePassword: boolean;
  twoFactorEnabled: boolean;
  passkeyCount: number;
}) {
  const t = useTranslations("admin.userActions");
  const [resetState, resetAction, isResetting] = useActionState(
    resetUserPasswordAction,
    initialState,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteUserAction,
    initialState,
  );
  const [statusState, statusAction, isChangingStatus] = useActionState(
    setUserStatusAction,
    initialState,
  );
  const [passwordState, passwordAction, isRequiringPasswordChange] = useActionState(
    requirePasswordChangeAction,
    initialState,
  );
  const [twoFactorState, twoFactorAction, isResettingTwoFactor] = useActionState(
    resetUserTwoFactorAction,
    initialState,
  );

  return (
    <div className="mt-4 space-y-3 border-t border-app-border pt-4">
      <div className="flex flex-wrap gap-2">
        <form action={statusAction}>
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="active" value={String(!isActive)} />
          <Button variant="secondary" type="submit" disabled={isChangingStatus} className="text-sm font-semibold transition px-3 py-2 text-xs disabled:opacity-50">
            {isChangingStatus ? t("saving") : isActive ? t("block") : t("unblock")}
          </Button>
        </form>
        <form action={passwordAction}>
          <input type="hidden" name="userId" value={userId} />
          <Button variant="secondary" type="submit" disabled={isRequiringPasswordChange || mustChangePassword} className="text-sm font-semibold transition px-3 py-2 text-xs disabled:opacity-50">
            {mustChangePassword ? t("passwordChangeRequired") : isRequiringPasswordChange ? t("saving") : t("requirePasswordChange")}
          </Button>
        </form>
      </div>
      {statusState.error ? <p role="alert" className="text-xs text-app-danger">{statusState.error}</p> : null}
      {statusState.success ? <p role="status" className="text-xs text-app-success">{statusState.success}</p> : null}
      {passwordState.error ? <p role="alert" className="text-xs text-app-danger">{passwordState.error}</p> : null}
      {passwordState.success ? <p role="status" className="text-xs text-app-success">{passwordState.success}</p> : null}
      {twoFactorEnabled || passkeyCount > 0 ? (
        <form action={twoFactorAction} onSubmit={(event) => {
          if (!window.confirm(t("resetTwoFactorConfirmation"))) event.preventDefault();
        }}>
          <input type="hidden" name="userId" value={userId} />
          <Button variant="secondary" type="submit" disabled={isResettingTwoFactor} className="px-3 py-2 text-xs">
            {isResettingTwoFactor ? t("resetting") : t("resetTwoFactor")}
          </Button>
        </form>
      ) : null}
      {twoFactorState.error ? <p role="alert" className="text-xs text-app-danger">{twoFactorState.error}</p> : null}
      {twoFactorState.success ? <p role="status" className="text-xs text-app-success">{twoFactorState.success}</p> : null}
      <form action={resetAction} className="flex flex-wrap gap-2">
        <input type="hidden" name="userId" value={userId} />
        <input
          name="password"
          type="password"
          aria-label={t("newPassword")}
          minLength={8}
          required
          placeholder={t("passwordPlaceholder")}
          className="field-input mt-0 min-w-0 flex-1 basis-52"
        />
        <Button variant="secondary"
          type="submit"
          disabled={isResetting}
          className="text-sm font-semibold transition px-3 py-2 text-xs disabled:opacity-50"
        >
          {isResetting ? t("resetting") : t("resetPassword")}
        </Button>
      </form>
      {resetState.error ? <p role="alert" className="text-xs text-app-danger">{resetState.error}</p> : null}
      {resetState.success ? <p role="status" className="text-xs text-app-success">{resetState.success}</p> : null}
      <form action={deleteAction}>
        <input type="hidden" name="userId" value={userId} />
        <button
          type="submit"
          disabled={isDeleting}
          className="inline-flex items-center justify-center rounded-xl border border-app-danger/[0.32] bg-app-surface text-sm font-semibold text-app-danger transition hover:bg-app-danger-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-danger px-3 py-2 text-xs disabled:opacity-50"
        >
          {isDeleting ? t("deleting") : t("deleteUser")}
        </button>
      </form>
      {deleteState.error ? <p role="alert" className="text-xs text-app-danger">{deleteState.error}</p> : null}
      {deleteState.success ? <p role="status" className="text-xs text-app-success">{deleteState.success}</p> : null}
    </div>
  );
}
