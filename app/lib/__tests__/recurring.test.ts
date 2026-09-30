import { describe, expect, it } from "vitest";
import { isPending, type RuleLike } from "../recurring";

const rule = (o: Partial<RuleLike> = {}): RuleLike => ({ id: "r", active: true, startMonth: "2026-01", dayOfMonth: 1, ...o });

describe("isPending", () => {
  it("ถึงกำหนดแล้วและยังไม่มี occurrence", () => {
    expect(isPending(rule(), "2026-09", "2026-09-01", [])).toBe(true);
  });

  it("ก่อน startMonth / ไม่ active", () => {
    expect(isPending(rule({ startMonth: "2026-10" }), "2026-09", "2026-09-30", [])).toBe(false);
    expect(isPending(rule({ active: false }), "2026-09", "2026-09-30", [])).toBe(false);
  });

  it("วันกำหนดยังไม่ถึง / เดือนอนาคต", () => {
    expect(isPending(rule({ dayOfMonth: 15 }), "2026-09", "2026-09-14", [])).toBe(false);
    expect(isPending(rule({ dayOfMonth: 15 }), "2026-09", "2026-09-15", [])).toBe(true);
    expect(isPending(rule(), "2026-10", "2026-09-30", [])).toBe(false);
  });

  it("confirmed หรือ skipped แล้วไม่ pending", () => {
    expect(isPending(rule(), "2026-09", "2026-09-30", [{ ruleId: "r", month: "2026-09", status: "confirmed" }])).toBe(false);
    expect(isPending(rule(), "2026-09", "2026-09-30", [{ ruleId: "r", month: "2026-09", status: "skipped" }])).toBe(false);
    expect(isPending(rule(), "2026-09", "2026-09-30", [{ ruleId: "r", month: "2026-08", status: "skipped" }])).toBe(true);
    expect(isPending(rule(), "2026-09", "2026-09-30", [{ ruleId: "x", month: "2026-09", status: "skipped" }])).toBe(true);
  });

  it("วันที่ 31 ในเดือน 30 วัน และ ก.พ.", () => {
    expect(isPending(rule({ dayOfMonth: 31 }), "2026-09", "2026-09-30", [])).toBe(true);
    expect(isPending(rule({ dayOfMonth: 31 }), "2026-09", "2026-09-29", [])).toBe(false);
    expect(isPending(rule({ dayOfMonth: 31 }), "2026-02", "2026-02-28", [])).toBe(true);
    expect(isPending(rule({ dayOfMonth: 30 }), "2028-02", "2028-02-28", [])).toBe(false);
    expect(isPending(rule({ dayOfMonth: 30 }), "2028-02", "2028-02-29", [])).toBe(true);
  });
});
