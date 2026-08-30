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
  annualisedReturn?: string;
  volatilityNote: string;
}

export interface StrategyBlueprintData {
  slug: string;
  name: string;
  category: string;
  tagline: string;
  thesis: string;
  objective: string;
  riskProfile: RiskProfile;
  timeHorizon: TimeHorizon;
  region: string;
  methodology: string[];
  riskFramework: string[];
  allocation: StrategyAllocation;
  decisionHistory: DecisionEntry[];
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
  riskProfile: "Moderate",
  timeHorizon: "Long-Term",
  region: "Global",
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
    annualisedReturn: "8–10% (illustrative assumption, not a promise)",
    volatilityNote:
      "Illustrative figures assume long-run equity-like variability and are shown for educational context only.",
  },
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
  riskProfile: "Conservative",
  timeHorizon: "Medium-Term",
  region: "Developed Markets",
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
    volatilityNote:
      "Illustrative figures assume noticeably lower variability than a growth-oriented portfolio and are shown for educational context only.",
  },
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
  riskProfile: "Moderate",
  timeHorizon: "Long-Term",
  region: "Global",
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
    annualisedReturn: "Illustrative assumption shown for context only",
    volatilityNote:
      "Illustrative figures assume moderate variability reflecting broad diversification; educational context only.",
  },
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
  riskProfile: "Conservative",
  timeHorizon: "Medium-Term",
  region: "Developed Markets",
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
    volatilityNote:
      "Illustrative figures assume moderate variability; income and any figures shown are not guaranteed and are educational only.",
  },
  sample: true,
};

export const sampleStrategies: StrategyBlueprintData[] = [
  COMPOUNDER,
  DEFENSIVE_CORE,
  GLOBAL_ALLOCATOR,
  INCOME_FRAMEWORK,
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
