"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import type { CategoryDTO, MonthData, RuleDTO, TransactionDTO } from "@/lib/data";
import type { TransactionType } from "@/db/app-schema";
import type { DateStr, Month } from "@/lib/months";
import { Button } from "@/components/ui/button";
import { Header } from "./header";
import { Segmented } from "./segmented";
import { SummaryCards } from "./summary-cards";
import { PendingBar } from "./pending-bar";
import { SummaryTab } from "./summary-tab";
import { ListTab } from "./list-tab";
import { CategoriesTab } from "./categories-tab";
import { TransactionDialog, type EditorState } from "./transaction-dialog";
import { ConfirmDelete, type DeleteTarget } from "./confirm-delete";
import { useSetParams } from "./url";

export type Tab = "summary" | "list" | "categories";

export interface Filters {
  q: string;
  type: TransactionType | "";
  cat: string;
}

export function Dashboard({
  user,
  month,
  today,
  tab,
  filters,
  data,
}: {
  user: { name: string; email: string };
  month: Month;
  today: DateStr;
  tab: Tab;
  filters: Filters;
  data: MonthData;
}) {
  const setParams = useSetParams();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [toDelete, setToDelete] = useState<DeleteTarget | null>(null);

  const rulesById = new Map(data.rules.map((r) => [r.id, r]));
  const activeCategories = data.categories.filter((c) => !c.archived);

  const openEdit = (tx: TransactionDTO) => setEditor({ mode: "edit", tx });
  const askDeleteTx = (tx: TransactionDTO) => setToDelete({ kind: "transaction", tx });
  const askDeleteCat = (cat: CategoryDTO) => setToDelete({ kind: "category", cat });
  const confirmWithEdit = (rule: RuleDTO) => setEditor({ mode: "confirm", rule, month });

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 pt-7 pb-12 sm:px-5">
      <Header user={user} month={month} />

      <main className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented
            size="lg"
            value={tab}
            onChange={(t) => setParams({ tab: t === "summary" ? null : t }, { push: true })}
            options={[
              { value: "summary", label: "ภาพรวม" },
              { value: "list", label: "รายการ" },
              { value: "categories", label: "หมวดหมู่" },
            ]}
          />
          <Button
            onClick={() => setEditor({ mode: "add", nonce: Date.now() })}
            className="h-auto rounded-pill px-[22px] py-3 text-[15px] font-semibold shadow-cta"
          >
            <PlusIcon /> เพิ่มรายการ
          </Button>
        </div>

        <SummaryCards month={month} transactions={data.transactions} pending={data.pending} />

        {tab !== "categories" && data.pending.length > 0 && (
          <PendingBar month={month} pending={data.pending} onEditConfirm={confirmWithEdit} />
        )}

        {tab === "summary" && (
          <SummaryTab
            transactions={data.transactions}
            history={data.history}
            month={month}
            onOpen={openEdit}
          />
        )}
        {tab === "list" && (
          <ListTab
            transactions={data.transactions}
            categories={data.categories}
            filters={filters}
            onOpen={openEdit}
            onDelete={askDeleteTx}
          />
        )}
        {tab === "categories" && (
          <CategoriesTab categories={activeCategories} transactions={data.transactions} onDelete={askDeleteCat} />
        )}
      </main>

      <TransactionDialog
        state={editor}
        onClose={() => setEditor(null)}
        categories={data.categories}
        rulesById={rulesById}
        today={today}
        month={month}
      />
      <ConfirmDelete target={toDelete} onClose={() => setToDelete(null)} />
    </div>
  );
}
