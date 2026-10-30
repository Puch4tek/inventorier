export type UserOperationErrorCode =
  | "password-too-short"
  | "password-same"
  | "not-authenticated"
  | "invalid-current-password"
  | "password-already-changed"
  | "profile-name-too-short"
  | "profile-name-too-long";

export class UserOperationError extends Error {
  constructor(
    readonly code: UserOperationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "UserOperationError";
  }
}
