import { describe, expect, it } from "vitest";
import { summarize, type SummaryInput } from "../summary";

const tx = (type: SummaryInput["type"], amount: number, cat = "c1"): SummaryInput => ({
  type, amount, categoryId: cat, categoryName: cat,
});

describe("summarize", () => {
  it("รายรับ/รายจ่าย/คงเหลือ/%", () => {
    const s = summarize([tx("income", 1000, "sal"), tx("expense", 250, "food"), tx("expense", 0.1, "food"), tx("expense", 0.2, "food")]);
    expect(s.income).toBe(1000);
    expect(s.expense).toBe(250.3);
    expect(s.balance).toBe(749.7);
    expect(s.spentPct).toBeCloseTo(25.03);
  });

  it("% cap 100 และรายรับ 0", () => {
    expect(summarize([tx("income", 100), tx("expense", 300)]).spentPct).toBe(100);
    expect(summarize([tx("expense", 300)]).spentPct).toBe(0);
    expect(summarize([]).spentPct).toBe(0);
  });

  it("รายจ่ายตามหมวดเรียงมาก→น้อย ไม่รวมรายรับ", () => {
    const s = summarize([tx("expense", 100, "a"), tx("expense", 500, "b"), tx("expense", 50, "a"), tx("income", 999, "c")]);
    expect(s.expenseByCategory.map((c) => [c.categoryId, c.amount])).toEqual([["b", 500], ["a", 150]]);
    expect(s.expenseByCategory[0].pct).toBeCloseTo((500 / 650) * 100);
  });
});
