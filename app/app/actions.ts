"use server";

import { and, eq, isNull, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { category, recurringOccurrence, recurringRule, transaction } from "@/db/schema";
import type { TransactionType } from "@/db/app-schema";
import { ownedCategory, ownedRule, ownedTransaction } from "@/lib/data";
import { requireUser } from "@/lib/session";
import { dueDate, isDateStr, isMonth, monthOf } from "@/lib/months";

// ทุก action ตรวจ session และ scope ด้วย userId (docs/adr/0001)
// neon-http ไม่มี interactive transaction → ใช้ db.batch เมื่อต้องเขียนหลายตารางพร้อมกัน

export type ActionResult = { ok: true } | { ok: false; error: string };

const ok = (): ActionResult => {
  revalidatePath("/");
  return { ok: true };
};
const fail = (error: string): ActionResult => ({ ok: false, error });

const isType = (v: unknown): v is TransactionType => v === "income" || v === "expense";

function parseAmount(v: unknown): string | null {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n <= 0 || n >= 1e10) return null;
  return (Math.round(n * 100) / 100).toFixed(2);
}

const isUniqueViolation = (e: unknown) => {
  const err = e as { code?: string; cause?: { code?: string } };
  return err?.code === "23505" || err?.cause?.code === "23505";
};

// ---------- Transaction ----------

export interface TransactionInput {
  /** มี id = แก้ไข */
  id?: string;
  type: TransactionType;
  amount: number | string;
  categoryId: string;
  note: string;
  date: string;
  /** toggle "ทำซ้ำทุกเดือน" */
  recurring: boolean;
  /** แก้รายการที่มาจาก rule: ใช้ค่าใหม่กับเดือนถัดไปด้วย */
  applyToRule?: boolean;
  /** "แก้แล้วยืนยัน" จากแถบรอยืนยัน */
  confirmRule?: { ruleId: string; month: string };
}

export async function saveTransaction(input: TransactionInput): Promise<ActionResult> {
  const user = await requireUser();
  const amount = parseAmount(input.amount);
  if (!isType(input.type)) return fail("ประเภทไม่ถูกต้อง");
  if (!amount) return fail("จำนวนเงินต้องมากกว่า 0");
  if (!isDateStr(input.date)) return fail("วันที่ไม่ถูกต้อง");
  const note = String(input.note ?? "").trim().slice(0, 200);

  const existing = input.id ? await ownedTransaction(user.id, input.id) : undefined;
  if (input.id && !existing) return fail("ไม่พบรายการ");

  const cat = await ownedCategory(user.id, input.categoryId);
  if (!cat) return fail("ไม่พบหมวดหมู่");
  if (cat.type !== input.type) return fail("หมวดไม่ตรงกับประเภท");
  // หมวดที่ archive แล้วใช้ได้เฉพาะรายการเดิมที่อ้างอยู่แล้ว
  if (cat.deletedAt && existing?.categoryId !== cat.id) return fail("หมวดนี้ถูกลบแล้ว");

  const fields = { type: input.type, amount, categoryId: cat.id, note, date: input.date };
  const ruleFields = { type: input.type, amount, categoryId: cat.id, note, dayOfMonth: Number(input.date.slice(8, 10)) };

  // แก้แล้วยืนยัน
  if (!existing && input.confirmRule) {
    const { ruleId, month } = input.confirmRule;
    const rule = await ownedRule(user.id, ruleId);
    if (!rule || !isMonth(month)) return fail("ไม่พบรายการประจำ");
    const txId = crypto.randomUUID();
    await db.batch([
      db.insert(transaction).values({ id: txId, userId: user.id, ...fields, recurringRuleId: rule.id }),
      db.insert(recurringOccurrence).values({ ruleId: rule.id, month, status: "confirmed", transactionId: txId }),
    ]);
    return ok();
  }

  // สร้างใหม่
  if (!existing) {
    const txId = crypto.randomUUID();
    if (!input.recurring) {
      await db.insert(transaction).values({ id: txId, userId: user.id, ...fields });
      return ok();
    }
    const ruleId = crypto.randomUUID();
    const month = monthOf(input.date);
    await db.batch([
      db.insert(recurringRule).values({ id: ruleId, userId: user.id, ...ruleFields, startMonth: month }),
      db.insert(transaction).values({ id: txId, userId: user.id, ...fields, recurringRuleId: ruleId }),
      db.insert(recurringOccurrence).values({ ruleId, month, status: "confirmed", transactionId: txId }),
    ]);
    return ok();
  }

  // แก้ไข
  const updateTx = db
    .update(transaction)
    .set(fields)
    .where(and(eq(transaction.id, existing.id), eq(transaction.userId, user.id)));

  if (existing.recurringRuleId) {
    const ruleId = existing.recurringRuleId;
    const ruleWhere = and(eq(recurringRule.id, ruleId), eq(recurringRule.userId, user.id));
    if (!input.recurring) {
      await db.batch([updateTx, db.update(recurringRule).set({ active: false }).where(ruleWhere)]);
    } else if (input.applyToRule) {
      await db.batch([updateTx, db.update(recurringRule).set({ ...ruleFields, active: true }).where(ruleWhere)]);
    } else {
      await updateTx;
    }
    return ok();
  }

  if (input.recurring) {
    // รายการเดิมที่เพิ่งเปิดทำซ้ำ → สร้าง rule ใหม่ นับรายการนี้เป็นเดือนแรก
    const ruleId = crypto.randomUUID();
    const month = monthOf(input.date);
    await db.batch([
      db.insert(recurringRule).values({ id: ruleId, userId: user.id, ...ruleFields, startMonth: month }),
      db.update(transaction).set({ ...fields, recurringRuleId: ruleId }).where(eq(transaction.id, existing.id)),
      db.insert(recurringOccurrence).values({ ruleId, month, status: "confirmed", transactionId: existing.id }),
    ]);
    return ok();
  }

  await updateTx;
  return ok();
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const user = await requireUser();
  // occurrence ถูก cascade ลบ → กลับเป็นรอยืนยัน (docs/adr/0003)
  await db.delete(transaction).where(and(eq(transaction.id, id), eq(transaction.userId, user.id)));
  return ok();
}

// ---------- Recurring ----------

export async function confirmPending(ruleId: string, month: string): Promise<ActionResult> {
  const user = await requireUser();
  const rule = await ownedRule(user.id, ruleId);
  if (!rule || !isMonth(month)) return fail("ไม่พบรายการประจำ");
  const txId = crypto.randomUUID();
  try {
    await db.batch([
      db.insert(transaction).values({
        id: txId,
        userId: user.id,
        type: rule.type,
        amount: rule.amount,
        categoryId: rule.categoryId,
        note: rule.note,
        date: dueDate(month, rule.dayOfMonth),
        recurringRuleId: rule.id,
      }),
      db.insert(recurringOccurrence).values({ ruleId: rule.id, month, status: "confirmed", transactionId: txId }),
    ]);
  } catch (e) {
    if (isUniqueViolation(e)) return fail("ยืนยันเดือนนี้ไปแล้ว");
    throw e;
  }
  return ok();
}

export async function skipPending(ruleId: string, month: string): Promise<ActionResult> {
  const user = await requireUser();
  const rule = await ownedRule(user.id, ruleId);
  if (!rule || !isMonth(month)) return fail("ไม่พบรายการประจำ");
  await db
    .insert(recurringOccurrence)
    .values({ ruleId: rule.id, month, status: "skipped" })
    .onConflictDoNothing();
  return ok();
}

export async function stopRule(ruleId: string): Promise<ActionResult> {
  const user = await requireUser();
  await db
    .update(recurringRule)
    .set({ active: false })
    .where(and(eq(recurringRule.id, ruleId), eq(recurringRule.userId, user.id)));
  return ok();
}

// ---------- Category ----------

function cleanName(v: unknown) {
  const name = String(v ?? "").trim().replace(/\s+/g, " ");
  return name.length > 0 && name.length <= 40 ? name : null;
}

export async function createCategory(nameInput: string, type: TransactionType): Promise<ActionResult> {
  const user = await requireUser();
  const name = cleanName(nameInput);
  if (!name) return fail("กรุณาใส่ชื่อหมวด (ไม่เกิน 40 ตัวอักษร)");
  if (!isType(type)) return fail("ประเภทไม่ถูกต้อง");
  const [{ top }] = await db
    .select({ top: max(category.sortOrder) })
    .from(category)
    .where(and(eq(category.userId, user.id), eq(category.type, type)));
  try {
    await db.insert(category).values({ userId: user.id, type, name, sortOrder: (top ?? -1) + 1 });
  } catch (e) {
    if (isUniqueViolation(e)) return fail("มีหมวดชื่อนี้แล้ว");
    throw e;
  }
  return ok();
}

export async function renameCategory(id: string, nameInput: string): Promise<ActionResult> {
  const user = await requireUser();
  const name = cleanName(nameInput);
  if (!name) return fail("กรุณาใส่ชื่อหมวด (ไม่เกิน 40 ตัวอักษร)");
  try {
    await db
      .update(category)
      .set({ name })
      .where(and(eq(category.id, id), eq(category.userId, user.id), isNull(category.deletedAt)));
  } catch (e) {
    if (isUniqueViolation(e)) return fail("มีหมวดชื่อนี้แล้ว");
    throw e;
  }
  return ok();
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const user = await requireUser();
  // soft delete — docs/adr/0002
  await db
    .update(category)
    .set({ deletedAt: new Date() })
    .where(and(eq(category.id, id), eq(category.userId, user.id), isNull(category.deletedAt)));
  return ok();
}
