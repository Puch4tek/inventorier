"use server";

import {createLocation} from "@/server/locations/create-location";
import { getTranslations } from "next-intl/server";
import { getLocationActionErrorKey } from "../action-errors";

export type NewLocationActionState = {
    error?: string;
    id?: number;
};

export async function newLocationAction(
    _previousState: NewLocationActionState,
    formData: FormData,
): Promise<NewLocationActionState> {
    const t = await getTranslations("organization.actions.locations");
    const name = formData.get("name");
    const description = formData.get("description");
    const parentId = formData.get("parentId");

    if (typeof name !== "string" || typeof description !== "string") {
        return { error: t("invalidData") };
    }

    let parsedParentId: number | undefined;

    if (typeof parentId === "string" && parentId.trim()) {
        parsedParentId = Number(parentId);

        if (!Number.isInteger(parsedParentId) || parsedParentId <= 0) {
            return { error: t("invalidParent") };
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
            error: t(getLocationActionErrorKey(error) ?? "createFailed"),
        };
    }
}