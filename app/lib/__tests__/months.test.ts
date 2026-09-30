import { describe, expect, it } from "vitest";
import { addMonths, currentMonth, dueDate, isDateStr, isMonth, lastDayOfMonth, todayBangkok } from "../months";

describe("months", () => {
  it("addMonths ข้ามปี", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(addMonths("2026-09", -5)).toBe("2026-04");
    expect(addMonths("2026-09", -21)).toBe("2024-12");
  });

  it("lastDayOfMonth รวมปีอธิกสุรทิน", () => {
    expect(lastDayOfMonth("2026-09")).toBe(30);
    expect(lastDayOfMonth("2026-02")).toBe(28);
    expect(lastDayOfMonth("2028-02")).toBe(29);
    expect(lastDayOfMonth("2026-12")).toBe(31);
  });

  it("dueDate ใช้วันสุดท้ายเมื่อเกิน", () => {
    expect(dueDate("2026-09", 31)).toBe("2026-09-30");
    expect(dueDate("2026-02", 31)).toBe("2026-02-28");
    expect(dueDate("2028-02", 30)).toBe("2028-02-29");
    expect(dueDate("2026-09", 5)).toBe("2026-09-05");
  });

  it("todayBangkok = UTC+7", () => {
    expect(todayBangkok(new Date("2026-09-30T16:59:00Z"))).toBe("2026-09-30");
    expect(todayBangkok(new Date("2026-09-30T17:00:00Z"))).toBe("2026-10-01");
    expect(currentMonth(new Date("2026-12-31T18:00:00Z"))).toBe("2027-01");
  });

  it("validators", () => {
    expect(isMonth("2026-09")).toBe(true);
    expect(isMonth("2026-13")).toBe(false);
    expect(isDateStr("2026-02-29")).toBe(false);
    expect(isDateStr("2028-02-29")).toBe(true);
  });
});
