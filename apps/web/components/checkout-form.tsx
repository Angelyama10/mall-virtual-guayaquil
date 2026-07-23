"use client";

import { CheckCircle2, LoaderCircle, MapPin, MessageCircle, PackageCheck, Store } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { clientApi } from "@/lib/client-api";
import type { Address, Cart, Order } from "@/lib/types";
import { money } from "@/lib/utils";

export function CheckoutForm({ cart, addresses: initialAddresses }: { cart: Cart; addresses: Address[] }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [addressId, setAddressId] = useState(initialAddresses.find((item) => item.isDefault)?.id ?? initialAddresses[0]?.id ?? "");
  const [deliveryType, setDeliveryType] = useState<"HOME_DELIVERY" | "PICKUP">("HOME_DELIVERY");
  const [showAddress, setShowAddress] = useState(!initialAddresses.length);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const total = useMemo(() => cart.items.reduce((sum, item) => sum + Number(item.variant?.price ?? item.product.basePrice) * item.quantity, 0), [cart]);

  async function createAddress(form: FormData) {
    const address = await clientApi<Address>("/api/backend/users/me/addresses", { method: "POST", body: JSON.stringify({ label: form.get("label"), street: form.get("street"), city: form.get("city"), state: form.get("state"), reference: form.get("reference"), isDefault: true }) });
    setAddresses((current) => [...current, address]);
    setAddressId(address.id);
    setShowAddress(false);
    return address.id;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      let selectedAddress = addressId;
      if (deliveryType === "HOME_DELIVERY" && showAddress) selectedAddress = await createAddress(form);
      if (deliveryType === "HOME_DELIVERY" && !selectedAddress) throw new Error("Agrega una dirección para recibir tu pedido.");
      const created = await clientApi<Order>("/api/backend/orders/checkout", { method: "POST", body: JSON.stringify({ addressId: deliveryType === "HOME_DELIVERY" ? selectedAddress : undefined, deliveryType, notes: form.get("notes") || undefined }) });
      setOrder(created);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No pudimos confirmar el pedido."); }
    finally { setLoading(false); }
  }

  if (order) {
    return <section className="surface mx-auto max-w-2xl p-7 text-center md:p-10"><span className="mx-auto grid size-16 place-items-center rounded-full bg-[#e9f3ef] text-[var(--success)]"><CheckCircle2 size={32} /></span><p className="eyebrow mt-6">Pedido creado</p><h1 className="display-title mt-3 text-[45px]">¡Listo para confirmar!</h1><p className="mt-4 text-sm leading-7 text-muted">Tu pedido <strong className="text-ink">{order.orderNumber}</strong> fue registrado por {money(order.total)}. Continúa en WhatsApp para coordinar pago y entrega con la tienda.</p>{order.whatsappCheckoutUrl && <a className="button-primary mt-7" href={order.whatsappCheckoutUrl} target="_blank" rel="noreferrer"><MessageCircle size={18} /> Abrir WhatsApp</a>}<a className="button-quiet mt-3 block" href="/cuenta">Ver mis pedidos</a></section>;
  }

  return (
    <form onSubmit={submit} className="grid gap-7 lg:grid-cols-[1fr_350px]">
      <div className="grid gap-6">
        <section className="surface p-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-[6px] bg-teal text-white"><PackageCheck size={19} /></span><div><p className="text-xs font-bold text-muted">Paso 1</p><h2 className="font-extrabold">Forma de entrega</h2></div></div><div className="mt-6 grid grid-cols-2 rounded-[7px] border border-line bg-white p-1"><button type="button" className={`min-h-11 rounded-[5px] text-sm font-extrabold ${deliveryType === "HOME_DELIVERY" ? "bg-teal text-white" : "text-muted"}`} onClick={() => setDeliveryType("HOME_DELIVERY")}>A domicilio</button><button type="button" className={`min-h-11 rounded-[5px] text-sm font-extrabold ${deliveryType === "PICKUP" ? "bg-teal text-white" : "text-muted"}`} onClick={() => setDeliveryType("PICKUP")}>Retiro en tienda</button></div></section>
        {deliveryType === "HOME_DELIVERY" && <section className="surface p-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-[6px] bg-coral text-white"><MapPin size={19} /></span><div><p className="text-xs font-bold text-muted">Paso 2</p><h2 className="font-extrabold">Dirección de entrega</h2></div></div>{addresses.length > 0 && !showAddress && <div className="mt-6 grid gap-3">{addresses.map((address) => <label key={address.id} className={`flex cursor-pointer gap-3 rounded-[7px] border p-4 ${addressId === address.id ? "border-teal bg-[#f2f8f6]" : "border-line bg-white"}`}><input type="radio" name="addressId" value={address.id} checked={addressId === address.id} onChange={() => setAddressId(address.id)} /><span><strong className="text-sm">{address.label ?? "Dirección"}</strong><span className="mt-1 block text-sm text-muted">{address.street}, {address.city}</span></span></label>)}<button type="button" className="button-quiet justify-start" onClick={() => setShowAddress(true)}>+ Usar una dirección nueva</button></div>}{showAddress && <AddressFields onCancel={addresses.length ? () => setShowAddress(false) : undefined} />}</section>}
        <section className="surface p-6"><label className="grid gap-2 text-sm font-bold">Notas para la tienda<textarea className="field min-h-28 resize-y" name="notes" placeholder="Referencia, indicaciones o detalles del pedido" /></label></section>
      </div>
      <aside className="surface h-fit p-6 lg:sticky lg:top-24"><div className="flex items-center gap-2"><Store size={18} className="text-teal" /><h2 className="font-extrabold">Resumen del pedido</h2></div><div className="mt-5 grid gap-4">{cart.items.map((item) => <div key={item.id} className="flex justify-between gap-4 text-sm"><span className="text-muted">{item.quantity} × {item.product.name}</span><strong>{money(Number(item.variant?.price ?? item.product.basePrice) * item.quantity)}</strong></div>)}</div><div className="mt-5 flex justify-between border-t border-line pt-5 text-lg font-extrabold"><span>Total</span><span>{money(total)}</span></div>{error && <p className="mt-4 text-sm text-[var(--danger)]" role="alert">{error}</p>}<button className="button-primary mt-6 w-full" type="submit" disabled={loading}>{loading ? <LoaderCircle className="animate-spin" size={18} /> : <MessageCircle size={18} />} Crear pedido</button><p className="mt-4 text-center text-xs leading-5 text-muted">El pago se coordina directamente con la tienda por WhatsApp.</p></aside>
    </form>
  );
}

function AddressFields({ onCancel }: { onCancel?: () => void }) {
  return <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Etiqueta<input className="field" name="label" defaultValue="Casa" required /></label><label className="grid gap-2 text-sm font-bold">Ciudad<input className="field" name="city" defaultValue="Guayaquil" required /></label><label className="grid gap-2 text-sm font-bold sm:col-span-2">Dirección<input className="field" name="street" autoComplete="street-address" required /></label><label className="grid gap-2 text-sm font-bold">Provincia<input className="field" name="state" defaultValue="Guayas" /></label><label className="grid gap-2 text-sm font-bold">Referencia<input className="field" name="reference" /></label>{onCancel && <button type="button" className="button-quiet sm:col-span-2" onClick={onCancel}>Cancelar dirección nueva</button>}</div>;
}
