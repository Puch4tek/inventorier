import "server-only";

import { getUserByEmail } from "@/server/users/get-user-by-email";
import bcrypt from "bcryptjs";

export async function authenticateUser(email: string, password: string) {
    const user = await getUserByEmail(email);
    if (!user) {
        return null;
    }

    if (!user.passwordHash) {
        return null;
    }
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        return null;
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    };
}