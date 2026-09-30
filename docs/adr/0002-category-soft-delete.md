# 0002 — ลบหมวดแบบ soft delete

**Status:** Accepted (2026-09-30)

## Context
ใน design การลบหมวดทิ้งรายการที่อ้างชื่อหมวดนั้นไว้แบบกำพร้า

## Decision
ลบหมวด = ตั้ง `deleted_at` ซ่อนจากตัวเลือกและแท็บหมวดหมู่ แต่รายการเก่ายังอ้าง `category_id` และแสดงชื่อเดิม ชื่อซ้ำกับหมวดที่ archive แล้วสร้างใหม่ได้ (unique index แบบ partial)

## Consequences
- query ตัวเลือกหมวดต้องกรอง `deleted_at is null`; query แสดงรายการ join ได้ทุกหมวด
- ยังไม่มี UI กู้คืนหมวด
- rule รายการประจำที่ใช้หมวดที่ archive ยังทำงานต่อ (แสดงชื่อเดิม)
