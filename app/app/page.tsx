import { requireUser } from "@/lib/session";
import { getMonthData } from "@/lib/data";
import { currentMonth, isMonth, todayBangkok } from "@/lib/months";
import { Dashboard, type Tab } from "@/components/money/dashboard";

const TABS: Tab[] = ["summary", "list", "categories"];
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function Home({ searchParams }: PageProps<"/">) {
  const user = await requireUser();
  const sp = await searchParams;
  const monthParam = one(sp.month);
  const month = isMonth(monthParam) ? monthParam : currentMonth();
  const tabParam = one(sp.tab) as Tab;
  const tab = TABS.includes(tabParam) ? tabParam : "summary";
  const typeParam = one(sp.type);

  const data = await getMonthData(user.id, month);

  return (
    <Dashboard
      user={{ name: user.name, email: user.email }}
      month={month}
      today={todayBangkok()}
      tab={tab}
      filters={{
        q: one(sp.q),
        type: typeParam === "income" || typeParam === "expense" ? typeParam : "",
        cat: one(sp.cat),
      }}
      data={data}
    />
  );
}
