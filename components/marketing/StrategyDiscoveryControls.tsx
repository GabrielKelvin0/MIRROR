"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { RiskProfile, TimeHorizon } from "@/lib/data/strategies";
import type { StrategySort } from "@/lib/data/strategies";

interface Facets {
  assetClasses: string[];
  philosophies: string[];
  riskProfiles: RiskProfile[];
  timeHorizons: TimeHorizon[];
}

const SORT_OPTIONS: { value: StrategySort; label: string }[] = [
  { value: "risk", label: "Risk (low → high)" },
  { value: "name", label: "Name (A–Z)" },
  { value: "updated", label: "Most updates" },
];

function buildQuery(
  params: URLSearchParams,
  overrides: Record<string, string | undefined>
): string {
  const next = new URLSearchParams(params);
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined || value === "") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
  }
  const qs = next.toString();
  return qs ? `?${qs}` : "";
}

function SelectField({
  name,
  label,
  value,
  options,
  onChange,
  placeholder,
}: {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-neutral-700">{label}</span>
      <select
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 focus-visible:outline-2 focus-visible:outline-emerald-600"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function StrategyDiscoveryControls({ facets }: { facets: Facets }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const query = searchParams.get("q") ?? "";
  const risk = searchParams.get("risk") ?? "";
  const timeHorizon = searchParams.get("horizon") ?? "";
  const assetClass = searchParams.get("asset") ?? "";
  const philosophy = searchParams.get("philosophy") ?? "";
  const sort = (searchParams.get("sort") ?? "risk") as StrategySort;

  const navigate = (overrides: Record<string, string | undefined>) => {
    router.push(`/strategies${buildQuery(searchParams, overrides)}`);
  };

  return (
    <form className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Search</span>
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search strategies, theses, or philosophies…"
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 focus-visible:outline-2 focus-visible:outline-emerald-600"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Sort</span>
          <select
            name="sort"
            value={sort}
            onChange={(e) => navigate({ sort: e.target.value })}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 focus-visible:outline-2 focus-visible:outline-emerald-600"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SelectField
          name="risk"
          label="Risk profile"
          value={risk}
          placeholder="Any risk profile"
          options={facets.riskProfiles.map((value) => ({ value, label: value }))}
          onChange={(value) => navigate({ risk: value })}
        />
        <SelectField
          name="horizon"
          label="Time horizon"
          value={timeHorizon}
          placeholder="Any horizon"
          options={facets.timeHorizons.map((value) => ({ value, label: value }))}
          onChange={(value) => navigate({ horizon: value })}
        />
        <SelectField
          name="asset"
          label="Asset class"
          value={assetClass}
          placeholder="Any asset class"
          options={facets.assetClasses.map((value) => ({ value, label: value }))}
          onChange={(value) => navigate({ asset: value })}
        />
        <SelectField
          name="philosophy"
          label="Philosophy"
          value={philosophy}
          placeholder="Any philosophy"
          options={facets.philosophies.map((value) => ({ value, label: value }))}
          onChange={(value) => navigate({ philosophy: value })}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-emerald-600"
        >
          Apply search & filters
        </button>
        {query || risk || timeHorizon || assetClass || philosophy || sort !== "risk" ? (
          <button
            type="button"
            onClick={() => router.push("/strategies")}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-800 focus-visible:outline-2 focus-visible:outline-emerald-600"
          >
            Clear all
          </button>
        ) : null}
      </div>
    </form>
  );
}
