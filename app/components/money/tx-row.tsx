"use client";

import { RepeatIcon, XIcon } from "lucide-react";
import type { TransactionDTO } from "@/lib/data";
import { formatDay, formatSigned } from "@/lib/format";
import { cn } from "@/lib/utils";

const amountClass = (t: TransactionDTO) =>
  cn("font-semibold whitespace-nowrap tabular-nums", t.type === "income" ? "text-income" : "text-expense");

/** แถวแบบย่อ (รายการล่าสุด) — คลิกเพื่อแก้ไข */
export function RecentRow({ tx, onOpen }: { tx: TransactionDTO; onOpen: (t: TransactionDTO) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(tx)}
      className="flex w-full justify-between gap-3 border-b border-divider py-[9px] text-left last:border-0 hover:bg-secondary/60"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate">{tx.note || tx.categoryName}</div>
        <div className="text-xs text-muted-foreground">
          {formatDay(tx.date)} · {tx.categoryName}
        </div>
      </div>
      <div className={amountClass(tx)}>{formatSigned(tx.amount, tx.type)}</div>
    </button>
  );
}

/** แถวเต็ม (แท็บรายการ) — คลิกเพื่อแก้ไข */
export function ListRow({
  tx,
  onOpen,
  onDelete,
}: {
  tx: TransactionDTO;
  onOpen: (t: TransactionDTO) => void;
  onDelete: (t: TransactionDTO) => void;
}) {
  return (
    <div className="grid grid-cols-[56px_minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-divider py-2.5 last:border-0 sm:grid-cols-[64px_minmax(0,1fr)_auto_auto]">
      <span className="text-[13px] text-muted-foreground">{formatDay(tx.date)}</span>
      <button type="button" onClick={() => onOpen(tx)} className="min-w-0 text-left">
        <div className="truncate">{tx.note || tx.categoryName}</div>
        <span className="mt-[3px] inline-flex items-center gap-1 rounded-pill bg-badge px-2.5 py-0.5 text-xs text-badge-foreground">
          {tx.recurringRuleId && <RepeatIcon className="size-3" aria-label="รายการประจำ" />}
          {tx.categoryName}
        </span>
      </button>
      <button type="button" onClick={() => onOpen(tx)} className={amountClass(tx)}>
        {formatSigned(tx.amount, tx.type)}
      </button>
      <button
        type="button"
        onClick={() => onDelete(tx)}
        aria-label="ลบ"
        className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive-muted hover:text-destructive"
      >
        <XIcon className="size-4" />
      </button>
    </div>
  );
}
