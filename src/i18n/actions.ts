"use server";

import { cookies } from "next/headers";
import { persistLocaleCookie } from "./cookie";

export async function setLocaleAction(value: string) {
  const cookieStore = await cookies();
  persistLocaleCookie(cookieStore, value, process.env.NODE_ENV === "production");
}
