"use client";

import { useState, useTransition } from "react";
import type { CategoryDTO, TransactionDTO } from "@/lib/data";
import { deleteCategory, deleteTransaction } from "@/app/actions";
import { formatSigned } from "@/lib/format";
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
import { runAction } from "./run-action";

export type DeleteTarget =
  | { kind: "transaction"; tx: TransactionDTO }
  | { kind: "category"; cat: CategoryDTO };

export function ConfirmDelete({ target, onClose }: { target: DeleteTarget | null; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  // เก็บเป้าหมายล่าสุดไว้แสดงระหว่าง animation ปิด
  const [shown, setShown] = useState(target);
  if (target && target !== shown) setShown(target);

  const confirm = () => {
    if (!target) return;
    startTransition(async () => {
      const p = target.kind === "transaction" ? deleteTransaction(target.tx.id) : deleteCategory(target.cat.id);
      if (await runAction(p, "ลบแล้ว")) onClose();
    });
  };

  let title = "";
  let body = "";
  if (shown?.kind === "transaction") {
    const t = shown.tx;
    title = "ลบรายการนี้?";
    body = `“${t.note || t.categoryName}” ${formatSigned(t.amount, t.type)}`;
    if (t.recurringRuleId)
      body +=
        " — รายการนี้มาจากรายการประจำ หลังลบจะกลับไปเป็น “รอยืนยัน” ของเดือนนี้ ถ้าไม่ต้องการให้กลับมา ให้กด “ข้าม” ในแถบรอยืนยัน";
  } else if (shown?.kind === "category") {
    title = `ลบหมวด “${shown.cat.name}”?`;
    body = "หมวดจะถูกซ่อนจากตัวเลือก รายการเดิมที่ใช้หมวดนี้ยังอยู่และแสดงชื่อเดิม";
  }

  return (
    <AlertDialog open={target !== null} onOpenChange={(open) => !open && !pending && onClose()}>
      <AlertDialogContent className="rounded-[18px] p-6 shadow-modal">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{body}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-pill" disabled={pending}>
            ยกเลิก
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirm}
            disabled={pending}
            className="rounded-pill bg-destructive text-white hover:bg-destructive/90"
          >
            {pending ? "กำลังลบ…" : "ลบ"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
