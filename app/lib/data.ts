import "server-only";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { category, recurringOccurrence, recurringRule, transaction } from "@/db/schema";
import type { TransactionType } from "@/db/app-schema";
import { addMonths, monthRange, todayBangkok, type Month } from "@/lib/months";
import { pendingRules } from "@/lib/recurring";

// amount จาก DB เป็น string → แปลงเป็น number ที่ขอบนี้ (docs/SPEC.md §5)

export interface CategoryDTO {
  id: string;
  type: TransactionType;
  name: string;
  archived: boolean;
}

export interface TransactionDTO {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  categoryName: string;
  note: string;
  date: string;
  recurringRuleId: string | null;
}

export interface RuleDTO {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  categoryName: string;
  note: string;
  dayOfMonth: number;
  startMonth: string;
  active: boolean;
}

export interface MonthTotals {
  month: Month;
  income: number;
  expense: number;
}

export interface MonthData {
  categories: CategoryDTO[];
  transactions: TransactionDTO[];
  rules: RuleDTO[];
  pending: RuleDTO[];
  history: MonthTotals[];
}

export async function getMonthData(userId: string, month: Month): Promise<MonthData> {
  const { start, end } = monthRange(month);
  const historyStart = monthRange(addMonths(month, -5)).start;

  const [cats, txs, rules, occurrences, totals] = await Promise.all([
    db
      .select()
      .from(category)
      .where(eq(category.userId, userId))
      .orderBy(asc(category.sortOrder), asc(category.createdAt)),
    db
      .select({
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        categoryId: transaction.categoryId,
        categoryName: category.name,
        note: transaction.note,
        date: transaction.date,
        recurringRuleId: transaction.recurringRuleId,
      })
      .from(transaction)
      .innerJoin(category, eq(category.id, transaction.categoryId))
      .where(and(eq(transaction.userId, userId), gte(transaction.date, start), lte(transaction.date, end)))
      .orderBy(desc(transaction.date), desc(transaction.createdAt)),
    db
      .select({
        id: recurringRule.id,
        type: recurringRule.type,
        amount: recurringRule.amount,
        categoryId: recurringRule.categoryId,
        categoryName: category.name,
        note: recurringRule.note,
        dayOfMonth: recurringRule.dayOfMonth,
        startMonth: recurringRule.startMonth,
        active: recurringRule.active,
      })
      .from(recurringRule)
      .innerJoin(category, eq(category.id, recurringRule.categoryId))
      .where(eq(recurringRule.userId, userId)),
    db
      .select({ ruleId: recurringOccurrence.ruleId, month: recurringOccurrence.month, status: recurringOccurrence.status })
      .from(recurringOccurrence)
      .innerJoin(recurringRule, eq(recurringRule.id, recurringOccurrence.ruleId))
      .where(and(eq(recurringRule.userId, userId), eq(recurringOccurrence.month, month))),
    db
      .select({
        month: sql<string>`to_char(${transaction.date}, 'YYYY-MM')`,
        type: transaction.type,
        total: sql<string>`sum(${transaction.amount})`,
      })
      .from(transaction)
      .where(and(eq(transaction.userId, userId), gte(transaction.date, historyStart), lte(transaction.date, end)))
      .groupBy(sql`1`, transaction.type),
  ]);

  const ruleDTOs: RuleDTO[] = rules.map((r) => ({ ...r, amount: Number(r.amount) }));
  const history: MonthTotals[] = Array.from({ length: 6 }, (_, i) => {
    const m = addMonths(month, i - 5);
    const pick = (t: TransactionType) => Number(totals.find((x) => x.month === m && x.type === t)?.total ?? 0);
    return { month: m, income: pick("income"), expense: pick("expense") };
  });

  return {
    categories: cats.map((c) => ({ id: c.id, type: c.type, name: c.name, archived: c.deletedAt !== null })),
    transactions: txs.map((t) => ({ ...t, amount: Number(t.amount) })),
    rules: ruleDTOs,
    pending: pendingRules(ruleDTOs, month, todayBangkok(), occurrences),
    history,
  };
}

export async function ownedCategory(userId: string, id: string) {
  const [c] = await db.select().from(category).where(and(eq(category.id, id), eq(category.userId, userId)));
  return c;
}

export async function ownedRule(userId: string, id: string) {
  const [r] = await db.select().from(recurringRule).where(and(eq(recurringRule.id, id), eq(recurringRule.userId, userId)));
  return r;
}

export async function ownedTransaction(userId: string, id: string) {
  const [t] = await db.select().from(transaction).where(and(eq(transaction.id, id), eq(transaction.userId, userId)));
  return t;
}
