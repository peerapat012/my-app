"use client";

import { useTransition } from "react";
import { RepeatIcon } from "lucide-react";
import type { RuleDTO } from "@/lib/data";
import { confirmPending, skipPending, stopRule, type ActionResult } from "@/app/actions";
import { formatDay, formatSigned } from "@/lib/format";
import { dueDate, type Month } from "@/lib/months";
import { Button } from "@/components/ui/button";
import { runAction } from "./run-action";

export function PendingBar({
  month,
  pending,
  onEditConfirm,
}: {
  month: Month;
  pending: RuleDTO[];
  onEditConfirm: (r: RuleDTO) => void;
}) {
  return (
    <section
      aria-label="รายการประจำรอยืนยัน"
      className="rounded-[14px] border border-primary/30 bg-badge/60 px-5 py-3.5 shadow-card"
    >
      <h3 className="mb-1 flex items-center gap-2 text-[15px] font-semibold">
        <RepeatIcon className="size-4 text-primary" /> รอยืนยัน {pending.length} รายการ
      </h3>
      {pending.map((r) => (
        <PendingRow key={r.id} rule={r} month={month} onEditConfirm={onEditConfirm} />
      ))}
    </section>
  );
}

function PendingRow({
  rule,
  month,
  onEditConfirm,
}: {
  rule: RuleDTO;
  month: Month;
  onEditConfirm: (r: RuleDTO) => void;
}) {
  const [busy, startTransition] = useTransition();
  const act = (p: () => Promise<ActionResult>, msg: string) =>
    startTransition(async () => {
      await runAction(p(), msg);
    });

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-primary/15 py-2.5 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="truncate">{rule.note || rule.categoryName}</div>
        <div className="text-xs text-muted-foreground">
          {formatDay(dueDate(month, rule.dayOfMonth))} · {rule.categoryName} ·{" "}
          <span className={rule.type === "income" ? "text-income" : "text-expense"}>
            {formatSigned(rule.amount, rule.type)}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Button
          size="sm"
          disabled={busy}
          className="rounded-pill px-3"
          onClick={() => act(() => confirmPending(rule.id, month), "ยืนยันแล้ว")}
        >
          ยืนยัน
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          className="rounded-pill bg-popover px-3"
          onClick={() => onEditConfirm(rule)}
        >
          แก้แล้วยืนยัน
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          className="rounded-pill px-3"
          onClick={() => act(() => skipPending(rule.id, month), "ข้ามเดือนนี้แล้ว")}
        >
          ข้าม
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          className="rounded-pill px-3 text-muted-foreground hover:bg-destructive-muted hover:text-destructive"
          onClick={() => act(() => stopRule(rule.id), "หยุดทำซ้ำแล้ว")}
        >
          หยุดทำซ้ำ
        </Button>
      </div>
    </div>
  );
}
