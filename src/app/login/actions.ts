"use server";

import {authenticateUser} from "@/server/auth/authenticate-user";
import {createSession} from "@/server/auth/create-session";
import {redirect} from "next/navigation";

export type LoginActionState = {
    error?: string;
    id?: number;
}

export async function loginAction(_previousState: LoginActionState, formData: FormData): Promise<LoginActionState> {
    let email = formData.get("email") ;
    const password = formData.get("password") ;
    if (typeof email !== "string" || typeof password !== "string") {
        return {error: "Uzupełnij wszystkie pola."};
    }
    email = email.trim().toLowerCase();
    const user = await authenticateUser(email, password);
    if (!user) {
        return {error: "Nieprawidłowy adres email lub hasło."};
    }
    await createSession(user.id);
    return redirect("/dashboard");
}