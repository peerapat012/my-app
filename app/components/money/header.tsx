"use client";

import { useRouter } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon, LogOutIcon, UserIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { addMonths, type Month } from "@/lib/months";
import { formatMonth } from "@/lib/format";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle";
import { useSetParams } from "./url";

const navBtn =
  "flex size-9 items-center justify-center rounded-full transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring";

export function Header({ user, month }: { user: { name: string; email: string }; month: Month }) {
  const router = useRouter();
  const setParams = useSetParams();
  const go = (delta: number) => setParams({ month: addMonths(month, delta) }, { push: true });

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
      <h1 className="text-[28px] font-bold sm:text-[32px]">บัญชีของฉัน</h1>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-pill bg-popover p-1 shadow-card">
          <button type="button" aria-label="เดือนก่อน" className={navBtn} onClick={() => go(-1)}>
            <ChevronLeftIcon className="size-4" />
          </button>
          <span className="min-w-[150px] text-center font-semibold tabular-nums">{formatMonth(month)}</span>
          <button type="button" aria-label="เดือนถัดไป" className={navBtn} onClick={() => go(1)}>
            <ChevronRightIcon className="size-4" />
          </button>
        </div>
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="เมนูผู้ใช้"
            className="flex size-11 items-center justify-center rounded-full bg-popover shadow-card transition-colors hover:bg-secondary"
          >
            <UserIcon className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="truncate font-semibold text-foreground">{user.name}</div>
                <div className="truncate text-xs font-normal">{user.email}</div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await authClient.signOut();
                router.replace("/login");
                router.refresh();
              }}
            >
              <LogOutIcon /> ออกจากระบบ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
