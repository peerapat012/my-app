import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    // drizzle-kit ใช้ direct connection (ไม่ผ่าน pooler) สำหรับ migration
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
});
