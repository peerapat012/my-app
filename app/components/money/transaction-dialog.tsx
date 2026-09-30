"use client";

import { useState, useTransition } from "react";
import type { CategoryDTO, RuleDTO, TransactionDTO } from "@/lib/data";
import type { TransactionType } from "@/db/app-schema";
import { saveTransaction, type TransactionInput } from "@/app/actions";
import { dueDate, monthOf, type DateStr, type Month } from "@/lib/months";
import { formatMonth } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Segmented } from "./segmented";
import { runAction } from "./run-action";

export type EditorState =
  | { mode: "add"; nonce: number }
  | { mode: "edit"; tx: TransactionDTO }
  | { mode: "confirm"; rule: RuleDTO; month: Month };

interface FormValues {
  type: TransactionType;
  amount: string;
  categoryId: string;
  note: string;
  date: DateStr;
  recurring: boolean;
}

const fieldClass = "h-11 rounded-[10px] bg-popover text-[15px]";

export function TransactionDialog({
  state,
  onClose,
  categories,
  rulesById,
  today,
  month,
}: {
  state: EditorState | null;
  onClose: () => void;
  categories: CategoryDTO[];
  rulesById: Map<string, RuleDTO>;
  today: DateStr;
  month: Month;
}) {
  // เก็บ state ล่าสุดไว้ระหว่าง animation ปิด
  const [shown, setShown] = useState(state);
  if (state && state !== shown) setShown(state);

  return (
    <Dialog open={state !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="gap-3.5 rounded-[18px] p-6 shadow-modal sm:max-w-[420px]">
        {shown && (
          <EditorForm
            // key ให้ฟอร์ม reset ทุกครั้งที่เปิดใหม่
            key={keyOf(shown)}
            state={shown}
            onClose={onClose}
            categories={categories}
            rulesById={rulesById}
            today={today}
            month={month}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

const keyOf = (s: EditorState) =>
  s.mode === "edit" ? `e:${s.tx.id}` : s.mode === "confirm" ? `c:${s.rule.id}:${s.month}` : `a:${s.nonce}`;

function initialValues(state: EditorState, categories: CategoryDTO[], rulesById: Map<string, RuleDTO>, today: DateStr, month: Month): FormValues {
  if (state.mode === "edit") {
    const t = state.tx;
    const rule = t.recurringRuleId ? rulesById.get(t.recurringRuleId) : undefined;
    return { type: t.type, amount: String(t.amount), categoryId: t.categoryId, note: t.note, date: t.date, recurring: Boolean(rule?.active) };
  }
  if (state.mode === "confirm") {
    const r = state.rule;
    return { type: r.type, amount: String(r.amount), categoryId: r.categoryId, note: r.note, date: dueDate(state.month, r.dayOfMonth), recurring: true };
  }
  const first = categories.find((c) => c.type === "expense" && !c.archived);
  return {
    type: "expense",
    amount: "",
    categoryId: first?.id ?? "",
    note: "",
    date: monthOf(today) === month ? today : `${month}-01`,
    recurring: false,
  };
}

function EditorForm({
  state,
  onClose,
  categories,
  rulesById,
  today,
  month,
}: {
  state: EditorState;
  onClose: () => void;
  categories: CategoryDTO[];
  rulesById: Map<string, RuleDTO>;
  today: DateStr;
  month: Month;
}) {
  const [v, setV] = useState<FormValues>(() => initialValues(state, categories, rulesById, today, month));
  const [error, setError] = useState<string | null>(null);
  const [askApply, setAskApply] = useState(false);
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof FormValues>(k: K, val: FormValues[K]) => setV((p) => ({ ...p, [k]: val }));

  const tx = state.mode === "edit" ? state.tx : undefined;
  const rule = tx?.recurringRuleId ? rulesById.get(tx.recurringRuleId) : undefined;

  // หมวดที่เลือกได้: ยังไม่ archive + หมวดเดิมของรายการ (แม้ archive แล้ว)
  const options = categories
    .filter((c) => c.type === v.type && (!c.archived || c.id === tx?.categoryId || (state.mode === "confirm" && c.id === state.rule.categoryId)))
    .map((c) => ({ value: c.id, label: c.archived ? `${c.name} (ลบแล้ว)` : c.name }));

  const title = state.mode === "edit" ? "แก้ไขรายการ" : state.mode === "confirm" ? "แก้แล้วยืนยัน" : "เพิ่มรายการ";

  const submit = (applyToRule?: boolean) => {
    setError(null);
    const input: TransactionInput = {
      id: tx?.id,
      type: v.type,
      amount: v.amount,
      categoryId: v.categoryId,
      note: v.note,
      date: v.date,
      recurring: v.recurring,
      applyToRule,
      confirmRule: state.mode === "confirm" ? { ruleId: state.rule.id, month: state.month } : undefined,
    };
    startTransition(async () => {
      const msg = state.mode === "confirm" ? "ยืนยันแล้ว" : tx ? "บันทึกการแก้ไขแล้ว" : "เพิ่มรายการแล้ว";
      if (await runAction(saveTransaction(input), msg)) onClose();
    });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!(Number(v.amount) > 0)) return setError("กรุณาใส่จำนวนเงินมากกว่า 0");
    if (!v.categoryId) return setError("กรุณาเลือกหมวดหมู่");
    if (!v.date) return setError("กรุณาเลือกวันที่");
    // แก้รายการจาก rule ที่ยังเปิดทำซ้ำ และค่าต่างจาก rule → ถามว่าใช้กับเดือนถัดไปไหม
    if (rule?.active && v.recurring) {
      const changed =
        Number(v.amount) !== rule.amount ||
        v.categoryId !== rule.categoryId ||
        v.note.trim() !== rule.note ||
        Number(v.date.slice(8, 10)) !== rule.dayOfMonth;
      if (changed) return setAskApply(true);
    }
    submit();
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
      <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
      {state.mode === "confirm" && (
        <DialogDescription>รายการประจำของ {formatMonth(state.month)} — แก้ค่าแล้วกดยืนยัน</DialogDescription>
      )}

      <Segmented
        value={v.type}
        onChange={(t) => {
          const first = categories.find((c) => c.type === t && !c.archived);
          setV((p) => ({ ...p, type: t, categoryId: first?.id ?? "" }));
        }}
        options={[
          { value: "expense", label: "รายจ่าย" },
          { value: "income", label: "รายรับ" },
        ]}
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tx-amount">จำนวนเงิน (บาท)</Label>
        <Input
          id="tx-amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          autoFocus
          placeholder="0"
          value={v.amount}
          onChange={(e) => set("amount", e.target.value)}
          className={`${fieldClass} tabular-nums`}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>หมวดหมู่</Label>
        <Select items={options} value={v.categoryId || null} onValueChange={(c) => set("categoryId", String(c ?? ""))}>
          <SelectTrigger aria-label="หมวดหมู่" className={`${fieldClass} h-11! w-full`}>
            <SelectValue placeholder="เลือกหมวด" />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tx-note">บันทึก</Label>
        <Input
          id="tx-note"
          placeholder="เช่น ข้าวเที่ยง"
          maxLength={200}
          value={v.note}
          onChange={(e) => set("note", e.target.value)}
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tx-date">วันที่</Label>
        <Input
          id="tx-date"
          type="date"
          required
          value={v.date}
          onChange={(e) => set("date", e.target.value)}
          className={fieldClass}
        />
      </div>

      {state.mode !== "confirm" && (
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[10px] bg-secondary px-3.5 py-2.5">
          <span>
            <span className="block text-sm font-medium">ทำซ้ำทุกเดือน</span>
            <span className="block text-xs text-muted-foreground">
              {v.recurring
                ? `ขึ้นเป็น “รอยืนยัน” ทุกวันที่ ${Number(v.date.slice(8, 10)) || "—"}`
                : rule
                  ? "ปิดแล้ว — จะไม่ขึ้นในเดือนถัดไป"
                  : "สร้างเป็นรายการประจำ"}
            </span>
          </span>
          <Switch checked={v.recurring} onCheckedChange={(c) => set("recurring", c)} />
        </label>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-1.5 flex justify-end gap-2.5">
        <Button type="button" variant="secondary" onClick={onClose} className="h-10 rounded-pill px-[18px]">
          ยกเลิก
        </Button>
        <Button type="submit" disabled={pending} className="h-10 rounded-pill px-[22px] font-semibold">
          {pending ? "กำลังบันทึก…" : state.mode === "confirm" ? "ยืนยัน" : "บันทึก"}
        </Button>
      </div>

      <AlertDialog open={askApply} onOpenChange={setAskApply}>
        <AlertDialogContent className="rounded-[18px] p-6 shadow-modal">
          <AlertDialogHeader>
            <AlertDialogTitle>ใช้กับเดือนถัดไปด้วยไหม?</AlertDialogTitle>
            <AlertDialogDescription>
              รายการนี้มาจากรายการประจำ เลือกว่าจะอัปเดตแม่แบบ (จำนวนเงิน หมวด บันทึก และวันที่) สำหรับเดือนต่อ ๆ ไปด้วยหรือไม่
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-pill"
              onClick={() => {
                setAskApply(false);
                submit(false);
              }}
            >
              เฉพาะรายการนี้
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-pill"
              onClick={() => {
                setAskApply(false);
                submit(true);
              }}
            >
              ใช้กับเดือนถัดไปด้วย
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
