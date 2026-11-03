"use server";

import { cookies } from "next/headers";
import { persistLocaleCookie } from "./cookie";
import { shouldUseSecureCookies } from "@/lib/cookie-security";

export async function setLocaleAction(value: string) {
  const cookieStore = await cookies();
  persistLocaleCookie(cookieStore, value, shouldUseSecureCookies());
}
