"use client";

import { useActionState, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import type { ModerationFormState } from "@/lib/services/moderation-rules";

type Props = {
  action: (state: ModerationFormState, form: FormData) => Promise<ModerationFormState>;
  label: string;
  field: "role" | "status" | "verified";
  options: Array<{ value: string; label: string }>;
  hidden: Record<string, string>;
  help?: string;
};

export function AdminChangeForm({ action, label, field, options, hidden, help }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const id = useId();
  const router = useRouter();
  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);
  return (
    <details className="min-w-52 max-w-md rounded-lg border border-neutral-200 bg-white">
      <summary className="cursor-pointer px-3 py-3 text-sm font-medium text-neutral-800">
        {label}
      </summary>
      <form action={formAction} className="space-y-3 border-t border-neutral-100 p-3">
        {Object.entries(hidden).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        {help ? <p className="text-xs text-neutral-600">{help}</p> : null}
        <fieldset disabled={pending} className="space-y-3">
          <legend className="sr-only">{label}</legend>
          <div>
            <label htmlFor={id + "-choice"} className="block text-sm font-medium">
              Change
            </label>
            <select
              id={id + "-choice"}
              name={field}
              defaultValue=""
              required
              className="mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm"
            >
              <option value="" disabled>
                Choose a change
              </option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={id + "-reason"} className="block text-sm font-medium">
              Review reason
            </label>
            <textarea
              id={id + "-reason"}
              name="reason"
              required
              maxLength={5000}
              rows={3}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
        </fieldset>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Recording…" : "Record change"}
        </button>
        {state.error ? (
          <p role="alert" className="text-sm text-red-700">
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <p role="status" className="text-sm text-emerald-800">
            {state.success}
          </p>
        ) : null}
      </form>
    </details>
  );
}
