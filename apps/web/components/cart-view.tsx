"use client";

import Image from "next/image";
import Link from "next/link";
import { LoaderCircle, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { clientApi } from "@/lib/client-api";
import type { Cart } from "@/lib/types";
import { money, productImage } from "@/lib/utils";

export function CartView({ initialCart }: { initialCart: Cart }) {
  const [cart, setCart] = useState(initialCart);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const subtotal = useMemo(() => cart.items.reduce((sum, item) => sum + Number(item.variant?.price ?? item.product.basePrice) * item.quantity, 0), [cart]);

  async function update(itemId: string, quantity: number) {
    setBusy(itemId);
    setError("");
    try {
      const updated = await clientApi<Cart>(`/api/backend/cart/items/${itemId}`, { method: "PATCH", body: JSON.stringify({ quantity }) });
      setCart(updated);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No pudimos actualizar el carrito.");
    } finally { setBusy(null); }
  }

  async function remove(itemId: string) {
    setBusy(itemId);
    setError("");
    try {
      setCart(await clientApi<Cart>(`/api/backend/cart/items/${itemId}`, { method: "DELETE" }));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No pudimos eliminar el producto."); }
    finally { setBusy(null); }
  }

  if (!cart.items.length) {
    return <div className="empty-state"><div><ShoppingBag className="mx-auto text-teal" size={36} /><h2 className="mt-5 text-xl font-extrabold">Tu carrito está esperando</h2><p className="mt-2 text-sm text-muted">Explora el mall y agrega productos de una tienda.</p><Link className="button-primary mt-6" href="/explorar">Explorar productos</Link></div></div>;
  }

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_350px]">
      <section className="surface overflow-hidden" aria-label="Productos en el carrito">
        {cart.items.map((item) => {
          const price = Number(item.variant?.price ?? item.product.basePrice);
          return (
            <article key={item.id} className="grid grid-cols-[90px_1fr] gap-4 border-b border-line p-4 last:border-0 sm:grid-cols-[120px_1fr_auto] sm:p-5">
              <Link className="relative aspect-square overflow-hidden rounded-[6px] bg-white" href={`/producto/${item.product.slug}`}><Image src={productImage(item.product)} alt={item.product.name} fill className="object-cover" sizes="120px" /></Link>
              <div className="min-w-0"><Link className="font-extrabold hover:text-teal" href={`/producto/${item.product.slug}`}>{item.product.name}</Link><p className="mt-2 text-sm text-muted">{item.variant?.name ?? "Presentación estándar"}</p><p className="mt-3 font-extrabold">{money(price)}</p><div className="mt-4 flex items-center gap-2 sm:hidden"><QuantityControl quantity={item.quantity} busy={busy === item.id} onChange={(quantity) => update(item.id, quantity)} /><button className="button-danger !size-10 !p-0" type="button" onClick={() => remove(item.id)} aria-label="Eliminar producto"><Trash2 size={16} /></button></div></div>
              <div className="hidden items-end justify-between sm:flex sm:flex-col"><strong>{money(price * item.quantity)}</strong><div className="flex items-center gap-2"><QuantityControl quantity={item.quantity} busy={busy === item.id} onChange={(quantity) => update(item.id, quantity)} /><button className="button-danger !size-10 !p-0" type="button" onClick={() => remove(item.id)} aria-label="Eliminar producto"><Trash2 size={16} /></button></div></div>
            </article>
          );
        })}
      </section>
      <aside className="surface h-fit p-6 lg:sticky lg:top-24">
        <h2 className="text-lg font-extrabold">Resumen</h2>
        <div className="mt-6 grid gap-3 text-sm"><div className="flex justify-between text-muted"><span>Subtotal</span><span>{money(subtotal)}</span></div><div className="flex justify-between text-muted"><span>Envío</span><span>Se coordina al confirmar</span></div><div className="mt-2 flex justify-between border-t border-line pt-5 text-lg font-extrabold"><span>Total</span><span>{money(subtotal)}</span></div></div>
        {error && <p className="mt-4 text-sm text-[var(--danger)]" role="alert">{error}</p>}
        <Link className="button-primary mt-6 w-full" href="/checkout">Continuar al checkout</Link>
        <Link className="button-quiet mt-2 w-full" href="/explorar">Seguir comprando</Link>
        <p className="mt-4 text-center text-xs leading-5 text-muted">Por ahora, cada carrito contiene productos de una sola tienda.</p>
      </aside>
    </div>
  );
}

function QuantityControl({ quantity, busy, onChange }: { quantity: number; busy: boolean; onChange: (quantity: number) => void }) {
  return <div className="flex h-10 items-center overflow-hidden rounded-[6px] border border-line bg-white"><button type="button" className="grid size-10 place-items-center" disabled={busy || quantity <= 1} onClick={() => onChange(quantity - 1)} aria-label="Disminuir cantidad"><Minus size={15} /></button><span className="grid min-w-9 place-items-center text-sm font-extrabold">{busy ? <LoaderCircle className="animate-spin" size={15} /> : quantity}</span><button type="button" className="grid size-10 place-items-center" disabled={busy} onClick={() => onChange(quantity + 1)} aria-label="Aumentar cantidad"><Plus size={15} /></button></div>;
}
