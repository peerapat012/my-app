// helper เดือน/วันที่ — ตีความใน Asia/Bangkok เสมอ (docs/CONTEXT.md)
export const TIME_ZONE = "Asia/Bangkok";

/** Month ในรูป `YYYY-MM` */
export type Month = string;
/** วันที่ปฏิทินในรูป `YYYY-MM-DD` */
export type DateStr = string;

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isMonth(v: unknown): v is Month {
  return typeof v === "string" && MONTH_RE.test(v);
}

export function isDateStr(v: unknown): v is DateStr {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number);
  return m >= 1 && m <= 12 && d >= 1 && d <= lastDayOfMonth(`${v.slice(0, 7)}`) && y > 0;
}

/** วันนี้ใน Bangkok เป็น `YYYY-MM-DD` */
export function todayBangkok(now: Date = new Date()): DateStr {
  // en-CA ให้รูปแบบ YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function currentMonth(now: Date = new Date()): Month {
  return todayBangkok(now).slice(0, 7);
}

export function monthOf(date: DateStr): Month {
  return date.slice(0, 7);
}

export function addMonths(month: Month, delta: number): Month {
  const [y, m] = month.split("-").map(Number);
  const idx = y * 12 + (m - 1) + delta;
  const ny = Math.floor(idx / 12);
  const nm = idx - ny * 12 + 1;
  return `${String(ny).padStart(4, "0")}-${String(nm).padStart(2, "0")}`;
}

export function lastDayOfMonth(month: Month): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** วันแรก/วันสุดท้ายของเดือน (สำหรับ query ช่วงวันที่) */
export function monthRange(month: Month): { start: DateStr; end: DateStr } {
  return { start: `${month}-01`, end: `${month}-${String(lastDayOfMonth(month)).padStart(2, "0")}` };
}

/** วันที่ของ dayOfMonth ในเดือนนั้น — ถ้าเกินใช้วันสุดท้ายของเดือน */
export function dueDate(month: Month, dayOfMonth: number): DateStr {
  const d = Math.min(dayOfMonth, lastDayOfMonth(month));
  return `${month}-${String(d).padStart(2, "0")}`;
}
