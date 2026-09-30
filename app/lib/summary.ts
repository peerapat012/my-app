import type { TransactionType } from "@/db/app-schema";

export interface SummaryInput {
  type: TransactionType;
  amount: number;
  categoryId: string;
  categoryName: string;
}

export interface CategoryBreakdown {
  categoryId: string;
  name: string;
  amount: number;
  /** % ของรายจ่ายทั้งเดือน */
  pct: number;
}

export interface MonthlySummary {
  income: number;
  expense: number;
  balance: number;
  /** % ใช้ไปของรายรับ (0–100; รายรับ 0 → 0) */
  spentPct: number;
  expenseByCategory: CategoryBreakdown[];
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function summarize(txs: SummaryInput[]): MonthlySummary {
  let income = 0;
  let expense = 0;
  const byCat = new Map<string, { name: string; amount: number }>();
  for (const t of txs) {
    if (t.type === "income") {
      income += t.amount;
      continue;
    }
    expense += t.amount;
    const cur = byCat.get(t.categoryId);
    if (cur) cur.amount += t.amount;
    else byCat.set(t.categoryId, { name: t.categoryName, amount: t.amount });
  }
  income = round2(income);
  expense = round2(expense);
  const expenseByCategory = [...byCat.entries()]
    .map(([categoryId, { name, amount }]) => ({
      categoryId,
      name,
      amount: round2(amount),
      pct: expense ? (amount / expense) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
  return {
    income,
    expense,
    balance: round2(income - expense),
    spentPct: income ? Math.min(100, (expense / income) * 100) : 0,
    expenseByCategory,
  };
}

/** ยอดต่อหมวด (ทั้งรายรับและรายจ่าย) สำหรับแท็บหมวดหมู่ */
export function totalsByCategory(txs: Pick<SummaryInput, "amount" | "categoryId">[]) {
  const m = new Map<string, number>();
  for (const t of txs) m.set(t.categoryId, round2((m.get(t.categoryId) ?? 0) + t.amount));
  return m;
}
