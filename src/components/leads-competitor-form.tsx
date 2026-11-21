"use client";

import { useActionState } from "react";
import { addCompetitorAction, type CompetitorState } from "@/app/leads/actions";

const initial: CompetitorState = {};

export function LeadsCompetitorForm() {
  const [state, action, pending] = useActionState(addCompetitorAction, initial);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <label className="flex min-w-56 flex-1 flex-col gap-1 text-xs uppercase tracking-[0.14em] text-muted">
        Competitor
        <input
          name="name"
          placeholder="Add a brand"
          className="rounded-[10px] border border-line bg-paper px-3 py-2 text-sm normal-case tracking-normal text-heading"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-heading px-4 py-2 text-sm font-semibold text-paper disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add name"}
      </button>
      {state.error ? <p className="text-sm text-heading">{state.error}</p> : null}
      {state.added ? <p className="text-sm text-muted">{state.added} is on the list.</p> : null}
    </form>
  );
}
