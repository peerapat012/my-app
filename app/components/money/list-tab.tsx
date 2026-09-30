"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";
import type { CategoryDTO, TransactionDTO } from "@/lib/data";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Filters } from "./dashboard";
import { Segmented } from "./segmented";
import { cardClass } from "./summary-cards";
import { ListRow } from "./tx-row";
import { useSetParams } from "./url";

const ALL = "__all";

export function ListTab({
  transactions,
  categories,
  filters,
  onOpen,
  onDelete,
}: {
  transactions: TransactionDTO[];
  categories: CategoryDTO[];
  filters: Filters;
  onOpen: (t: TransactionDTO) => void;
  onDelete: (t: TransactionDTO) => void;
}) {
  const setParams = useSetParams();
  const [q, setQ] = useState(filters.q);

  // debounce ช่องค้นหาก่อนเขียนลง URL
  useEffect(() => {
    if (q === filters.q) return;
    const id = setTimeout(() => setParams({ q: q.trim() || null }), 250);
    return () => clearTimeout(id);
  }, [q, filters.q, setParams]);

  // ตัวเลือกหมวด: เฉพาะหมวดที่ใช้งานอยู่ + หมวดที่ archive แต่ยังมีรายการในเดือนนี้
  const catOptions = useMemo(() => {
    const used = new Set(transactions.map((t) => t.categoryId));
    return categories
      .filter((c) => (!c.archived || used.has(c.id)) && (!filters.type || c.type === filters.type))
      .map((c) => ({ value: c.id, label: c.name }));
  }, [categories, transactions, filters.type]);

  const needle = filters.q.toLowerCase();
  const shown = transactions.filter(
    (t) =>
      (!filters.type || t.type === filters.type) &&
      (!filters.cat || t.categoryId === filters.cat) &&
      (!needle || t.note.toLowerCase().includes(needle) || t.categoryName.toLowerCase().includes(needle)),
  );
  const filtering = Boolean(filters.q || filters.type || filters.cat);

  return (
    <section className={`${cardClass} py-3`}>
      <div className="flex flex-wrap items-center gap-2.5 border-b border-divider pt-1.5 pb-3">
        <div className="relative min-w-[180px] flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหาบันทึกหรือหมวด"
            aria-label="ค้นหา"
            className="h-10 rounded-[10px] bg-popover pl-9"
          />
        </div>
        <Segmented
          value={filters.type || "all"}
          onChange={(v) => setParams({ type: v === "all" ? null : v, cat: null })}
          options={[
            { value: "all", label: "ทั้งหมด" },
            { value: "income", label: "รายรับ" },
            { value: "expense", label: "รายจ่าย" },
          ]}
        />
        <Select
          items={[{ value: ALL, label: "ทุกหมวด" }, ...catOptions]}
          value={filters.cat || ALL}
          onValueChange={(v) => setParams({ cat: !v || v === ALL ? null : String(v) })}
        >
          <SelectTrigger aria-label="กรองหมวด" className="h-10! min-w-36 rounded-[10px] bg-popover">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>ทุกหมวด</SelectItem>
            {catOptions.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {shown.length === 0 && (
        <p className="py-3 text-muted-foreground">
          {filtering ? "ไม่พบรายการที่ตรงกับตัวกรอง" : "ยังไม่มีรายการเดือนนี้"}
        </p>
      )}
      {shown.map((t) => (
        <ListRow key={t.id} tx={t} onOpen={onOpen} onDelete={onDelete} />
      ))}
    </section>
  );
}
