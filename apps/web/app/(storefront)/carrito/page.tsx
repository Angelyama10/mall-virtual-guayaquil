import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CartView } from "@/components/cart-view";
import { privateApi } from "@/lib/api";
import type { Cart } from "@/lib/types";

export const metadata: Metadata = { title: "Carrito" };

export default async function CartPage() {
  const cart = await privateApi<Cart>("cart").catch(() => null);
  if (!cart) redirect("/login?regreso=/carrito");
  return <main id="contenido-principal" className="container-page py-10 md:py-14"><p className="eyebrow">Tu selección</p><h1 className="display-title mt-3 text-[48px] md:text-[60px]">Carrito</h1><div className="mt-9"><CartView initialCart={cart} /></div></main>;
}
