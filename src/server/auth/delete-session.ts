import "server-only"

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function deleteSession() {
    await auth.api.signOut({
        headers: await headers(),
    });
}