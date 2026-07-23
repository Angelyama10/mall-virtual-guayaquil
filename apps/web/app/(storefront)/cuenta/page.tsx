import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountView } from "@/components/account-view";
import { privateApi } from "@/lib/api";
import type { Address, Order, User } from "@/lib/types";
import { roleHome } from "@/lib/utils";

export const metadata: Metadata = { title: "Mi cuenta" };

export default async function AccountPage() {
  const user = await privateApi<User>("auth/me").catch(() => null);
  if (!user) redirect("/login?regreso=/cuenta");
  if (user.role !== "CUSTOMER") redirect(roleHome(user.role));
  const [orders, addresses] = await Promise.all([privateApi<Order[]>("orders"), privateApi<Address[]>("users/me/addresses")]);
  return <main id="contenido-principal" className="container-page py-10 md:py-14"><AccountView user={user} initialOrders={orders} initialAddresses={addresses} /></main>;
}
