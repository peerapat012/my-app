# Money Tracker — Spec

แปลง `design/Money Tracker v2.dc.html` เป็น web app จริง ดูคำศัพท์ที่ [CONTEXT.md](CONTEXT.md) และเหตุผลการตัดสินใจที่ [adr/](adr/)

## 1. Stack

| ส่วน | เลือก |
|---|---|
| Framework | Next.js (App Router, TypeScript) อยู่ในโฟลเดอร์ `app/` ของ repo — ผู้ใช้เป็นคนสร้างโปรเจกต์เอง |
| Package manager | npm |
| UI | shadcn/ui + Tailwind, ฟอนต์ IBM Plex Sans Thai, สีจาก design (§6) |
| DB | Neon Postgres |
| ORM | Drizzle ORM + drizzle-kit migrations, driver `@neondatabase/serverless` |
| Auth | Better Auth (Drizzle adapter): email/password + GitHub OAuth |
| Data access | Server Components อ่าน, Server Actions เขียน (ตรวจ session ทุก action) |
| Chart | shadcn Chart (Recharts) |
| Toast | Sonner (shadcn) |
| Test | Vitest — unit test เฉพาะ logic สำคัญ, ไม่มี e2e |
| Deploy | Vercel (web ก่อน, mobile/PWA ทีหลัง — แต่ layout ต้อง responsive ตั้งแต่แรกตาม design) |

## 2. Scope

### ตาม design
- Header "บัญชีของฉัน" + ตัวเลือกเดือน ← →
- การ์ด รายรับ / รายจ่าย / คงเหลือ (+ % ใช้ไป, แถบแดงเมื่อ > 90%)
- แท็บ **ภาพรวม**: รายจ่ายตามหมวด (bar + %), รายการล่าสุด 6 รายการ
- แท็บ **รายการ**: รายการทั้งเดือน เรียงวันที่ใหม่→เก่า
- แท็บ **หมวดหมู่**: เพิ่มหมวด (ชื่อ + ประเภท), รายการหมวดแยกรายจ่าย/รายรับ พร้อมยอดเดือนนี้, ลบ
- Modal **เพิ่มรายการ**: ประเภท, จำนวนเงิน, หมวด, บันทึก, วันที่

### เพิ่มจาก design
1. **แก้ไขรายการ** — คลิกแถวรายการ เปิด modal เดียวกับเพิ่ม (โหมดแก้ไข)
2. **ยืนยันก่อนลบ** — AlertDialog ยืนยัน → ลบ → toast "ลบแล้ว" (ใช้กับทั้งรายการและหมวด)
3. **ค้นหา/กรอง** ในแท็บรายการ: ช่องค้นหา (note/หมวด), กรองประเภท (ทั้งหมด/รายรับ/รายจ่าย), กรองหมวด
4. **แก้ชื่อหมวด** — inline edit ในแท็บหมวดหมู่
5. **รายการประจำ** (§4)
6. **กราฟ** — ในแท็บภาพรวม: bar chart รายรับ vs รายจ่าย 6 เดือนย้อนหลังนับถึงเดือนที่เลือก

### นอก scope (เฟสถัดไป)
Export CSV, งบประมาณต่อหมวด, verify email / ลืมรหัสผ่าน, PWA/mobile app, e2e test

## 3. หน้า / Routes

| Route | เนื้อหา |
|---|---|
| `/login` | การ์ดกลางจอ: email/password (สลับ เข้าสู่ระบบ/สมัคร) + ปุ่ม "เข้าสู่ระบบด้วย GitHub" — ออกแบบตามโทนสี design |
| `/` | แอปหลัก (ต้อง login; ไม่งั้น redirect `/login`) state อยู่ใน URL: `?month=2026-09&tab=summary\|list\|categories&q=&type=&cat=` ค่า default = เดือนปัจจุบัน (Bangkok), `summary` |
| `/api/auth/[...all]` | Better Auth handler |

Header มีเมนูผู้ใช้ (ชื่อ/อีเมล + ออกจากระบบ)

## 4. รายการประจำ (Recurring)

- **สร้าง**: ใน modal เพิ่ม/แก้รายการ มี toggle **"ทำซ้ำทุกเดือน"** → สร้าง `RecurringRule` จากค่าในฟอร์ม, `dayOfMonth` = วันของวันที่ที่เลือก, `startMonth` = เดือนของรายการนั้น; รายการที่บันทึกตอนนั้นนับเป็น occurrence `confirmed` ของเดือนแรก
- **หยุด**: แก้รายการที่มาจาก rule แล้วปิด toggle → rule `active=false` (รายการเดิมไม่หาย); หรือปุ่ม "หยุดทำซ้ำ" ในแถบรอยืนยัน
- **แก้ rule**: แก้รายการที่มาจาก rule โดย toggle ยังเปิด → ถามว่า "ใช้กับเดือนถัดไปด้วยไหม" ถ้าใช่อัปเดต amount/category/note/dayOfMonth ของ rule
- **รอยืนยัน** (คำนวณสด ไม่เก็บแถว): สำหรับเดือน M ที่ดูอยู่ rule แสดงเป็น pending เมื่อ
  - `active` และ `startMonth ≤ M`
  - วันกำหนด (`min(dayOfMonth, วันสุดท้ายของ M)`) ≤ วันนี้ (Bangkok) — เดือนอนาคตจึงไม่มี pending
  - ยังไม่มี `RecurringOccurrence` ของ (rule, M)
- **UI**: แถบ "รอยืนยัน N รายการ" ด้านบนแท็บภาพรวมและรายการ แต่ละอันมีปุ่ม
  - **ยืนยัน** → สร้าง Transaction ตาม rule + occurrence `confirmed`
  - **แก้แล้วยืนยัน** → modal prefill จาก rule → บันทึก = สร้าง Transaction + occurrence `confirmed`
  - **ข้าม** → occurrence `skipped`
- **ยอดสรุป**: ไม่นับ pending; ใต้การ์ดรายรับ/รายจ่ายแสดงบรรทัดเล็ก "รอยืนยัน +฿X / −฿X" เมื่อมี
- ลบ Transaction ที่ confirmed จาก rule → ลบ occurrence ด้วย (จะกลับเป็น pending) — ข้อความยืนยันต้องบอกเรื่องนี้; ถ้าต้องการไม่ให้กลับมาให้กด "ข้าม"

## 5. Data model (Drizzle / Postgres)

ตาราง Better Auth (`user`, `session`, `account`, `verification`) generate ด้วย Better Auth CLI

```
category
  id            uuid pk
  user_id       text fk → user.id  (cascade)
  type          text  'income'|'expense'
  name          text
  sort_order    int
  deleted_at    timestamptz null      -- soft delete
  created_at    timestamptz
  unique (user_id, type, name) where deleted_at is null

transaction
  id            uuid pk
  user_id       text fk → user.id (cascade)
  type          text  'income'|'expense'
  amount        numeric(12,2)  check > 0
  category_id   uuid fk → category.id
  note          text default ''
  date          date                  -- วันที่ตามปฏิทิน Bangkok
  recurring_rule_id uuid null fk → recurring_rule.id (set null)
  created_at, updated_at timestamptz
  index (user_id, date)

recurring_rule
  id, user_id, type, amount numeric(12,2), category_id, note
  day_of_month  smallint 1–31
  start_month   char(7)  'YYYY-MM'
  active        boolean default true
  created_at, updated_at

recurring_occurrence
  rule_id       uuid fk → recurring_rule.id (cascade)
  month         char(7)
  status        text 'confirmed'|'skipped'
  transaction_id uuid null fk → transaction.id (cascade)
  pk (rule_id, month)
```

- `amount` อ่านจาก DB เป็น string → แปลงเป็น number ที่ขอบ data layer (ยอดไม่เกิน 2 ทศนิยม ปลอดภัยพอสำหรับบัญชีส่วนตัว)
- หมวดตั้งต้น seed ใน Better Auth `databaseHooks.user.create.after`:
  - รายจ่าย: อาหาร, เดินทาง, ที่พัก, ช้อปปิ้ง, บันเทิง, สุขภาพ, บิล/ค่าน้ำไฟ
  - รายรับ: เงินเดือน, ฟรีแลนซ์, อื่นๆ
- ไม่มี transaction ตัวอย่าง (เริ่มว่าง)

## 6. Design tokens (จาก design)

| Token | ค่า | ใช้ |
|---|---|---|
| background | `#e6ebf2` | พื้นหลังหน้า |
| foreground | `#1e2a3d` | ตัวอักษร |
| card | `#f7f9fc` | การ์ด/section |
| popover | `#ffffff` | modal, pill ที่เลือก |
| primary | `#2f6fd0` (hover `#1f55a8`) | ปุ่มหลัก, bar |
| muted | `#e3e8f0` | track ของ bar, เส้นคั่น, segmented bg |
| muted-foreground | `#5b6778` | ข้อความรอง |
| border | `#b9c3d1` | เส้นใต้ header |
| tabs bg | `#d7dfea` | พื้นแท็บ |
| badge | `#e3ebf8` / `#22345a` | ป้ายหมวด |
| income | `#239a52` | ยอดรายรับ |
| expense / destructive | `#d33a3a` (hover bg `#fde8e8`) | ยอดรายจ่าย, ลบ |
| chart palette | `#2f6fd0 #239a52 #7b52c4 #e08a2c #d33a3a #2aa3b8 #5b6778` | bar หมวด |

รูปทรง: การ์ด radius 14px + shadow `0 2px 8px rgba(30,42,61,.08)`; ปุ่ม/แท็บ pill (`999px`); input radius 10px; modal radius 18px, max-width 420px; container max-width 1120px
Map ลง CSS variables ของ shadcn (`--background`, `--primary`, …) + เพิ่ม `--income`, `--expense`; ปรับรายละเอียดได้ตามความเหมาะสมของ shadcn

## 7. Formatting

- เงิน: `฿` + `toLocaleString('th-TH', {maximumFractionDigits: 2})`; รายรับนำหน้า `+`, รายจ่าย `−`; คงเหลือติดลบนำหน้า `−`
- เดือน: `Intl.DateTimeFormat('th-TH-u-ca-gregory', {month:'long', year:'numeric', timeZone:'Asia/Bangkok'})` → "กันยายน 2026"
- วันที่ในแถว: `{day:'numeric', month:'short'}` ปฏิทิน gregory → "5 ก.ย."
- "วันนี้" คำนวณใน Asia/Bangkok เสมอ (ทั้ง server และ client)

## 8. Tests (Vitest, unit เท่านั้น)

- สรุปรายเดือน: รายรับ/รายจ่าย/คงเหลือ/% ใช้ไป (cap 100, รายรับ 0), รายจ่ายตามหมวดเรียงมาก→น้อย
- pending recurring: startMonth, active, วันกำหนดยังไม่ถึง, เดือนอนาคต, confirmed/skipped, วันที่ 31 ในเดือน 30 วัน / ก.พ. (ปีอธิกสุรทิน)
- helper เดือน: ±1 ข้ามปี, วันสุดท้ายของเดือน, "วันนี้" Bangkok
- formatting เงิน/วันที่

## 9. Environment

`.env.example`:
```
DATABASE_URL=            # Neon pooled connection string
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

## 10. ลำดับการทำ (หลังผู้ใช้สร้าง Next.js ใน `app/`)

1. ติดตั้ง deps, shadcn init, ตั้ง tokens + ฟอนต์
2. Drizzle schema + Better Auth + migration, seed หมวดตั้งต้น
3. หน้า `/login` + auth guard
4. Pure logic (`lib/`) + unit tests: summary, months, recurring, format
5. หน้าหลัก: header/เดือน, การ์ด, แท็บภาพรวม (+กราฟ), รายการ (+ค้นหา/กรอง), หมวดหมู่ (+แก้ชื่อ)
6. Modal เพิ่ม/แก้รายการ + toggle ทำซ้ำ, ยืนยันลบ + toast
7. แถบรอยืนยัน
8. Deploy Vercel
