import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  // เปิด GitHub เมื่อใส่ credentials ใน env แล้วเท่านั้น
  socialProviders: process.env.GITHUB_CLIENT_ID
    ? {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        },
      }
    : {},
  // ต้องเป็นตัวสุดท้าย — ให้ server actions ตั้ง cookie ได้
  plugins: [nextCookies()],
});
