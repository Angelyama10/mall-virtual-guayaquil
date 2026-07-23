import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { privateApi } from "@/lib/api";
import type { User } from "@/lib/types";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await privateApi<User>("auth/me").catch(() => null);
  if (!user) redirect("/login");
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
