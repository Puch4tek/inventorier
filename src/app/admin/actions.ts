"use server";

import type { Role } from "@/generated/prisma/client";
import { requireRoleSession } from "@/server/auth/permissions";
import { updateUserRole } from "@/server/users/update-user-role";
import { createUser } from "@/server/users/create-user";
import { deleteUser } from "@/server/users/delete-user";
import { resetUserPassword } from "@/server/users/reset-user-password";
import { setUserStatus } from "@/server/users/set-user-status";
import { setPasswordChangeRequired } from "@/server/users/set-password-change-required";
import { setRegistrationEnabled } from "@/server/settings/registration";
import { resetUserTwoFactor } from "@/server/users/reset-user-two-factor";
import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { getAdminActionError } from "@/i18n/admin-errors";

export type AdminActionState = { error?: string; success?: string };

export async function resetUserTwoFactorAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const t = await getTranslations("admin");
  const locale = await getLocale();
  try {
    const currentUser = await requireRoleSession("ADMIN");
    const userId = formData.get("userId");
    if (typeof userId !== "string" || !userId) return { error: t("actions.errors.invalidUser") };
    await resetUserTwoFactor(userId, currentUser.user.id, currentUser.session.id);
    revalidatePath("/admin");
    return { success: t("actions.success.resetAuthentication") };
  } catch (error) {
    return { error: getAdminActionError(error, locale, "resetAuthentication") };
  }
}

export async function setRegistrationEnabledAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const t = await getTranslations("admin");
  const locale = await getLocale();
  let currentUser: Awaited<ReturnType<typeof requireRoleSession>>;
  try {
    currentUser = await requireRoleSession("ADMIN");
  } catch (error) {
    return {
      error: getAdminActionError(error, locale, "unauthorized"),
    };
  }

  const enabled = formData.get("enabled");
  if (enabled !== "true" && enabled !== "false") {
    return { error: t("actions.errors.invalidRegistration") };
  }

  try {
    await setRegistrationEnabled(enabled === "true", currentUser.user.id, currentUser.session.id);
    revalidatePath("/admin");
    revalidatePath("/users/new");
    revalidatePath("/login");
    revalidatePath("/");
    return {
      success: enabled === "true"
        ? t("actions.success.registrationEnabled")
        : t("actions.success.registrationDisabled"),
    };
  } catch (error) {
    console.error("Nie udało się zmienić ustawienia rejestracji:", error);
    return { error: getAdminActionError(error, locale, "registration") };
  }
}

export async function setUserStatusAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const t = await getTranslations("admin");
  const locale = await getLocale();
  try {
    const currentUser = await requireRoleSession("ADMIN");
    const userId = formData.get("userId");
    const active = formData.get("active");
    if (typeof userId !== "string" || !userId || (active !== "true" && active !== "false")) {
      return { error: t("actions.errors.invalidUserData") };
    }
    await setUserStatus(userId, active === "true", currentUser.user.id, currentUser.session.id);
    revalidatePath("/admin");
    return { success: active === "true"
      ? t("actions.success.accountUnblocked")
      : t("actions.success.accountBlocked") };
  } catch (error) {
    return { error: getAdminActionError(error, locale, "changeAccountStatus") };
  }
}

export async function requirePasswordChangeAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const t = await getTranslations("admin");
  const locale = await getLocale();
  try {
    const currentUser = await requireRoleSession("ADMIN");
    const userId = formData.get("userId");
    if (typeof userId !== "string" || !userId) {
      return { error: t("actions.errors.invalidUser") };
    }
    await setPasswordChangeRequired(userId, currentUser.user.id, currentUser.session.id);
    revalidatePath("/admin");
    return { success: t("actions.success.passwordChangeRequired") };
  } catch (error) {
    return { error: getAdminActionError(error, locale, "requirePasswordChange") };
  }
}

export async function createAdminUserAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const t = await getTranslations("admin");
  const locale = await getLocale();
  try {
    const currentUser = await requireRoleSession("ADMIN");
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const role = formData.get("role");

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !["USER", "ADMIN"].includes(String(role))
    ) {
      return { error: t("actions.errors.invalidUserData") };
    }

    await createUser({
      name,
      email,
      password,
      role: role as Role,
      actorId: currentUser.user.id,
      sessionId: currentUser.session.id,
      mustChangePassword: true,
    });
    revalidatePath("/admin");
    return { success: t("actions.success.userCreated") };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { error: t("actions.errors.duplicateEmail") };
    }
    return {
      error: getAdminActionError(error, locale, "createUser"),
    };
  }
}

export async function updateUserRoleAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const t = await getTranslations("admin");
  const locale = await getLocale();
  try {
    const currentUser = await requireRoleSession("ADMIN");
    const userId = formData.get("userId");
    const role = formData.get("role");

    if (typeof userId !== "string" || !userId || !["USER", "ADMIN"].includes(String(role))) {
      return { error: t("actions.errors.invalidUserData") };
    }

    await updateUserRole(userId, role as Role, currentUser.user.id, currentUser.session.id);
    revalidatePath("/admin");
    return { success: t("actions.success.roleUpdated") };
  } catch (error) {
    return { error: getAdminActionError(error, locale, "updateRole") };
  }
}

export async function resetUserPasswordAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const t = await getTranslations("admin");
  const locale = await getLocale();
  try {
    const currentUser = await requireRoleSession("ADMIN");
    const userId = formData.get("userId");
    const password = formData.get("password");
    if (typeof userId !== "string" || !userId || typeof password !== "string") {
      return { error: t("actions.errors.invalidPasswordReset") };
    }

    await resetUserPassword(userId, password, currentUser.user.id, currentUser.session.id);
    return { success: t("actions.success.passwordReset") };
  } catch (error) {
    return { error: getAdminActionError(error, locale, "resetPassword") };
  }
}

export async function deleteUserAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const t = await getTranslations("admin");
  const locale = await getLocale();
  try {
    const currentUser = await requireRoleSession("ADMIN");
    const userId = formData.get("userId");
    if (typeof userId !== "string" || !userId) {
      return { error: t("actions.errors.invalidUser") };
    }

    await deleteUser(userId, currentUser.user.id, currentUser.session.id);
    revalidatePath("/admin");
    return { success: t("actions.success.userDeleted") };
  } catch (error) {
    return { error: getAdminActionError(error, locale, "deleteUser") };
  }
}
