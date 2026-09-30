import type { RuleDTO, TransactionDTO } from "@/lib/data";
import { summarize } from "@/lib/summary";
import { formatBalance, formatMoney, formatMonth } from "@/lib/format";
import type { Month } from "@/lib/months";
import { cn } from "@/lib/utils";

export const cardClass = "rounded-[14px] bg-card px-5 py-[18px] shadow-card";

export function SummaryCards({
  month,
  transactions,
  pending,
}: {
  month: Month;
  transactions: TransactionDTO[];
  pending: RuleDTO[];
}) {
  const s = summarize(transactions);
  const pendingOf = (t: "income" | "expense") =>
    pending.filter((r) => r.type === t).reduce((a, r) => a + r.amount, 0);
  const pIncome = pendingOf("income");
  const pExpense = pendingOf("expense");
  const label = formatMonth(month);

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-5">
      <div className={cardClass}>
        <div className="font-bold">รายรับ</div>
        <div className="text-[13px] text-muted-foreground">{label}</div>
        <div className="mt-1.5 text-[30px] font-bold text-income tabular-nums">{formatMoney(s.income)}</div>
        {pIncome > 0 && <div className="text-xs text-muted-foreground">รอยืนยัน +{formatMoney(pIncome)}</div>}
      </div>
      <div className={cardClass}>
        <div className="font-bold">รายจ่าย</div>
        <div className="text-[13px] text-muted-foreground">{label}</div>
        <div className="mt-1.5 text-[30px] font-bold text-expense tabular-nums">{formatMoney(s.expense)}</div>
        {pExpense > 0 && <div className="text-xs text-muted-foreground">รอยืนยัน −{formatMoney(pExpense)}</div>}
      </div>
      <div className={cardClass}>
        <div className="font-bold">คงเหลือ</div>
        <div className="text-[13px] text-muted-foreground">ใช้ไป {Math.round(s.spentPct)}% ของรายรับ</div>
        <div className="mt-1.5 text-[30px] font-bold tabular-nums">{formatBalance(s.balance)}</div>
        <div
          className="mt-2.5 h-2 overflow-hidden rounded-pill bg-muted"
          role="progressbar"
          aria-label="สัดส่วนที่ใช้ไป"
          aria-valuenow={Math.round(s.spentPct)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn("h-full rounded-pill transition-[width]", s.spentPct > 90 ? "bg-expense" : "bg-primary")}
            style={{ width: `${s.spentPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
