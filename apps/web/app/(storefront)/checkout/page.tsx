import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout-form";
import { privateApi } from "@/lib/api";
import type { Address, Cart } from "@/lib/types";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const [cart, addresses] = await Promise.all([privateApi<Cart>("cart").catch(() => null), privateApi<Address[]>("users/me/addresses").catch(() => [])]);
  if (!cart) redirect("/login?regreso=/checkout");
  if (!cart.items.length) redirect("/carrito");
  return <main id="contenido-principal" className="container-page py-10 md:py-14"><p className="eyebrow">Último paso</p><h1 className="display-title mt-3 text-[48px] md:text-[60px]">Confirma tu pedido</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-muted">Revisa la entrega y deja todo listo para coordinar con el comercio.</p><div className="mt-9"><CheckoutForm cart={cart} addresses={addresses} /></div></main>;
}
