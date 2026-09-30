"use client";

import { toast } from "sonner";
import type { ActionResult } from "@/app/actions";

/** เรียก server action แล้วแสดง toast; คืน true เมื่อสำเร็จ */
export async function runAction(p: Promise<ActionResult>, success?: string): Promise<boolean> {
  try {
    const res = await p;
    if (!res.ok) {
      toast.error(res.error);
      return false;
    }
    if (success) toast.success(success);
    return true;
  } catch {
    toast.error("เกิดข้อผิดพลาด ลองอีกครั้ง");
    return false;
  }
}
