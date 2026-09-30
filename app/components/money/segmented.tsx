"use client";

import { cn } from "@/lib/utils";

// pill segmented control ตาม design (พื้น muted, อันที่เลือกเป็นพื้นขาว)
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
  size?: "md" | "lg";
}) {
  return (
    <div
      role="radiogroup"
      className={cn("flex rounded-pill p-[3px]", size === "lg" ? "bg-tabs p-1" : "bg-muted", className)}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 rounded-pill px-4 py-2 text-sm whitespace-nowrap transition-colors",
            size === "lg" && "flex-none px-5",
            value === o.value
              ? "bg-popover font-semibold shadow-[0_1px_4px_rgb(30_42_61/0.15)]"
              : "hover:bg-popover/50",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
