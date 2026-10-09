import { describe, expect, it } from "vitest";
import {
  assertAdminStrategyTransition,
  assertFresh,
  assertReporterRole,
  assertReportTransition,
  auditDetails,
  booleanChoice,
  reportHref,
  reportResourceType,
  resourceId,
  reviewReason,
  validateReport,
} from "./moderation-rules";

const report = {
  resourceType: "STRATEGY",
  resourceId: " public ",
  reason: "Missing risk information",
  description: " Evidence ",
};
describe("Report and moderation rules", () => {
  it("normalizes report text without accepting a reporter identity", () => {
    expect(validateReport(report)).toEqual({
      resourceType: "STRATEGY",
      resourceId: "public",
      reason: report.reason,
      description: "Evidence",
    });
    expect(validateReport({ ...report, description: " " }).description).toBeNull();
  });
  it.each(["COMMENT", "REPORT", "USER_ROLE", "", null])(
    "rejects unsupported report targets %s",
    (value) => {
      expect(() => reportResourceType(value)).toThrow();
    }
  );
  it("requires meaningful content and bounded review/report text", () => {
    expect(() => resourceId(" ")).toThrow();
    expect(() => resourceId("x".repeat(256))).toThrow();
    expect(() => reviewReason(" ")).toThrow();
    expect(() => reviewReason("x".repeat(5001))).toThrow();
    expect(reviewReason(" reviewed ")).toBe("reviewed");
    expect(() => validateReport({ ...report, reason: "invented" })).toThrow();
    expect(() => validateReport({ ...report, description: "x".repeat(5001) })).toThrow();
    expect(() =>
      validateReport({ ...report, reason: "Other concern", description: " " })
    ).toThrow();
  });
  it("allows both reporting roles while rejecting administrators", () => {
    expect(() => assertReporterRole("LEARNER")).not.toThrow();
    expect(() => assertReporterRole("CREATOR")).not.toThrow();
    expect(() => assertReporterRole("ADMIN")).toThrow();
  });
  it("requires exact boolean choices and current-state tokens", () => {
    expect(booleanChoice("false")).toBe(false);
    expect(booleanChoice("true")).toBe(true);
    expect(() => booleanChoice("0")).toThrow();
    expect(() => assertFresh("OPEN", "INVESTIGATING")).toThrow(/changed/);
    expect(() => assertFresh(false, false)).not.toThrow();
  });
  it("keeps case progress and terminal reopening explicit", () => {
    expect(() => assertReportTransition("OPEN", "INVESTIGATING")).not.toThrow();
    expect(() => assertReportTransition("INVESTIGATING", "DISMISSED")).not.toThrow();
    expect(() => assertReportTransition("RESOLVED", "OPEN")).not.toThrow();
    expect(() => assertReportTransition("OPEN", "OPEN")).toThrow();
    expect(() => assertReportTransition("DISMISSED", "RESOLVED")).toThrow();
  });
  it("restores archived content only to a draft and keeps the publishing requirements", () => {
    expect(() => assertAdminStrategyTransition("ARCHIVED", "DRAFT", {})).not.toThrow();
    expect(() =>
      assertAdminStrategyTransition("ARCHIVED", "PUBLISHED", { name: "Name", riskProfile: "LOW" })
    ).toThrow();
    expect(() => assertAdminStrategyTransition("DRAFT", "PUBLISHED", { name: "Name" })).toThrow(
      /risk profile/
    );
    expect(() =>
      assertAdminStrategyTransition("DRAFT", "PUBLISHED", { name: "Name", riskProfile: "LOW" })
    ).not.toThrow();
  });
  it("reads only known audit fields and never passes through malformed or secret detail", () => {
    expect(auditDetails("legacy raw text")).toEqual({ from: null, to: null, reason: null });
    expect(
      auditDetails('{"from":false,"to":true,"reason":"Reviewed","password":"hidden"}')
    ).toEqual({ from: "false", to: "true", reason: "Reviewed" });
    expect(auditDetails('{"from":{"sql":"hidden"},"reason":["hidden"]}')).toEqual({
      from: null,
      to: null,
      reason: null,
    });
  });
  it("encodes a content report link without accepting a redirect destination", () => {
    const href = reportHref("STRATEGY", "id&resourceType=USER");
    expect(href).toBe("/reports/new?resourceType=STRATEGY&resourceId=id%26resourceType%3DUSER");
  });
});
