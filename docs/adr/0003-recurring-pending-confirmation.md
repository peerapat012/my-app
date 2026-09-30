# 0003 — รายการประจำแบบ "รอยืนยัน" (คำนวณสด)

**Status:** Accepted (2026-09-30)

## Context
ทางเลือก: สร้างรายการอัตโนมัติด้วย cron, สร้างแบบ lazy ตอนเปิดดู, หรือให้ผู้ใช้ยืนยันเอง ผู้ใช้เลือกแบบยืนยันเอง เพราะยอดบางอย่าง (ค่าไฟ) ไม่เท่ากันทุกเดือน

## Decision
- `recurring_rule` เก็บแม่แบบรายเดือน (รายเดือนเท่านั้น)
- pending **ไม่เก็บเป็นแถว** — คำนวณจาก rule ที่ active, `start_month ≤ M`, วันกำหนด ≤ วันนี้ (Bangkok), และยังไม่มี `recurring_occurrence` ของ (rule, M)
- ยืนยัน/ข้าม เขียน `recurring_occurrence` (`confirmed` + transaction_id / `skipped`)
- `dayOfMonth` เกินจำนวนวันในเดือน → วันสุดท้ายของเดือน
- ยอดสรุปไม่นับ pending; แสดงยอดรอยืนยันแยกเป็นบรรทัดเล็ก
- สร้าง rule จาก toggle "ทำซ้ำทุกเดือน" ใน modal เท่านั้น (ไม่มีแท็บจัดการแยก)

## Consequences
- ไม่ต้องใช้ cron, ไม่มีงาน background
- ลบ transaction ที่ confirmed → occurrence ถูก cascade ลบ → กลับเป็น pending
- การหยุด/แก้ rule ทำผ่านการแก้รายการที่มาจาก rule หรือปุ่ม "หยุดทำซ้ำ" ในแถบรอยืนยัน
