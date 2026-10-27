"use server";

import {createLocation} from "@/server/locations/create-location";

export type NewLocationActionState = {
    error?: string;
    id?: number;
};

export async function newLocationAction(
    _previousState: NewLocationActionState,
    formData: FormData,
): Promise<NewLocationActionState> {
    const name = formData.get("name");
    const description = formData.get("description");
    const parentId = formData.get("parentId");

    if (typeof name !== "string" || typeof description !== "string") {
        return { error: "Uzupełnij poprawnie dane lokalizacji." };
    }

    let parsedParentId: number | undefined;

    if (typeof parentId === "string" && parentId.trim()) {
        parsedParentId = Number(parentId);

        if (!Number.isInteger(parsedParentId) || parsedParentId <= 0) {
            return { error: "Nieprawidłowa lokalizacja nadrzędna." };
        }
    }

    try {
        const location = await createLocation({
            name,
            description,
            parentId: parsedParentId,
        });

        return {
            id: location.id,
        };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "An unknown error occurred",
        };
    }
}