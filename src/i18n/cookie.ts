import { isLocale, localeCookieName } from "./locale";

type LocaleCookieOptions = {
  httpOnly: true;
  maxAge: number;
  path: "/";
  sameSite: "lax";
  secure: boolean;
};

type CookieWriter = {
  set(name: string, value: string, options: LocaleCookieOptions): unknown;
};

export const localeCookieOptions = (secure: boolean): LocaleCookieOptions => ({
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 365,
  path: "/",
  sameSite: "lax",
  secure,
});

export function persistLocaleCookie(
  cookieStore: CookieWriter,
  value: unknown,
  secure: boolean,
) {
  if (!isLocale(value)) return false;

  cookieStore.set(localeCookieName, value, localeCookieOptions(secure));
  return true;
}
