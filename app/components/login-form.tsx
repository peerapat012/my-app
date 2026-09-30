"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/money/segmented";

type Mode = "signin" | "signup";

export function LoginForm({ githubEnabled }: { githubEnabled: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    setPending(true);
    setError(null);
    const { error } =
      mode === "signin"
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ email, password, name: String(form.get("name") || email.split("@")[0]) });
    setPending(false);
    if (error) {
      setError(
        error.status === 401 || error.code === "INVALID_EMAIL_OR_PASSWORD"
          ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
          : error.code === "USER_ALREADY_EXISTS" || error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
            ? "อีเมลนี้มีบัญชีแล้ว"
            : error.code === "PASSWORD_TOO_SHORT"
              ? "รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร"
              : (error.message ?? "เกิดข้อผิดพลาด ลองอีกครั้ง"),
      );
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="flex w-full max-w-[400px] flex-col gap-5 rounded-[18px] bg-card p-7 shadow-card">
      <div>
        <h1 className="text-2xl font-bold">บัญชีของฉัน</h1>
        <p className="text-sm text-muted-foreground">บันทึกรายรับรายจ่ายของคุณ</p>
      </div>

      <Segmented
        value={mode}
        onChange={(m) => {
          setMode(m);
          setError(null);
        }}
        options={[
          { value: "signin", label: "เข้าสู่ระบบ" },
          { value: "signup", label: "สมัครสมาชิก" },
        ]}
      />

      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        {mode === "signup" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">ชื่อ</Label>
            <Input id="name" name="name" autoComplete="name" placeholder="ชื่อที่แสดง" />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">อีเมล</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">รหัสผ่าน</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" disabled={pending} className="mt-1 h-11 rounded-pill text-[15px] font-semibold shadow-cta">
          {pending ? "กำลังดำเนินการ…" : mode === "signin" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
        </Button>
      </form>

      {githubEnabled && (
        <>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-divider" />
            หรือ
            <span className="h-px flex-1 bg-divider" />
          </div>
          <Button
            variant="outline"
            className="h-11 rounded-pill bg-popover text-[15px]"
            onClick={() => authClient.signIn.social({ provider: "github", callbackURL: "/" })}
          >
            เข้าสู่ระบบด้วย GitHub
          </Button>
        </>
      )}
    </div>
  );
}
