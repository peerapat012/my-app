import type { TransactionType } from "@/db/app-schema";
import { TIME_ZONE, type DateStr, type Month } from "./months";

export function formatMoney(n: number): string {
  return "฿" + n.toLocaleString("th-TH", { maximumFractionDigits: 2 });
}

/** รายรับนำหน้า `+`, รายจ่าย `−` */
export function formatSigned(n: number, type: TransactionType): string {
  return (type === "income" ? "+" : "−") + formatMoney(n);
}

/** คงเหลือ: ติดลบนำหน้า `−` */
export function formatBalance(n: number): string {
  return (n < 0 ? "−" : "") + formatMoney(Math.abs(n));
}

// ใช้เที่ยงวัน UTC กันวันเลื่อนเมื่อแปลงเป็น Bangkok
const toDate = (s: string) => new Date(`${s}T12:00:00Z`);

export function formatMonth(month: Month): string {
  return new Intl.DateTimeFormat("th-TH-u-ca-gregory", {
    month: "long",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(toDate(`${month}-01`));
}

export function formatMonthShort(month: Month): string {
  return new Intl.DateTimeFormat("th-TH-u-ca-gregory", {
    month: "short",
    timeZone: TIME_ZONE,
  }).format(toDate(`${month}-01`));
}

export function formatDay(date: DateStr): string {
  return new Intl.DateTimeFormat("th-TH-u-ca-gregory", {
    day: "numeric",
    month: "short",
    timeZone: TIME_ZONE,
  }).format(toDate(date));
}
