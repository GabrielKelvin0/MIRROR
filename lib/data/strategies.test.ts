import { describe, expect, it } from "vitest";
import {
  filterStrategies,
  getDiscoveryFacets,
  sampleStrategies,
  sortStrategies,
} from "./strategies";

describe("strategy discovery", () => {
  it("derives facets from the sample data", () => {
    const facets = getDiscoveryFacets();
    expect(facets.riskProfiles).toEqual(["Conservative", "Moderate", "Aggressive"]);
    expect(facets.timeHorizons).toContain("Multi-Horizon");
    expect(facets.assetClasses).toContain("Bonds");
    expect(facets.philosophies).toHaveLength(sampleStrategies.length);
  });

  it("filters by risk profile", () => {
    const result = filterStrategies(sampleStrategies, { risk: "Aggressive" });
    expect(result.map((s) => s.riskProfile).every((r) => r === "Aggressive")).toBe(true);
    expect(result.some((s) => s.slug === "growth-focus")).toBe(true);
  });

  it("filters by time horizon", () => {
    const result = filterStrategies(sampleStrategies, { timeHorizon: "Multi-Horizon" });
    expect(result.map((s) => s.slug)).toEqual(["multi-horizon-allocation"]);
  });

  it("filters by asset class", () => {
    const result = filterStrategies(sampleStrategies, { assetClass: "Emerging Equities" });
    expect(result.map((s) => s.slug)).toEqual(["growth-focus"]);
  });

  it("filters by philosophy", () => {
    const result = filterStrategies(sampleStrategies, {
      philosophy: "Capital preservation through diversification and lower-volatility assets.",
    });
    expect(result.map((s) => s.slug)).toEqual(["the-defensive-core"]);
  });

  it("searches across thesis, name, and philosophy", () => {
    const byTerm = filterStrategies(sampleStrategies, { query: "Growth Focus" });
    expect(byTerm.some((s) => s.slug === "growth-focus")).toBe(true);
    const byPhilosophy = filterStrategies(sampleStrategies, { query: "capital preservation" });
    expect(byPhilosophy.some((s) => s.slug === "the-defensive-core")).toBe(true);
  });

  it("combines multiple filters", () => {
    const result = filterStrategies(sampleStrategies, {
      risk: "Conservative",
      timeHorizon: "Medium-Term",
      assetClass: "Bonds",
    });
    expect(result.every((s) => s.riskProfile === "Conservative")).toBe(true);
    expect(result.every((s) => s.timeHorizon === "Medium-Term")).toBe(true);
  });

  it("returns an empty list when nothing matches", () => {
    const result = filterStrategies(sampleStrategies, {
      risk: "Aggressive",
      timeHorizon: "Multi-Horizon",
    });
    expect(result).toHaveLength(0);
  });

  it("sorts by risk profile (low to high) — never by return", () => {
    const order = ["Conservative", "Moderate", "Aggressive"];
    const result = sortStrategies(sampleStrategies, "risk");
    const riskIndexes = result.map((s) => order.indexOf(s.riskProfile));
    for (let i = 1; i < riskIndexes.length; i += 1) {
      const current = riskIndexes[i] ?? 0;
      const previous = riskIndexes[i - 1] ?? 0;
      expect(current).toBeGreaterThanOrEqual(previous);
    }
  });

  it("sorts by name alphabetically", () => {
    const result = sortStrategies(sampleStrategies, "name");
    const names = result.map((s) => s.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  it("sorts by most updates", () => {
    const result = sortStrategies(sampleStrategies, "updated");
    const counts = result.map((s) => s.updates.length);
    for (let i = 1; i < counts.length; i += 1) {
      const current = counts[i] ?? 0;
      const previous = counts[i - 1] ?? 0;
      expect(current).toBeLessThanOrEqual(previous);
    }
  });

  it("does not mutate the input array when sorting", () => {
    const before = sampleStrategies.map((s) => s.slug);
    sortStrategies(sampleStrategies, "name");
    const after = sampleStrategies.map((s) => s.slug);
    expect(after).toEqual(before);
  });
});
