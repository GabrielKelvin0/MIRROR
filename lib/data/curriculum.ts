/**
 * MIRROR — Academy sample curriculum (Phase 10).
 *
 * This module contains TYPED sample (demo) courses and lessons used by the
 * learner Academy. It is intentionally separate from production data: no
 * database records are created for these inside `lib/data` — they are shaped
 * to mirror the Prisma `Course`/`Lesson` models (slug, title, description,
 * level, order, lesson content) so a later phase can swap this typed data for
 * the same-shaped Prisma-backed records without a redesign.
 *
 * Everything here is educational content only. It is not personalized advice,
 * not a guarantee of any outcome, and never investment guidance tailored to an
 * individual.
 */

export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export type ContentBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; title?: string; items: string[] }
  | { type: "callout"; label: string; text: string };

export interface LessonSample {
  slug: string;
  title: string;
  order: number;
  estimatedMinutes: number;
  contentBlocks: ContentBlock[];
}

export interface CourseSample {
  slug: string;
  title: string;
  description: string;
  level: CourseLevel;
  order: number;
  lessons: LessonSample[];
}

export const CURRICULUM: CourseSample[] = [
  /* ------------------------------------------------------------------ */
  /* BEGINNER                                                            */
  /* ------------------------------------------------------------------ */
  {
    slug: "investing-basics",
    title: "Investing Basics",
    description: "What investing is, why it matters, and how markets work.",
    level: "BEGINNER",
    order: 1,
    lessons: [
      {
        slug: "what-is-investing",
        title: "What is investing?",
        order: 1,
        estimatedMinutes: 4,
        contentBlocks: [
          { type: "paragraph", text: "Investing means committing money today in the hope of more money tomorrow. A share of a company or a fund represents a real claim on an underlying business or basket of assets." },
          { type: "paragraph", text: "Unlike saving, investing involves uncertainty: the value can go down as well as up. The possible reward for bearing that uncertainty over time is called the risk premium." },
          { type: "list", title: "Key ideas on this page:", items: ["Money today is worth more than the same money later (time value of money)", "Investors are compensated with expected returns for bearing risk", "Investing is a long-term activity — not a guessing game"] },
          { type: "callout", label: "Important", text: "MIRROR is for education. Nothing on this platform is financial advice to you personally, and no return is ever guaranteed." },
        ],
      },
      {
        slug: "why-people-invest",
        title: "Why people invest",
        order: 2,
        estimatedMinutes: 4,
        contentBlocks: [
          { type: "paragraph", text: "Most people invest to grow purchasing power over time, to fund a goal like retirement, or to build wealth that works as income later. The goal first: define your objective before thinking about any product." },
          { type: "list", items: ["Beat inflation over the long run", "Reach a measurable financial goal", "Turn savings into an income stream over decades"] },
          { type: "paragraph", text: "A clear goal helps you choose how long you can wait, how much risk you can take, and whether you need income or growth." },
        ],
      },
      {
        slug: "how-markets-work",
        title: "How markets work",
        order: 3,
        estimatedMinutes: 5,
        contentBlocks: [
          { type: "paragraph", text: "A market is simply a place where buyers and sellers agree on prices. Each trade reflects a transaction price that balances what someone will pay and what someone else will sell for." },
          { type: "paragraph", text: "Prices move as new information arrives and as supply and demand shift. Over short horizons markets are noisy; over long ones, the earnings and growth of the businesses you own tend to matter far more." },
          { type: "callout", label: "Perspective", text: "Short-term price noise says little about a business's long-term value. Patience is a feature, not a bug." },
        ],
      },
    ],
  },
  {
    slug: "stocks-vs-etfs",
    title: "Stocks vs ETFs",
    description: "Ownership, diversification, costs, and when each makes sense.",
    level: "BEGINNER",
    order: 2,
    lessons: [
      {
        slug: "single-stocks",
        title: "Owning a single stock",
        order: 1,
        estimatedMinutes: 4,
        contentBlocks: [
          { type: "paragraph", text: "A single share of stock is a fractional ownership claim on one company. If the company does well, profits may grow and the share may rise; if it struggles, the value can fall sharply." },
          { type: "paragraph", text: "Concentrating in one name concentrates the risk with it: one bad quarter, a competitor, or an industry shift can move your whole holding." },
        ],
      },
      {
        slug: "what-is-an-etf",
        title: "What is an ETF?",
        order: 2,
        estimatedMinutes: 4,
        contentBlocks: [
          { type: "paragraph", text: "An exchange-traded fund (ETF) is a pot of many securities bought as a single item on an exchange. One ETF share gives you tiny exposure to every holding inside the fund." },
          { type: "list", title: "Typical benefits compared with trading many single stocks:", items: ["Immediate diversification across many names", "Lower cost to build a broad portfolio", "Transparent rules or an index to compare against"] },
        ],
      },
      {
        slug: "choosing-between-them",
        title: "Choosing between them",
        order: 3,
        estimatedMinutes: 5,
        contentBlocks: [
          { type: "paragraph", text: "ETFs are usually the efficient starting point: broad exposure with little effort. Single stocks are for sleeves of a portfolio where you have a researched view and accept the concentration." },
          { type: "list", items: ["Predominantly an education-first beginner? Bias toward broad funds", "Adding a specific thesis? Treat it as a small, held position", "Keep costs, effort, and emotions in mind — the simpler engine wins over decades"] },
        ],
      },
    ],
  },
  {
    slug: "diversification",
    title: "Diversification",
    description: "Spreading risk sensibly across different holdings.",
    level: "BEGINNER",
    order: 3,
    lessons: [
      {
        slug: "why-diversify",
        title: "Why diversify",
        order: 1,
        estimatedMinutes: 4,
        contentBlocks: [
          { type: "paragraph", text: "Diversification means holding many investments that behave differently, so no single failure destroys your plan. It is the closest thing investing has to a free lunch." },
          { type: "paragraph", text: "It reduces the damage of any one business or sector disappointing you — while still letting growth carry the portfolio as a whole." },
        ],
      },
      {
        slug: "correlation-intro",
        title: "Correlation, in plain terms",
        order: 2,
        estimatedMinutes: 4,
        contentBlocks: [
          { type: "paragraph", text: "Correlation measures how much two holdings move together. If everything you own falls at the same time for the same reason, you are not actually diversified — you own the same bet many times." },
          { type: "list", items: ["High correlation = little diversification benefit", "Different sectors, geographies and asset types behave differently", "Perfect hedging reduces expected return too — balance is the goal"] },
        ],
      },
      {
        slug: "enough-diversification",
        title: "How much is enough?",
        order: 3,
        estimatedMinutes: 4,
        contentBlocks: [
          { type: "paragraph", text: "There is no magic number, but a broad index fund already holds thousands of companies. Adding more individual names beyond a handful tends to add little protection." },
          { type: "callout", label: "Guidance", text: "Maximum diversification with minimal effort usually means owning a few broad, low-cost funds that cover different parts of the market." },
        ],
      },
    ],
  },
  {
    slug: "understanding-risk",
    title: "Understanding Risk",
    description: "The kinds of risk you actually face, and how they differ from fear.",
    level: "BEGINNER",
    order: 4,
    lessons: [
      {
        slug: "what-risk-means",
        title: "What 'risk' means here",
        order: 1,
        estimatedMinutes: 4,
        contentBlocks: [
          { type: "paragraph", text: "In investing, risk is the chance that outcomes differ from expectations — usually the chance you lose money or fall short of a goal. Volatility (how wildly prices swing) is the visible symptom, risk is deeper." },
          { type: "paragraph", text: "Tail risk — rare but severe drops — matters more than everyday wobble when deciding how much you can withstand." },
        ],
      },
      {
        slug: "types-of-risk",
        title: "Types of risk",
        order: 2,
        estimatedMinutes: 5,
        contentBlocks: [
          { type: "list", title: "A useful map:", items: ["Market risk — the whole market falling", "Concentration risk — too much in one thing", "Inflation risk — money losing purchasing power", "Interest-rate risk — bonds and rates moving against you", "Behavioural risk — acting on panic or greed"] },
          { type: "paragraph", text: "You cannot eliminate market risk, but you can manage concentration, inflation, duration, and your own behaviour." },
        ],
      },
      {
        slug: "risk-tolerance",
        title: "Your risk tolerance",
        order: 3,
        estimatedMinutes: 4,
        contentBlocks: [
          { type: "paragraph", text: "Risk tolerance is how much short-term pain you can take without abandoning your plan. It is a blend of your time horizon, your goals, and — honestly — your temperament." },
          { type: "callout", label: "Key test", text: "If a 30% temporary drop would make you sell everything, your portfolio is riskier than your tolerance." },
        ],
      },
    ],
  },
  {
    slug: "compound-growth",
    title: "Compound Growth",
    description: "Why time and reinvested returns make small early sums grow large.",
    level: "BEGINNER",
    order: 5,
    lessons: [
      {
        slug: "what-compounding-is",
        title: "What compounding is",
        order: 1,
        estimatedMinutes: 4,
        contentBlocks: [
          { type: "paragraph", text: "Compounding happens when your returns earn returns. $100 growing 10% becomes $110, and 10% the next year gives you $11 — the interest earned interest." },
          { type: "paragraph", text: "This is arithmetic, not magic: growth accelerates only because earnings are reinvested on a larger base each period." },
        ],
      },
      {
        slug: "time-is-the-lever",
        title: "Time is the biggest lever",
        order: 2,
        estimatedMinutes: 5,
        contentBlocks: [
          { type: "paragraph", text: "Start early and you can invest an order of magnitude less for the same outcome, because compounding has more years to work. The later you start, the more you must save to catch up." },
          { type: "callout", label: "Illustration", text: "A hypothetical 7% annualised return roughly doubles money every 10 years. This is an illustration — never a guarantee." },
        ],
      },
      {
        slug: "rule-of-72",
        title: "The rule of 72",
        order: 3,
        estimatedMinutes: 3,
        contentBlocks: [
          { type: "paragraph", text: "Divide 72 by a growth rate to approximate how many years it takes to double. At 6%, about 12 years; at 9%, about 8 years." },
          { type: "paragraph", text: "Use it as a thinking tool to compare rates quickly — treat it as an approximation, not a precise forecast." },
        ],
      },
    ],
  },
  {
    slug: "portfolio-construction",
    title: "Portfolio Construction",
    description: "Putting the pieces together into one coherent mix.",
    level: "BEGINNER",
    order: 6,
    lessons: [
      {
        slug: "asset-allocation-first",
        title: "Allocation before picking",
        order: 1,
        estimatedMinutes: 5,
        contentBlocks: [
          { type: "paragraph", text: "Your asset allocation — how much in growth assets versus defensive ones — drives most of your portfolio's behaviour. Product selection matters far less than the mixing decision." },
          { type: "paragraph", text: "Decide the target percentages first, then fill each bucket with cost-effective holdings." },
        ],
      },
      {
        slug: "building-blocks",
        title: "The building blocks",
        order: 2,
        estimatedMinutes: 5,
        contentBlocks: [
          { type: "list", title: "Common buckets:", items: ["Stocks — growth engines, higher expected variance", "Bonds — income and ballast that cushion drawdowns", "Cash — stability and dry powder", "Alternatives — optional, often non-correlated sleeves"] },
          { type: "paragraph", text: "Each bucket plays a role. A portfolio is the sum of roles working together, not a collection of best guesses." },
        ],
      },
      {
        slug: "rebalancing-intro",
        title: "Rebalancing, briefly",
        order: 3,
        estimatedMinutes: 4,
        contentBlocks: [
          { type: "paragraph", text: "Over time winners grow beyond your target percentages. Rebalancing sells a little of what grew and buys what lagged, pulling the mix back to target." },
          { type: "paragraph", text: "It enforces discipline: you automatically buy discipline when things fall and trim enthusiasm when things run hot." },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* INTERMEDIATE                                                        */
  /* ------------------------------------------------------------------ */
  {
    slug: "fundamental-analysis",
    title: "Fundamental Analysis",
    description: "Studying a business itself, not just its price chart.",
    level: "INTERMEDIATE",
    order: 1,
    lessons: [
      {
        slug: "business-quality",
        title: "Business quality comes first",
        order: 1,
        estimatedMinutes: 5,
        contentBlocks: [
          { type: "paragraph", text: "Fundamental analysis asks one question first: is this a good business? Good businesses earn more than the cost of their capital, year after year, and demand for what they sell is durable." },
          { type: "paragraph", text: "Price tells you the crowd's opinion; fundamentals tell you the thing being priced." },
        ],
      },
      {
        slug: "economic-moats",
        title: "Economic moats",
        order: 2,
        estimatedMinutes: 5,
        contentBlocks: [
          { type: "paragraph", text: "A moat is a durable advantage competitors struggle to copy: a trusted brand, high switching costs, a network effect, cost advantages, or real barriers to entry." },
          { type: "paragraph", text: "The moat's quality and longevity determine how much of the industry's future profit this business can keep." },
        ],
      },
      {
        slug: "earnings-drivers",
        title: "What drives earnings",
        order: 3,
        estimatedMinutes: 4,
        contentBlocks: [
          { type: "paragraph", text: "Earnings grow when revenue grows, margins widen, or capital compounds more productively. Study the drivers — customers, pricing power, costs — not just the headline number." },
          { type: "callout", label: "Habit", text: "A company is a machine that converts capital into cash. Analyse the machine's inputs, parts, and waste — not only its output dial." },
        ],
      },
    ],
  },
  {
    slug: "valuation-fundamentals",
    title: "Valuation Fundamentals",
    description: "What price is fair, and why every number depends on assumptions.",
    level: "INTERMEDIATE",
    order: 2,
    lessons: [
      {
        slug: "what-valuation-is",
        title: "What valuation is",
        order: 1,
        estimatedMinutes: 4,
        contentBlocks: [
          { type: "paragraph", text: "Valuation is the process of estimating what an asset is worth. Buying below a defensible estimate gives margin of safety; buying above it means you are paying for hopes, not facts." },
          { type: "paragraph", text: "Because it is an estimate, uncertainty is built in. Humility about your own numbers is part of the discipline." },
        ],
      },
      {
        slug: "relative-vs-intrinsic",
        title: "Relative vs intrinsic",
        order: 2,
        estimatedMinutes: 5,
        contentBlocks: [
          { type: "paragraph", text: "Relative valuation compares to peers or history: 'the sector trades at 15× earnings'. Intrinsic valuation discounts the cash flows the business itself is expected to produce." },
          { type: "paragraph", text: "Relative numbers are fast screens; intrinsic estimates are the deeper test. Neither is correct by itself." },
        ],
      },
      {
        slug: "margin-of-safety",
        title: "Margin of safety",
        order: 3,
        estimatedMinutes: 4,
        contentBlocks: [
          { type: "paragraph", text: "Margin of safety is the buffer between your estimate of value and the price you pay. The wider the buffer, the fewer perfect forecasts you need to be right." },
          { type: "callout", label: "Why it matters", text: "You can be wrong in your assumptions and still come out fine if you bought with room for error." },
        ],
      },
    ],
  },
  {
    slug: "financial-ratios",
    title: "Key Financial Ratios",
    description: "A working vocabulary of the numbers used to compare businesses.",
    level: "INTERMEDIATE",
    order: 3,
    lessons: [
      {
        slug: "profitability-ratios",
        title: "Profitability ratios",
        order: 1,
        estimatedMinutes: 5,
        contentBlocks: [
          { type: "list", title: "Words you will keep meeting:", items: ["Gross margin — what's left after direct costs", "Operating margin — profit after running the business", "Net margin — profit after everything", "ROE — return on shareholder equity, a compounding quality signal"] },
          { type: "paragraph", text: "Ratios only make sense next to a benchmark: the same company over years, or comparable peers in the same industry." },
        ],
      },
      {
        slug: "market-ratios",
        title: "Market multiples",
        order: 2,
        estimatedMinutes: 5,
        contentBlocks: [
          { type: "paragraph", text: "The best-known multiple is price-to-earnings: how many years of current earnings the share price represents. Lower is cheaper only if the future is equally good." },
          { type: "list", items: ["P/E — price ÷ earnings", "P/B — price ÷ book value", "P/S — price ÷ sales, useful when earnings are absent"] },
        ],
      },
      {
        slug: "health-and-debt",
        title: "Health and debt",
        order: 3,
        estimatedMinutes: 4,
        contentBlocks: [
          { type: "paragraph", text: "Debt magnifies returns in good times and risk in bad ones. Look at how debt compares to equity and to cash flow, and whether obligations are comfortably covered." },
          { type: "callout", label: "Balance", text: "A wonderful business with liabilities it cannot service in a downturn is a fragile business." },
        ],
      },
    ],
  },
  {
    slug: "dcf-concepts",
    title: "DCF Concepts",
    description: "Discounting future cash — the idea at the heart of intrinsic value.",
    level: "INTERMEDIATE",
    order: 4,
    lessons: [
      {
        slug: "discounting-idea",
        title: "The core idea: discounting",
        order: 1,
        estimatedMinutes: 5,
        contentBlocks: [
          { type: "paragraph", text: "A dollar next year is worth less than a dollar today, because today's dollar can grow in the meantime. Discounting shrinks future cash flows to today's terms using a discount rate." },
          { type: "paragraph", text: "Discounting is not optional decoration — it is the arithmetic consequence of time." },
        ],
      },
      {
        slug: "dcf-mechanics",
        title: "DCF mechanics",
        order: 2,
        estimatedMinutes: 6,
        contentBlocks: [
          { type: "paragraph", text: "Discounted cash flow (DCF) builds a forecast of free cash flows, discounts each year back to the present, and adds a terminal value for everything after the forecast window." },
          { type: "list", title: "Typical steps:", items: ["Project free cash flow for a horizon", "Choose a sensible discount rate reflecting risk", "Estimate a terminal value honestly", "Sum the present values and compare with price"] },
        ],
      },
      {
        slug: "dcf-limits",
        title: "DCF limitations",
        order: 3,
        estimatedMinutes: 4,
        contentBlocks: [
          { type: "paragraph", text: "Small changes in growth or discount rate swing the result dramatically. The model is a structured way to think, not a source of precision." },
          { type: "callout", label: "Honest use", text: "Show your assumptions, stress them, and notice when the price only works if everything goes right." },
        ],
      },
    ],
  },
  {
    slug: "research-and-sources",
    title: "Research & Sources",
    description: "Where information comes from and how to keep your thinking honest.",
    level: "INTERMEDIATE",
    order: 5,
    lessons: [
      {
        slug: "primary-vs-secondary",
        title: "Primary vs secondary sources",
        order: 1,
        estimatedMinutes: 4,
        contentBlocks: [
          { type: "paragraph", text: "Primary sources are the company's own filings, results and regulatory documents. Secondary sources are journalists and analysts interpreting those filings." },
          { type: "paragraph", text: "Build your core view from primary sources, then use others to stress-test it — not the other way around." },
        ],
      },
      {
        slug: "information-hygiene",
        title: "Information hygiene",
        order: 2,
        estimatedMinutes: 4,
        contentBlocks: [
          { type: "paragraph", text: "Reject data that is out of date, unverifiable, or conveniently only positive. Check who paid for the analysis and where it was published." },
          { type: "list", items: ["Prefer filings and audited figures over headlines", "Opinion is not evidence — label it as opinion", "Disagreement with your view is a feature to examine"] },
        ],
      },
      {
        slug: "record-your-thinking",
        title: "Record your reasoning",
        order: 3,
        estimatedMinutes: 3,
        contentBlocks: [
          { type: "paragraph", text: "Write down why you hold a view and what would change it. A written thesis makes you confront weak assumptions and learn from hindsight." },
          { type: "callout", label: "Habit", text: "Journal the decision and the stakes before the outcome, not after. That is how research becomes learning." },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* ADVANCED                                                            */
  /* ------------------------------------------------------------------ */
  {
    slug: "macro-analysis",
    title: "Macro Analysis",
    description: "Interest rates, inflation, and how the big picture reaches your holdings.",
    level: "ADVANCED",
    order: 1,
    lessons: [
      {
        slug: "rates-and-valuation",
        title: "Rates are the tide",
        order: 1,
        estimatedMinutes: 5,
        contentBlocks: [
          { type: "paragraph", text: "Interest rates flow into every discount rate and every cost of capital. When rates rise, the present value of long-dated future cash falls, which is why growth assets are sensitive to them." },
          { type: "paragraph", text: "Macro work is not about predicting the next rate move — it is about knowing which of your holdings breaks if the tide changes." },
        ],
      },
      {
        slug: "inflation-channels",
        title: "Inflation channels",
        order: 2,
        estimatedMinutes: 5,
        contentBlocks: [
          { type: "paragraph", text: "Inflation erodes the purchasing power of cash and fixed payments, while businesses with pricing power can pass cost increases through and protect real earnings." },
          { type: "paragraph", text: "Different assets respond differently to inflation surprise. Structure matters more than guessing the CPI print." },
        ],
      },
      {
        slug: "economic-cycle",
        title: "The economic cycle",
        order: 3,
        estimatedMinutes: 4,
        contentBlocks: [
          { type: "paragraph", text: "Economies expand, peak, contract and recover. No two cycles are identical, but the pattern sharpens questions about margins, defaults and demand." },
          { type: "callout", label: "Reality check", text: "Cycles are recognisable in hindsight and muddy live. Position for a range of plausible paths rather than one confident timeline." },
        ],
      },
    ],
  },
  {
    slug: "factor-investing",
    title: "Factor Investing",
    description: "Systematic style exposures and why they are not free money.",
    level: "ADVANCED",
    order: 2,
    lessons: [
      {
        slug: "what-factors-are",
        title: "What factors are",
        order: 1,
        estimatedMinutes: 4,
        contentBlocks: [
          { type: "paragraph", text: "A factor is a family of stocks sharing a risk or behavioural characteristic — value, size, quality, momentum, low volatility." },
          { type: "paragraph", text: "Factors earn their historical premia over long periods, but each has multi-year stretches of underperformance. Premia are compensation for risk or behaviour, not arbitrage." },
        ],
      },
      {
        slug: "common-factors",
        title: "The classic factors",
        order: 2,
        estimatedMinutes: 5,
        contentBlocks: [
          { type: "list", title: "The short list:", items: ["Value — cheap relative to fundamentals", "Quality — profitable, stable, low debt", "Size — smaller companies historically paid more", "Low volatility — muted swings, muted drawdowns", "Momentum — trends that persist a while"] },
          { type: "paragraph", text: "Most 'smart beta' products are packaged factor exposures with fees attached. Compare what you might pay for a rule you could follow with a plain index." },
        ],
      },
      {
        slug: "factor-discipline",
        title: "Factor discipline",
        order: 3,
        estimatedMinutes: 4,
        contentBlocks: [
          { type: "paragraph", text: "Factor strategies demand sticking to the rule precisely when the factor is most hated. That is both the source of the premium and the reason most investors stop early." },
          { type: "callout", label: "Honest framing", text: "Loading on factors is a decision to carry specific risks with the expectation of a long-run premium — not a promise." },
        ],
      },
    ],
  },
  {
    slug: "scenario-analysis",
    title: "Scenario Analysis",
    description: "Envisioning several futures and checking your plan against each.",
    level: "ADVANCED",
    order: 3,
    lessons: [
      {
        slug: "why-scenarios",
        title: "Why scenarios, not single forecasts",
        order: 1,
        estimatedMinutes: 4,
        contentBlocks: [
          { type: "paragraph", text: "Single forecasts feel certain and are usually wrong. Scenarios map a range: what if the optimistic, base, and pessimistic worlds each happen?" },
          { type: "paragraph", text: "The discipline is not predicting which path wins — it is discovering that your plan can survive several of them." },
        ],
      },
      {
        slug: "building-scenarios",
        title: "Building useful scenarios",
        order: 2,
        estimatedMinutes: 5,
        contentBlocks: [
          { type: "list", title: "A practical split:", items: ["Base case — the reasonable centre of your assumptions", "Bull case — growth exceeds expectations", "Bear case — key inputs break (demand, margins, rates)", "Stress case — the rare severe event that still must not ruin you"] },
          { type: "paragraph", text: "Assign a rough likelihood only if it improves decisions; sometimes the value is simply in knowing the edges." },
        ],
      },
      {
        slug: "using-results",
        title: "Turning scenarios into decisions",
        order: 3,
        estimatedMinutes: 4,
        contentBlocks: [
          { type: "paragraph", text: "For each scenario, ask what happens to your portfolio and whether you can still meet your goal. If the bear case breaks the plan, the portfolio is wrong — adjust before the bear arrives." },
          { type: "callout", label: "Output", text: "Scenarios exist to reveal the decisions you should make today while options are open." },
        ],
      },
    ],
  },
  {
    slug: "risk-management",
    title: "Risk Management",
    description: "Position sizing, drawdowns, and surviving to keep learning.",
    level: "ADVANCED",
    order: 4,
    lessons: [
      {
        slug: "position-sizing",
        title: "Position sizing",
        order: 1,
        estimatedMinutes: 5,
        contentBlocks: [
          { type: "paragraph", text: "How much you own matters more than what you own. A position is measured by what it could cost you, not by how exciting it is." },
          { type: "list", items: ["Define the maximum you can lose per position", "Size so a full loss stays within that limit", "Remember conviction is a hypothesis, not certainty"] },
        ],
      },
      {
        slug: "drawdown-logic",
        title: "Thinking in drawdowns",
        order: 2,
        estimatedMinutes: 5,
        contentBlocks: [
          { type: "paragraph", text: "A 50% loss needs a 100% gain to recover. Deep drawdowns are not just uncomfortable — they compound against you and can derail a plan permanently." },
          { type: "paragraph", text: "Defensive assets rarely make you rich; they keep drawdowns shallow enough that your plan survives long enough to work." },
        ],
      },
      {
        slug: "risk-discipline",
        title: "Rules beat feelings",
        order: 3,
        estimatedMinutes: 4,
        contentBlocks: [
          { type: "paragraph", text: "Pre-commit to rules in calm times: how much per position, what triggers a review, when you rebalance. Then follow them when the market is loud." },
          { type: "callout", label: "Core truth", text: "Risk management is the price of staying in the game long enough for compounding to matter." },
        ],
      },
    ],
  },
  {
    slug: "portfolio-optimization",
    title: "Portfolio Optimization",
    description: "Efficient frontiers and the gap between theory and practice.",
    level: "ADVANCED",
    order: 5,
    lessons: [
      {
        slug: "efficient-frontier",
        title: "The efficient frontier",
        order: 1,
        estimatedMinutes: 5,
        contentBlocks: [
          { type: "paragraph", text: "Modern portfolio theory says that for every level of risk there is a mix with the highest expected return — the efficient frontier. Portfolios below the frontier waste return for their risk." },
          { type: "paragraph", text: "The idea's gift is intuition: risk and return are paired, and diversification improves the trade-off." },
        ],
      },
      {
        slug: "optimization-in-practice",
        title: "Optimization in practice",
        order: 2,
        estimatedMinutes: 5,
        contentBlocks: [
          { type: "paragraph", text: "Real optimisation needs inputs — expected returns, covariances — that must be estimated. Small input errors produce wild output changes, so optimisers are fragile instruments." },
          { type: "list", items: ["Use reasonable ranges, not single-point miracles", "Constrain weights to stay investable", "Treat the optimiser's answer as a starting point to reason about, not gospel"] },
        ],
      },
      {
        slug: "theory-vs-behavior",
        title: "The gap between theory and behaviour",
        order: 3,
        estimatedMinutes: 4,
        contentBlocks: [
          { type: "paragraph", text: "The mathematically optimal portfolio you cannot hold under stress is worth less than the good-portfolio you actually will hold. Cost, taxes, and behaviour are real constraints." },
          { type: "callout", label: "Final word", text: "Optimisation sharpens judgement; it does not replace it. The best portfolio is the one you can keep." },
        ],
      },
    ],
  },
];

/** All courses at the given level, in display order. */
export function coursesByLevel(level: CourseLevel): CourseSample[] {
  return CURRICULUM.filter((course) => course.level === level).sort(
    (a, b) => a.order - b.order
  );
}

/** Look up a course by slug, or undefined. */
export function getCourseSample(slug: string): CourseSample | undefined {
  return CURRICULUM.find((course) => course.slug === slug);
}

/** Look up a lesson within a course, or undefined. */
export function getSampleLesson(
  courseSlug: string,
  lessonSlug: string
): { course: CourseSample; lesson: LessonSample } | undefined {
  const course = getCourseSample(courseSlug);
  if (!course) return undefined;
  const lesson = course.lessons.find((l) => l.slug === lessonSlug);
  if (!lesson) return undefined;
  return { course, lesson };
}