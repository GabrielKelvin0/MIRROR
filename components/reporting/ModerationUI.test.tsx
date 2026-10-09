import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const mocks = vi.hoisted(() => ({
  state: {} as { error?: string; success?: string },
  pending: false,
}));
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useActionState: () => [mocks.state, () => {}, mocks.pending],
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: () => {} }) }));
vi.mock("@/app/reports/actions", () => ({ submitReport: vi.fn() }));
vi.mock("@/app/(admin)/actions", () => ({
  changeUserRole: vi.fn(),
  moderateStrategy: vi.fn(),
  resolveReport: vi.fn(),
  verifyCreator: vi.fn(),
}));
import { ReportForm } from "./ReportForm";
import { MyReports } from "./MyReports";
import { AuditEntries } from "@/components/admin/AuditEntries";
import { AdminChangeForm } from "@/components/admin/AdminChangeForm";
beforeEach(() => {
  mocks.state = {};
  mocks.pending = false;
});
describe("Moderation UI boundaries", () => {
  it("requires a report reason with labeled fields and preserves the selected public target", () => {
    const html = renderToStaticMarkup(
      <ReportForm
        resourceType="STRATEGY"
        resourceId="public-target"
        reportsHref="/learner/reports"
      />
    );
    expect(html).toContain('name="resourceId" value="public-target"');
    expect(html).toContain('name="reason" required=""');
    expect(html).toContain("Report details");
    expect(html).not.toContain("reporterId");
  });
  it("shows errors inline, disables pending controls, and prevents duplicate UI submission after success", () => {
    mocks.state = { error: "This record changed" };
    mocks.pending = true;
    const html = renderToStaticMarkup(
      <ReportForm resourceType="USER" resourceId="creator" reportsHref="/creator/reports" />
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain('disabled=""');
    expect(html).toContain("This record changed");
    mocks.state = { success: "Report submitted" };
    mocks.pending = false;
    const success = renderToStaticMarkup(
      <ReportForm resourceType="USER" resourceId="creator" reportsHref="/creator/reports" />
    );
    expect(success).toContain('role="status"');
    expect(success).toContain("/creator/reports");
    expect(success).not.toContain("Submit report");
  });
  it("includes current state and required review rationale on privileged forms", () => {
    const html = renderToStaticMarkup(
      <AdminChangeForm
        action={async () => ({})}
        label="Review report"
        field="status"
        options={[{ value: "RESOLVED", label: "Resolve report" }]}
        hidden={{ expectedStatus: "OPEN" }}
      />
    );
    expect(html).toContain('name="expectedStatus" value="OPEN"');
    expect(html).toContain('name="reason" required=""');
    expect(html).toContain("Choose a change");
  });
  it("escapes legacy report text and does not invent a missing target name", () => {
    const html = renderToStaticMarkup(
      <MyReports
        reports={[
          {
            id: "old",
            resourceType: "STRATEGY",
            resourceId: "target",
            resourceName: null,
            reason: "<script>alert(1)</script>",
            description: "<img src=x onerror=alert(1)>",
            status: "OPEN",
            createdAt: new Date("2026-09-01"),
          },
        ]}
      />
    );
    expect(html).toContain("Strategy report");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
  });
  it("escapes audit rationale and hides unrecognized raw detail", () => {
    const html = renderToStaticMarkup(
      <AuditEntries
        entries={[
          {
            id: "audit",
            action: "ADMIN_REPORT_STATUS",
            changes: '{"from":"OPEN","to":"RESOLVED","reason":"<script>x</script>","sql":"secret"}',
            createdAt: new Date("2026-09-01"),
          },
        ]}
      />
    );
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("secret");
    expect(html).not.toContain("<script>");
    const legacy = renderToStaticMarkup(
      <AuditEntries
        entries={[
          {
            id: "audit",
            action: "OLD",
            changes: "legacy secret text",
            createdAt: new Date("2026-09-01"),
          },
        ]}
      />
    );
    expect(legacy).toContain("Reason not recorded");
    expect(legacy).not.toContain("legacy secret text");
  });
});
