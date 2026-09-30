import type { TransactionType } from "@/db/app-schema";

// หมวดตั้งต้นของผู้ใช้ใหม่ — docs/SPEC.md §5
export const DEFAULT_CATEGORIES: Record<TransactionType, string[]> = {
  expense: ["อาหาร", "เดินทาง", "ที่พัก", "ช้อปปิ้ง", "บันเทิง", "สุขภาพ", "บิล/ค่าน้ำไฟ"],
  income: ["เงินเดือน", "ฟรีแลนซ์", "อื่นๆ"],
};

export function defaultCategoryRows(userId: string) {
  return (Object.keys(DEFAULT_CATEGORIES) as TransactionType[]).flatMap((type) =>
    DEFAULT_CATEGORIES[type].map((name, i) => ({ userId, type, name, sortOrder: i })),
  );
}
