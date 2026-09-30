"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { MonthTotals, TransactionDTO } from "@/lib/data";
import { summarize } from "@/lib/summary";
import { formatMoney, formatMonth, formatMonthShort } from "@/lib/format";
import type { Month } from "@/lib/months";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cardClass } from "./summary-cards";
import { RecentRow } from "./tx-row";

const BAR_COLORS = Array.from({ length: 7 }, (_, i) => `var(--chart-${i + 1})`);

const chartConfig = {
  income: { label: "รายรับ", color: "var(--income)" },
  expense: { label: "รายจ่าย", color: "var(--expense)" },
} satisfies ChartConfig;

export function SummaryTab({
  transactions,
  history,
  month,
  onOpen,
}: {
  transactions: TransactionDTO[];
  history: MonthTotals[];
  month: Month;
  onOpen: (t: TransactionDTO) => void;
}) {
  const { expenseByCategory } = summarize(transactions);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
        <section className={cardClass}>
          <h3 className="mb-3.5 text-base font-semibold">รายจ่ายตามหมวด</h3>
          {expenseByCategory.length === 0 && <p className="text-muted-foreground">ยังไม่มีรายจ่ายเดือนนี้</p>}
          <div className="flex flex-col gap-3">
            {expenseByCategory.map((c, i) => (
              <div key={c.categoryId}>
                <div className="mb-[5px] flex justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate">{c.name}</span>
                  <span className="flex-none whitespace-nowrap tabular-nums">
                    {formatMoney(c.amount)} <span className="text-muted-foreground">· {Math.round(c.pct)}%</span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-pill bg-muted">
                  <div
                    className="h-full rounded-pill"
                    style={{ width: `${c.pct}%`, background: BAR_COLORS[i % BAR_COLORS.length] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={cardClass}>
          <h3 className="mb-2 text-base font-semibold">รายการล่าสุด</h3>
          {transactions.length === 0 && <p className="text-muted-foreground">ยังไม่มีรายการเดือนนี้</p>}
          {transactions.slice(0, 6).map((t) => (
            <RecentRow key={t.id} tx={t} onOpen={onOpen} />
          ))}
        </section>
      </div>

      <section className={cardClass}>
        <h3 className="mb-3 text-base font-semibold">รายรับ vs รายจ่าย 6 เดือน</h3>
        <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
          <BarChart data={history} accessibilityLayer margin={{ left: 4, right: 4 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(m: string) => formatMonthShort(m)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const m = payload?.[0]?.payload?.month as string | undefined;
                    return m ? formatMonth(m) : "";
                  }}
                  formatter={(value, name) => (
                    <div className="flex w-full justify-between gap-4">
                      <span className="text-muted-foreground">
                        {chartConfig[name as keyof typeof chartConfig]?.label ?? name}
                      </span>
                      <span className="font-medium tabular-nums">{formatMoney(Number(value))}</span>
                    </div>
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="income" fill="var(--color-income)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="expense" fill="var(--color-expense)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
        <p className="sr-only">ข้อมูลถึงเดือน {formatMonth(month)}</p>
      </section>
    </div>
  );
}
