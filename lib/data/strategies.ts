/**
 * MIRROR — Marketing sample strategy data.
 *
 * This module contains TYPED sample (demo) strategy blueprints used only by
 * the public marketing website (Phase 5). It is intentionally separate from
 * production data: no database records are created for these.
 *
 * All strategies here are CONCEPTUAL and EDUCATIONAL. They are not attributed
 * to any real investor, are not live investment products, and any performance
 * figures are clearly labeled as illustrative/model/simulated. They are surfaced
 * to demonstrate the Strategy Blueprint UI and MIRROR's methodology-forward
 * presentation so that later phases can swap this typed data for the same-shaped
 * Prisma-backed records without a redesign.
 */

export type RiskProfile = "Conservative" | "Moderate" | "Aggressive";
export type TimeHorizon = "Long-Term" | "Medium-Term" | "Multi-Horizon";

export type AllocationLine = {
  assetClass: string;
  weight: number; // percent (0-100)
};

export interface DecisionEntry {
  period: string;
  decision: string;
  rationale: string;
}

export interface StrategyAllocation {
  caption: string;
  lines: AllocationLine[];
}

/** Performance is always illustrative/model — never a guarantee of future results. */
export interface IllustrativePerformance {
  label: "Illustrative model, not historical fact";
  horizon: string;
  annualisedReturn?: string;
  volatility?: string;
  maxDrawdown?: string;
  note: string;
}

export interface CreatorProfileData {
  name: string;
  verified: boolean;
  yearsOfExperience?: number;
  investmentPhilosophy?: string;
}

export interface StrategyUpdateEntry {
  id: string;
  type: "allocation" | "methodology" | "risk" | "outlook";
  title: string;
  summary: string;
  reasoning: string;
  /** Illustrative display date — not a real historical event. */
  dateLabel: string;
}

export interface StrategyBlueprintData {
  slug: string;
  name: string;
  category: string;
  tagline: string;
  thesis: string;
  objective: string;
  /** Short philosophy/discovery descriptor used for search and filtering. */
  philosophy: string;
  riskProfile: RiskProfile;
  timeHorizon: TimeHorizon;
  region: string;
  /** Discrete asset classes present in the target allocation (for filtering). */
  assetClasses: string[];
  methodology: string[];
  riskFramework: string[];
  allocation: StrategyAllocation;
  decisionHistory: DecisionEntry[];
  creator: CreatorProfileData;
  updates: StrategyUpdateEntry[];
  performance?: IllustrativePerformance;
  /** Marks the strategy as an educational/sample model, not a live product. */
  sample: true;
}

const COMPOUNDER: StrategyBlueprintData = {
  slug: "the-compounder",
  name: "The Compounder",
  category: "Long-Term",
  tagline: "Long-term diversified growth through patient ownership.",
  thesis:
    "Over long periods, patient ownership of high-quality, growing businesses has historically rewarded investors who avoid timing the market. The Compounder prioritises durable growth and retains winners rather than harvesting them.",
  objective:
    "Build diversified long-term growth with a bias toward high-quality companies and a tolerance for sustained volatility in exchange for higher expected growth.",
  philosophy: "Growth through patient ownership of high-quality businesses.",
  riskProfile: "Moderate",
  timeHorizon: "Long-Term",
  region: "Global",
  assetClasses: ["Global Equities", "International Equities", "Bonds", "Cash"],
  methodology: [
    "Prefer businesses with durable competitive advantages and reinvestment capacity.",
    "Base initial sizing on business quality and long-term expectations, not short-term sentiment.",
    "Hold through volatility; only adjust when the underlying thesis materially changes.",
    "Rebalance on a fixed cadence rather than reacting to daily price moves.",
  ],
  riskFramework: [
    "Concentration is managed: no single position is intended to dominate the portfolio.",
    "Volatility is expected and is not treated as a signal to exit.",
    "Relies on long time horizons; not suited to short-term liquidity needs.",
  ],
  allocation: {
    caption: "Illustrative target allocation to a broad global growth mix.",
    lines: [
      { assetClass: "Global Equities", weight: 70 },
      { assetClass: "International Equities", weight: 15 },
      { assetClass: "Investment-Grade Bonds", weight: 10 },
      { assetClass: "Cash", weight: 5 },
    ],
  },
  decisionHistory: [
    {
      period: "Illustrative entry",
      decision: "Established a core growth allocation",
      rationale: "Sized toward long-term ownership with a diversified global equity core.",
    },
    {
      period: "Illustrative rebalance",
      decision: "Trimmed to target weights",
      rationale: "Brought the allocation back to target after strong relative moves.",
    },
    {
      period: "Illustrative review",
      decision: "Maintained allocation",
      rationale: "Underlying thesis unchanged; no material rebalancing action taken.",
    },
  ],
  performance: {
    label: "Illustrative model, not historical fact",
    horizon: "3 years",
    annualisedReturn: "8–10% (illustrative assumption, not a promise)",
    volatility: "~15% annualised (illustrative)",
    maxDrawdown: "-25% to -35% in material adverse conditions (illustrative)",
    note: "Illustrative figures assume long-run equity-like variability and are shown for educational context only.",
  },
  creator: {
    name: "Sample Creator",
    verified: false,
    yearsOfExperience: 12,
    investmentPhilosophy: "Long-horizon, fundamental ownership of durable businesses.",
  },
  updates: [
    {
      id: "compound-1",
      type: "outlook",
      title: "Adjusted volatility expectation",
      summary: "Broadened the expected volatility range to reflect a longer holding horizon.",
      reasoning: "Education-first: clarifying that growth horizons carry sustained variability.",
      dateLabel: "Illustrative review 1",
    },
    {
      id: "compound-2",
      type: "allocation",
      title: "Rebalanced to target weights",
      summary: "Trimmed positions that had drifted and brought the mix back to target.",
      reasoning: "Target-based rebalancing rather than reacting to short-term price moves.",
      dateLabel: "Illustrative review 2",
    },
  ],
  sample: true,
};

const DEFENSIVE_CORE: StrategyBlueprintData = {
  slug: "the-defensive-core",
  name: "The Defensive Core",
  category: "Defensive",
  tagline: "Capital preservation and diversification as the foundation.",
  thesis:
    "A portfolio designed to preserve capital through diversification and lower-expected-volatility assets, prioritising resilience over growth in drawdowns.",
  objective:
    "Maintain capital and reduce drawdown severity while still participating modestly in market growth.",
  philosophy: "Capital preservation through diversification and lower-volatility assets.",
  riskProfile: "Conservative",
  timeHorizon: "Medium-Term",
  region: "Developed Markets",
  assetClasses: ["Bonds", "Global Equities", "Cash"],
  methodology: [
    "Anchor the portfolio in broadly diversified, lower-volatility assets.",
    "Keep equity exposure modest and well diversified.",
    "Rebalance toward targets to manage drift rather than forecast returns.",
    "Treat capital preservation as the primary objective.",
  ],
  riskFramework: [
    "Designed to reduce the severity and frequency of drawdowns.",
    "Bond duration and credit risk are monitored to avoid unintended interest-rate exposure.",
    "Expected returns are lower than a growth-oriented portfolio; that trade-off is intentional.",
  ],
  allocation: {
    caption: "Illustrative defensive target allocation.",
    lines: [
      { assetClass: "Investment-Grade Bonds", weight: 55 },
      { assetClass: "Global Equities", weight: 30 },
      { assetClass: "Cash", weight: 15 },
    ],
  },
  decisionHistory: [
    {
      period: "Illustrative entry",
      decision: "Established diversified defensive mix",
      rationale: "Prioritised lower volatility and capital preservation from the start.",
    },
    {
      period: "Illustrative rebalance",
      decision: "Rebalanced cash back to targets",
      rationale: "Restored target weights rather than attempting to time the market.",
    },
  ],
  performance: {
    label: "Illustrative model, not historical fact",
    horizon: "3 years",
    annualisedReturn: "Lower-expected-growth profile (illustrative)",
    volatility: "~7% annualised (illustrative)",
    maxDrawdown: "-8% to -12% in adverse conditions (illustrative)",
    note: "Illustrative figures assume noticeably lower variability than a growth-oriented portfolio and are shown for educational context only.",
  },
  creator: {
    name: "Sample Creator",
    verified: true,
    yearsOfExperience: 9,
    investmentPhilosophy: "Discipline through diversification as the foundation of resilience.",
  },
  updates: [
    {
      id: "defensive-1",
      type: "allocation",
      title: "Rebalanced cash back to target",
      summary: "Restored target weights after cash drifted above its band.",
      reasoning: "Target-based rebalancing, not market timing.",
      dateLabel: "Illustrative review 1",
    },
  ],
  sample: true,
};

const GLOBAL_ALLOCATOR: StrategyBlueprintData = {
  slug: "the-global-allocator",
  name: "The Global Allocator",
  category: "Multi-Asset",
  tagline: "Multi-asset, multi-region diversification across asset classes.",
  thesis:
    "Diversification across asset classes and regions is the only reliable way to spread risk. The Global Allocator deliberately avoids single-country and single-asset concentration.",
  objective:
    "Provide broad diversification across asset classes and geographies to reduce reliance on any single market outcome.",
  philosophy: "Broad multi-asset, multi-region diversification to spread risk.",
  riskProfile: "Moderate",
  timeHorizon: "Long-Term",
  region: "Global",
  assetClasses: ["Global Equities", "International Equities", "Bonds", "Alternatives", "Cash"],
  methodology: [
    "Combine equities, bonds, and alternatives so no single driver dominates.",
    "Spread equity exposure across multiple regions.",
    "Use target weights and periodic rebalancing to stay diversified.",
    "Prefer index-style diversification over concentrated active bets.",
  ],
  riskFramework: [
    "Concentration risk is the primary concern and is actively diversified away.",
    "Currency exposure is intentional and monitored.",
    "No reliance on forecasting any single market or region.",
  ],
  allocation: {
    caption: "Illustrative global multi-asset target allocation.",
    lines: [
      { assetClass: "Global Equities", weight: 45 },
      { assetClass: "International Equities", weight: 20 },
      { assetClass: "Bonds", weight: 25 },
      { assetClass: "Alternatives", weight: 5 },
      { assetClass: "Cash", weight: 5 },
    ],
  },
  decisionHistory: [
    {
      period: "Illustrative entry",
      decision: "Established global multi-asset mix",
      rationale: "Deliberately avoided any single-region or single-asset bet.",
    },
    {
      period: "Illustrative review",
      decision: "Maintained diversification",
      rationale: "All target bands within tolerance; no action required.",
    },
  ],
  performance: {
    label: "Illustrative model, not historical fact",
    horizon: "5 years",
    annualisedReturn: "Illustrative assumption shown for context only",
    volatility: "~11% annualised (illustrative)",
    maxDrawdown: "-18% to -25% in adverse conditions (illustrative)",
    note: "Illustrative figures assume moderate variability reflecting broad diversification; educational context only.",
  },
  creator: {
    name: "Sample Creator",
    verified: false,
    yearsOfExperience: 10,
    investmentPhilosophy: "Spread across many independent risks rather than concentrating bets.",
  },
  updates: [
    {
      id: "alloc-1",
      type: "risk",
      title: "Clarified currency exposure",
      summary: "Documented that currency exposure is intentional and monitored.",
      reasoning: "Transparency so that currency is a conscious choice, not an accident.",
      dateLabel: "Illustrative review 1",
    },
  ],
  sample: true,
};

const INCOME_FRAMEWORK: StrategyBlueprintData = {
  slug: "the-income-framework",
  name: "The Income Framework",
  category: "Income",
  tagline: "Income-oriented portfolio construction for steady distributions.",
  thesis:
    "A portfolio designed around generating a steady stream of income while managing the risks that income assets carry — credit, duration, and inflation.",
  objective:
    "Construct a portfolio with a clear income objective and disciplined risk management around income-producing assets.",
  philosophy:
    "Steady income generated with disciplined credit, duration, and inflation risk management.",
  riskProfile: "Conservative",
  timeHorizon: "Medium-Term",
  region: "Developed Markets",
  assetClasses: ["Corporate Bonds", "Government Bonds", "Dividend Equities", "Cash"],
  methodology: [
    "Allocate primarily to income-producing assets with diversified issuers.",
    "Balance yield against credit and duration risk.",
    "Monitor inflation risk on long-dated income streams.",
    "Reinvest or distribute according to a stated objective.",
  ],
  riskFramework: [
    "Higher yield typically implies higher credit risk; concentration is avoided.",
    "Duration is managed so rising rates do not erode the principal unexpectedly.",
    "Income is not guaranteed — distributions can vary.",
  ],
  allocation: {
    caption: "Illustrative income-oriented target allocation.",
    lines: [
      { assetClass: "Corporate Bonds", weight: 40 },
      { assetClass: "Government Bonds", weight: 30 },
      { assetClass: "Dividend Equities", weight: 20 },
      { assetClass: "Cash", weight: 10 },
    ],
  },
  decisionHistory: [
    {
      period: "Illustrative entry",
      decision: "Established income mix",
      rationale: "Prioritised a diversified income stream with managed risk.",
    },
    {
      period: "Illustrative review",
      decision: "Rebalanced toward targets",
      rationale: "Brought income assets back to their target weights.",
    },
  ],
  performance: {
    label: "Illustrative model, not historical fact",
    horizon: "3 years",
    annualisedReturn: "Moderate income-oriented profile (illustrative)",
    volatility: "~8% annualised (illustrative)",
    maxDrawdown: "-10% to -15% in adverse conditions (illustrative)",
    note: "Illustrative figures assume moderate variability; income and any figures shown are not guaranteed and are educational only.",
  },
  creator: {
    name: "Sample Creator",
    verified: true,
    yearsOfExperience: 15,
    investmentPhilosophy: "Yield is earned by taking managed credit, duration, and inflation risk.",
  },
  updates: [
    {
      id: "income-1",
      type: "methodology",
      title: "Documented duration management",
      summary: "Clarified how duration is managed against rising-rate risk.",
      reasoning: "Surfacing the trade-offs income assets carry rather than chasing yield.",
      dateLabel: "Illustrative review 1",
    },
  ],
  sample: true,
};

const GROWTH_FOCUS: StrategyBlueprintData = {
  slug: "growth-focus",
  name: "Growth Focus",
  category: "Growth",
  tagline: "Concentrated growth with high tolerance for sustained volatility.",
  thesis:
    "A smaller set of higher-growth businesses can compound value rapidly, but only for investors who accept materially larger drawdowns and prolonged underperformance. Growth Focus makes that risk explicit rather than hiding it.",
  objective:
    "Seek high long-term growth by concentrating in a limited number of high-potential holdings, accepting elevated volatility in exchange for higher expected growth.",
  philosophy: "Concentrated growth built on explicit acceptance of large drawdowns.",
  riskProfile: "Aggressive",
  timeHorizon: "Long-Term",
  region: "Global",
  assetClasses: ["Global Equities", "Emerging Equities", "Cash"],
  methodology: [
    "Limit the number of holdings so each idea is sized meaningfully.",
    "Prefer companies with large addressable markets and reinvestment capacity.",
    "Hold through deep drawdowns unless the core thesis breaks.",
    "Keep a small cash buffer to fund new ideas without forced sales.",
  ],
  riskFramework: [
    "Concentration is the primary risk and is intentional, not accidental.",
    "Large drawdowns are expected and are the price of growth.",
    "Ill-suited to investors needing liquidity or low volatility.",
  ],
  allocation: {
    caption: "Illustrative concentrated growth target allocation.",
    lines: [
      { assetClass: "Global Equities", weight: 65 },
      { assetClass: "Emerging Equities", weight: 25 },
      { assetClass: "Cash", weight: 10 },
    ],
  },
  decisionHistory: [
    {
      period: "Illustrative entry",
      decision: "Established a concentrated growth core",
      rationale: "Sized toward a small number of high-conviction growth holdings.",
    },
    {
      period: "Illustrative review",
      decision: "Held through volatility",
      rationale: "Underlying theses unchanged; no forced de-risking in drawdowns.",
    },
  ],
  performance: {
    label: "Illustrative model, not historical fact",
    horizon: "5 years",
    annualisedReturn: "Higher-growth profile with wide result band (illustrative)",
    volatility: "~20% annualised (illustrative)",
    maxDrawdown: "-40% to -50% in severe adverse conditions (illustrative)",
    note: "Illustrative figures assume high variability concentrated in a few names; educational context only. Not ranked on return alone — risk is prominently shown.",
  },
  creator: {
    name: "Sample Creator",
    verified: false,
    yearsOfExperience: 8,
    investmentPhilosophy:
      "Make concentration a conscious, disclosed choice rather than an accident.",
  },
  updates: [
    {
      id: "growth-1",
      type: "risk",
      title: "Disclosed drawdown expectation",
      summary: "Surface the large potential drawdowns this profile implies.",
      reasoning: "Education-first: risk clarity over return-luring presentation.",
      dateLabel: "Illustrative review 1",
    },
  ],
  sample: true,
};

const MULTI_HORIZON: StrategyBlueprintData = {
  slug: "multi-horizon-allocation",
  name: "Multi-Horizon Allocation",
  category: "Multi-Asset",
  tagline: "Segments capital by time horizon to match each goal's tolerance.",
  thesis:
    "Money with different time horizons can tolerate different risks. Multi-Horizon splits capital into layers — short, medium, and long — each sized to its own liquidity and tolerance needs, then diversifies each layer appropriately.",
  objective:
    "Align assets with distinct spending/goal horizons so risk matches the time available to recover from drawdowns.",
  philosophy: "Match risk to the time you have by layering capital by horizon.",
  riskProfile: "Moderate",
  timeHorizon: "Multi-Horizon",
  region: "Global",
  assetClasses: ["Bonds", "Global Equities", "International Equities", "Cash", "Alternatives"],
  methodology: [
    "Divide capital into short-, medium-, and long-horizon layers.",
    "Keep short-horizon money in lower-volatility assets.",
    "Allow long-horizon money a higher growth allocation.",
    "Rebalance within each layer rather than across the whole portfolio blindly.",
  ],
  riskFramework: [
    "A near-term liquidity need is never invested in volatile, growth-only assets.",
    "Each layer's volatility is matched to its own horizon.",
    "Overall drawdown risk is managed by construction, not by market timing.",
  ],
  allocation: {
    caption: "Illustrative horizon-layered target allocation.",
    lines: [
      { assetClass: "Cash", weight: 10 },
      { assetClass: "Bonds", weight: 30 },
      { assetClass: "Global Equities", weight: 40 },
      { assetClass: "International Equities", weight: 15 },
      { assetClass: "Alternatives", weight: 5 },
    ],
  },
  decisionHistory: [
    {
      period: "Illustrative entry",
      decision: "Established horizon layers",
      rationale: "Matched each layer's volatility to its spending horizon.",
    },
    {
      period: "Illustrative review",
      decision: "Refreshed short-horizon layer",
      rationale: "Replenished near-term liquidity from maturing assets.",
    },
  ],
  performance: {
    label: "Illustrative model, not historical fact",
    horizon: "5 years",
    annualisedReturn: "Blended profile across horizons (illustrative)",
    volatility: "~10% annualised (illustrative)",
    maxDrawdown: "-15% to -20% in adverse conditions (illustrative)",
    note: "Illustrative figures reflect a blended, horizon-layered profile; educational context only.",
  },
  creator: {
    name: "Sample Creator",
    verified: true,
    yearsOfExperience: 11,
    investmentPhilosophy:
      "Structure first — let each asset's risk match its purpose before seeking return.",
  },
  updates: [
    {
      id: "multi-1",
      type: "methodology",
      title: "Documented horizon layering",
      summary: "Clarified how capital is segmented by time horizon.",
      reasoning: "Transparency about the construction logic, not just the allocation.",
      dateLabel: "Illustrative review 1",
    },
  ],
  sample: true,
};

export const sampleStrategies: StrategyBlueprintData[] = [
  COMPOUNDER,
  DEFENSIVE_CORE,
  GLOBAL_ALLOCATOR,
  INCOME_FRAMEWORK,
  GROWTH_FOCUS,
  MULTI_HORIZON,
];

export function getStrategyBySlug(slug: string): StrategyBlueprintData | undefined {
  return sampleStrategies.find((s) => s.slug === slug);
}

export const strategyCategories = [
  "Long-Term",
  "Diversified",
  "Income",
  "Growth",
  "Macro",
  "Defensive",
  "Alternative",
  "Multi-Asset",
];

export const riskProfilesList: RiskProfile[] = ["Conservative", "Moderate", "Aggressive"];

export const timeHorizonsList: TimeHorizon[] = ["Long-Term", "Medium-Term", "Multi-Horizon"];

// ============================================================================
// DISCOVERY (Phase 7)
// ============================================================================

export const RISK_ORDER: Record<RiskProfile, number> = {
  Conservative: 0,
  Moderate: 1,
  Aggressive: 2,
};

export type StrategySort = "risk" | "name" | "updated";

export interface StrategyDiscoverFilters {
  query?: string;
  risk?: RiskProfile;
  timeHorizon?: TimeHorizon;
  assetClass?: string;
  philosophy?: string;
}

/** Derived facet values for the discovery filters (driven by the sample data). */
export function getDiscoveryFacets() {
  const assetClasses = Array.from(new Set(sampleStrategies.flatMap((s) => s.assetClasses))).sort(
    (a, b) => a.localeCompare(b)
  );
  const philosophies = Array.from(new Set(sampleStrategies.map((s) => s.philosophy))).sort((a, b) =>
    a.localeCompare(b)
  );
  return {
    assetClasses,
    philosophies,
    riskProfiles: riskProfilesList,
    timeHorizons: timeHorizonsList,
  };
}

/** Filter sample strategies by free-text search and facet selections. */
export function filterStrategies(
  strategies: StrategyBlueprintData[],
  filters: StrategyDiscoverFilters
): StrategyBlueprintData[] {
  const query = filters.query?.trim().toLowerCase();

  return strategies.filter((s) => {
    if (filters.risk && s.riskProfile !== filters.risk) return false;
    if (filters.timeHorizon && s.timeHorizon !== filters.timeHorizon) return false;
    if (filters.assetClass && !s.assetClasses.includes(filters.assetClass)) return false;
    if (filters.philosophy && s.philosophy !== filters.philosophy) return false;
    if (query) {
      const haystack = [s.name, s.tagline, s.thesis, s.objective, s.philosophy, ...s.assetClasses]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

/**
 * Sort strategies in a way that never ranks by return alone.
 * Risk is always the most prominent axis; name/updated are neutral axes.
 */
export function sortStrategies(
  strategies: StrategyBlueprintData[],
  sort: StrategySort
): StrategyBlueprintData[] {
  const sorted = [...strategies];
  if (sort === "name") {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === "updated") {
    sorted.sort((a, b) => b.updates.length - a.updates.length);
  } else {
    sorted.sort((a, b) => RISK_ORDER[a.riskProfile] - RISK_ORDER[b.riskProfile]);
  }
  return sorted;
}
