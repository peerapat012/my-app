"use client";

import { useState, useTransition } from "react";
import { PencilIcon, XIcon } from "lucide-react";
import type { CategoryDTO, TransactionDTO } from "@/lib/data";
import type { TransactionType } from "@/db/app-schema";
import { createCategory, renameCategory } from "@/app/actions";
import { totalsByCategory } from "@/lib/summary";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Segmented } from "./segmented";
import { cardClass } from "./summary-cards";
import { runAction } from "./run-action";

const GROUPS: { type: TransactionType; title: string }[] = [
  { type: "expense", title: "หมวดรายจ่าย" },
  { type: "income", title: "หมวดรายรับ" },
];

const iconBtn =
  "flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors";

export function CategoriesTab({
  categories,
  transactions,
  onDelete,
}: {
  categories: CategoryDTO[];
  transactions: TransactionDTO[];
  onDelete: (c: CategoryDTO) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [pending, startTransition] = useTransition();
  const totals = totalsByCategory(transactions);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      if (await runAction(createCategory(name, type), "เพิ่มหมวดแล้ว")) setName("");
    });
  };

  return (
    <section className={`${cardClass} flex flex-col gap-[18px]`}>
      <form onSubmit={add} className="flex flex-wrap items-center gap-2.5">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ชื่อหมวดใหม่ เช่น สัตว์เลี้ยง"
          aria-label="ชื่อหมวดใหม่"
          maxLength={40}
          className="h-10 min-w-[180px] flex-1 rounded-[10px] bg-popover"
        />
        <Segmented
          value={type}
          onChange={setType}
          options={[
            { value: "expense", label: "รายจ่าย" },
            { value: "income", label: "รายรับ" },
          ]}
        />
        <Button type="submit" disabled={pending} className="h-10 rounded-pill px-[18px] font-semibold">
          เพิ่มหมวด
        </Button>
      </form>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5">
        {GROUPS.map((g) => (
          <div key={g.type}>
            <h3 className="mb-2 text-base font-semibold">{g.title}</h3>
            {categories
              .filter((c) => c.type === g.type)
              .map((c) => (
                <CategoryRow key={c.id} cat={c} total={totals.get(c.id)} onDelete={onDelete} />
              ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function CategoryRow({
  cat,
  total,
  onDelete,
}: {
  cat: CategoryDTO;
  total: number | undefined;
  onDelete: (c: CategoryDTO) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(cat.name);
  const [pending, startTransition] = useTransition();

  const save = () => {
    const next = value.trim();
    if (!next || next === cat.name) {
      setValue(cat.name);
      setEditing(false);
      return;
    }
    startTransition(async () => {
      if (await runAction(renameCategory(cat.id, next), "เปลี่ยนชื่อแล้ว")) setEditing(false);
    });
  };

  return (
    <div className="flex min-h-10 items-center justify-between gap-2 border-b border-divider py-1.5">
      {editing ? (
        <Input
          autoFocus
          value={value}
          disabled={pending}
          maxLength={40}
          aria-label={`ชื่อใหม่ของ ${cat.name}`}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setValue(cat.name);
              setEditing(false);
            }
          }}
          className="h-8 flex-1 rounded-[10px] bg-popover"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="group flex min-w-0 items-center gap-1.5 text-left"
          title="คลิกเพื่อแก้ชื่อ"
        >
          <span className="truncate">{cat.name}</span>
          <PencilIcon className="size-3 flex-none text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
        </button>
      )}
      <span className="flex flex-none items-center gap-2">
        <span className="text-[13px] text-muted-foreground tabular-nums">{total ? formatMoney(total) : "—"}</span>
        <button
          type="button"
          onClick={() => onDelete(cat)}
          aria-label={`ลบหมวด ${cat.name}`}
          className={`${iconBtn} hover:bg-destructive-muted hover:text-destructive`}
        >
          <XIcon className="size-4" />
        </button>
      </span>
    </div>
  );
}
