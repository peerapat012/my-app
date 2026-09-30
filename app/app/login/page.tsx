import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "เข้าสู่ระบบ — Money Tracker" };

export default async function LoginPage() {
  if (await getSession()) redirect("/");
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <LoginForm githubEnabled={Boolean(process.env.GITHUB_CLIENT_ID)} />
    </main>
  );
}
