import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { PaperPosition, PortfolioEvent } from "@prisma/client";
import { PortfolioAllocationHistory } from "./PortfolioAllocationHistory";
import { PortfolioHoldings } from "./PortfolioHoldings";

const timestamp = new Date("2026-10-07T12:00:00Z");
const legacy: PortfolioEvent = {
  id: "old",
  portfolioId: "mine",
  positionId: null,
  eventType: "REBALANCE",
  description: "Manual decision: <script>unsafe</script>",
  quantity: null,
  price: null,
  totalValue: null,
  reasoning: null,
  allocatedBefore: null,
  allocatedAfter: null,
  createdAt: timestamp,
};
describe("Portfolio history and holdings presentation", () => {
  it("preserves and escapes legacy notes without fabricating allocation percentages", () => {
    const html = renderToStaticMarkup(
      <PortfolioAllocationHistory events={[{ ...legacy, allocationDeltas: [] }]} />
    );
    expect(html).toContain("Decision note");
    expect(html).toContain("No allocation snapshot was recorded");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("Total allocated:");
  });
  it("shows missing prices as unavailable, even if a stale cached value exists", () => {
    const position: PaperPosition = {
      id: "p",
      portfolioId: "mine",
      strategyId: null,
      symbol: "TEST",
      quantity: 10,
      entryPrice: 20,
      currentPrice: null,
      currentValue: 999,
      percentOfPortfolio: 40,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const html = renderToStaticMarkup(
      <PortfolioHoldings positions={[position]} cashBalance={800} />
    );
    expect(html).toContain("$200.00");
    expect(html).toContain("Unavailable");
    expect(html).toContain("every holding has a valid recorded price");
    expect(html).not.toContain("$999");
  });
});
