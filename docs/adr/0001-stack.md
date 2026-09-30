# 0001 — Next.js + Neon + Drizzle + Better Auth

**Status:** Accepted (2026-09-30)

## Context
design เดิมเป็น prototype เก็บข้อมูลใน localStorage (เครื่องเดียว) ต้องการเป็น web app จริงบน Vercel ใช้ได้หลายเครื่อง และต่อยอดไป mobile ภายหลัง

## Decision
- Next.js App Router ในโฟลเดอร์ `app/`, npm
- Neon Postgres + Drizzle ORM (เบา, เข้ากับ serverless, migration ด้วย drizzle-kit)
- Better Auth (Drizzle adapter) — email/password + GitHub; ยังไม่มี verify email / reset password
- Server Components อ่าน + Server Actions เขียน แทนการทำ REST API
- shadcn/ui ใช้สีจาก design

## Consequences
- ต้องมี Neon project + GitHub OAuth app ก่อนรัน
- ทุก query/action ต้อง scope ด้วย `userId` จาก session
- ถ้าทำ mobile native ภายหลังอาจต้องเพิ่ม API routes
