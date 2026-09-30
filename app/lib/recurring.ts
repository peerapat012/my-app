import type { OccurrenceStatus } from "@/db/app-schema";
import { dueDate, type DateStr, type Month } from "./months";

// รอยืนยัน = คำนวณสด ไม่เก็บแถว — docs/adr/0003
export interface RuleLike {
  id: string;
  active: boolean;
  startMonth: Month;
  dayOfMonth: number;
}

export interface OccurrenceLike {
  ruleId: string;
  month: Month;
  status: OccurrenceStatus;
}

export function isPending(
  rule: RuleLike,
  month: Month,
  today: DateStr,
  occurrences: OccurrenceLike[],
): boolean {
  if (!rule.active || rule.startMonth > month) return false;
  if (dueDate(month, rule.dayOfMonth) > today) return false;
  return !occurrences.some((o) => o.ruleId === rule.id && o.month === month);
}

export function pendingRules<R extends RuleLike>(
  rules: R[],
  month: Month,
  today: DateStr,
  occurrences: OccurrenceLike[],
): R[] {
  return rules.filter((r) => isPending(r, month, today, occurrences));
}
