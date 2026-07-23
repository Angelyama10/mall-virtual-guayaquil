"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ChevronRight, LogOut, MapPin, Package, Plus, UserRound } from "lucide-react";
import { clientApi } from "@/lib/client-api";
import type { Address, Order, User } from "@/lib/types";
import { money, orderStatusLabel, shortDate } from "@/lib/utils";

export function AccountView({ user, initialOrders, initialAddresses }: { user: User; initialOrders: Order[]; initialAddresses: Address[] }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function logout() { await clientApi("/api/session/logout", { method: "POST" }); router.push("/"); router.refresh(); }
  async function addAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); const form = new FormData(event.currentTarget);
    try {
      const address = await clientApi<Address>("/api/backend/users/me/addresses", { method: "POST", body: JSON.stringify({ label: form.get("label"), street: form.get("street"), city: form.get("city"), state: form.get("state"), reference: form.get("reference"), isDefault: !addresses.length }) });
      setAddresses((current) => [...current, address]); setShowForm(false); event.currentTarget.reset();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No pudimos guardar la dirección."); }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="surface h-fit overflow-hidden lg:sticky lg:top-24">
        <div className="bg-ink p-6 text-white"><span className="grid size-11 place-items-center rounded-[6px] bg-coral"><UserRound size={22} /></span><p className="mt-4 truncate text-sm font-extrabold">{user.email}</p><p className="mt-1 text-xs text-white/55">Cuenta de cliente</p></div>
        <nav className="grid p-2" aria-label="Mi cuenta"><a className="button-quiet justify-start !bg-[#edf5f2] !text-teal" href="#pedidos"><Package size={17} /> Pedidos</a><a className="button-quiet justify-start" href="#direcciones"><MapPin size={17} /> Direcciones</a><button type="button" className="button-quiet justify-start text-[var(--danger)]" onClick={logout}><LogOut size={17} /> Cerrar sesión</button></nav>
      </aside>
      <div className="min-w-0 space-y-10">
        <section id="pedidos"><div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Historial</p><h2 className="display-title mt-2 text-[40px]">Mis pedidos</h2></div><Link className="button-secondary" href="/explorar">Comprar</Link></div>
          {initialOrders.length ? <div className="surface mt-6 overflow-hidden">{initialOrders.map((order) => <article key={order.id} className="grid gap-4 border-b border-line p-5 last:border-0 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-3"><strong className="text-sm">{order.orderNumber}</strong><span className="status-pill">{orderStatusLabel(order.status)}</span></div><p className="mt-2 text-sm text-muted">{order.store?.name ?? "Tienda local"} · {shortDate(order.createdAt)}</p></div><div className="flex items-center justify-between gap-5 sm:justify-end"><strong>{money(order.total)}</strong><Link className="grid size-10 place-items-center rounded-[6px] border border-line" href={`/cuenta/pedidos/${order.id}`} aria-label={`Ver pedido ${order.orderNumber}`}><ChevronRight size={17} /></Link></div></article>)}</div> : <div className="empty-state mt-6"><div><Package className="mx-auto text-teal" size={32} /><h3 className="mt-4 font-extrabold">Aún no tienes pedidos</h3><p className="mt-2 text-sm text-muted">Tu próxima compra local puede empezar hoy.</p></div></div>}
        </section>
        <section id="direcciones"><div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Entrega</p><h2 className="display-title mt-2 text-[40px]">Mis direcciones</h2></div><button type="button" className="button-secondary" onClick={() => setShowForm((value) => !value)}><Plus size={17} /> Nueva</button></div>
          {showForm && <form className="surface mt-6 grid gap-4 p-5 sm:grid-cols-2" onSubmit={addAddress}><label className="grid gap-2 text-sm font-bold">Etiqueta<input className="field" name="label" defaultValue="Casa" required /></label><label className="grid gap-2 text-sm font-bold">Ciudad<input className="field" name="city" defaultValue="Guayaquil" required /></label><label className="grid gap-2 text-sm font-bold sm:col-span-2">Dirección<input className="field" name="street" required /></label><label className="grid gap-2 text-sm font-bold">Provincia<input className="field" name="state" defaultValue="Guayas" /></label><label className="grid gap-2 text-sm font-bold">Referencia<input className="field" name="reference" /></label>{error && <p className="text-sm text-[var(--danger)] sm:col-span-2" role="alert">{error}</p>}<div className="flex gap-2 sm:col-span-2"><button className="button-primary" type="submit">Guardar dirección</button><button className="button-quiet" type="button" onClick={() => setShowForm(false)}>Cancelar</button></div></form>}
          <div className="mt-6 grid gap-4 md:grid-cols-2">{addresses.map((address) => <article key={address.id} className="surface p-5"><div className="flex items-center justify-between"><span className="grid size-9 place-items-center rounded-[6px] bg-[#edf5f2] text-teal"><MapPin size={18} /></span>{address.isDefault && <span className="status-pill">Principal</span>}</div><h3 className="mt-4 font-extrabold">{address.label ?? "Dirección"}</h3><p className="mt-2 text-sm leading-6 text-muted">{address.street}<br />{address.city}, {address.state}</p>{address.reference && <p className="mt-2 text-xs text-muted">{address.reference}</p>}</article>)}</div>
        </section>
      </div>
    </div>
  );
}
