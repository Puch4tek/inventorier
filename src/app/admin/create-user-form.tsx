"use client";

import { Button } from "@/components/button";
import { useActionState } from "react";
import { createAdminUserAction, type AdminActionState } from "./actions";

const initialState: AdminActionState = {};

export function CreateUserForm() {
  const [state, formAction, isPending] = useActionState(
    createAdminUserAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="admin-name" className="field-label">Imię i nazwisko</label>
        <input id="admin-name" name="name" required className="field-input" />
      </div>
      <div>
        <label htmlFor="admin-email" className="field-label">E-mail</label>
        <input id="admin-email" name="email" type="email" required className="field-input" />
      </div>
      <div>
        <label htmlFor="admin-password" className="field-label">Hasło tymczasowe</label>
        <input id="admin-password" name="password" type="password" minLength={8} required className="field-input" />
      </div>
      <div>
        <label htmlFor="admin-role" className="field-label">Rola systemowa</label>
        <select id="admin-role" name="role" defaultValue="USER" className="field-input field-select">
          <option value="USER">Użytkownik</option>
          <option value="ADMIN">Administrator</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <Button variant="primary"
          type="submit"
          disabled={isPending}
          className="px-5 py-3 text-sm font-semibold transition disabled:opacity-50"
        >
          {isPending ? "Tworzenie..." : "Utwórz użytkownika"}
        </Button>
        {state.error ? <p role="alert" className="status-error mt-3">{state.error}</p> : null}
        {state.success ? <p role="status" className="status-success mt-3">{state.success}</p> : null}
      </div>
    </form>
  );
}
