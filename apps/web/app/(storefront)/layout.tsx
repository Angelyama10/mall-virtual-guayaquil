import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { privateApi } from "@/lib/api";
import type { User } from "@/lib/types";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const user = await privateApi<User>("auth/me").catch(() => null);
  return (
    <>
      <SiteHeader user={user} />
      {children}
      <SiteFooter />
    </>
  );
}
