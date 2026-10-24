"use server";

import { deleteSession } from "@/server/auth/delete-session";
import { redirect } from "next/navigation";

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
