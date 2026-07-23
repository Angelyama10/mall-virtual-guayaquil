"use client";

import { FormEvent, useState } from "react";
import { Boxes, Building2, LoaderCircle, Plus, Store as StoreIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { clientApi } from "@/lib/client-api";
import type { Category, Store } from "@/lib/types";

export function CreateProductForm({ stores, categories }: { stores: Store[]; categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(""); const form = new FormData(event.currentTarget);
    try {
      await clientApi("/api/backend/products", { method: "POST", body: JSON.stringify({ storeId: form.get("storeId"), categoryId: form.get("categoryId"), name: form.get("name"), description: form.get("description") || undefined, basePrice: Number(form.get("basePrice")), compareAtPrice: form.get("compareAtPrice") ? Number(form.get("compareAtPrice")) : undefined, sku: form.get("sku") || undefined, status: "ACTIVE", isFeatured: false, isAvailable: true, initialStock: Number(form.get("initialStock") || 0) }) });
      setOpen(false); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No pudimos crear el producto."); }
    finally { setLoading(false); }
  }

  return <div><button className="button-primary" type="button" onClick={() => setOpen((value) => !value)}><Plus size={17} /> Nuevo producto</button>{open && <form className="mt-5 grid gap-4 rounded-[8px] border border-line bg-white p-5 sm:grid-cols-2" onSubmit={submit}><div className="sm:col-span-2"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-[6px] bg-teal text-white"><Boxes size={19} /></span><div><h3 className="font-extrabold">Crear producto</h3><p className="text-xs text-muted">Se publicará con inventario inicial.</p></div></div></div><label className="grid gap-2 text-sm font-bold">Tienda<select className="field" name="storeId" required>{stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}</select></label><label className="grid gap-2 text-sm font-bold">Categoría<select className="field" name="categoryId" required>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="grid gap-2 text-sm font-bold sm:col-span-2">Nombre<input className="field" name="name" required /></label><label className="grid gap-2 text-sm font-bold sm:col-span-2">Descripción<textarea className="field min-h-24" name="description" /></label><label className="grid gap-2 text-sm font-bold">Precio<input className="field" name="basePrice" type="number" min="0" step="0.01" required /></label><label className="grid gap-2 text-sm font-bold">Precio anterior<input className="field" name="compareAtPrice" type="number" min="0" step="0.01" /></label><label className="grid gap-2 text-sm font-bold">SKU<input className="field" name="sku" /></label><label className="grid gap-2 text-sm font-bold">Stock inicial<input className="field" name="initialStock" type="number" min="0" defaultValue="1" required /></label>{error && <p className="text-sm text-[var(--danger)] sm:col-span-2" role="alert">{error}</p>}<div className="flex gap-2 sm:col-span-2"><button className="button-primary" type="submit" disabled={loading}>{loading && <LoaderCircle className="animate-spin" size={17} />} Guardar producto</button><button className="button-quiet" type="button" onClick={() => setOpen(false)}>Cancelar</button></div></form>}</div>;
}

export function MerchantOnboarding({ email, phone }: { email: string; phone?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(""); const form = new FormData(event.currentTarget);
    try {
      await clientApi("/api/backend/stores/merchant-profile", { method: "POST", body: JSON.stringify({ taxId: form.get("taxId") || undefined, taxIdCountry: "EC", contactEmail: email, contactPhone: form.get("contactPhone") }) });
      const company = await clientApi<{ id: string }>("/api/backend/stores/companies", { method: "POST", body: JSON.stringify({ name: form.get("companyName"), description: form.get("description") || undefined }) });
      await clientApi("/api/backend/stores", { method: "POST", body: JSON.stringify({ companyId: company.id, name: form.get("storeName"), address: { street: form.get("street"), city: "Guayaquil", state: "Guayas", reference: form.get("reference") || undefined }, settings: { whatsappNumber: form.get("contactPhone"), acceptsWhatsapp: true, acceptsCash: true, acceptsCard: false, acceptsOnlinePayment: false } }) });
      router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No pudimos completar el registro comercial."); }
    finally { setLoading(false); }
  }

  return <div className="mx-auto max-w-3xl"><div className="text-center"><span className="mx-auto grid size-14 place-items-center rounded-[8px] bg-coral text-white"><Building2 size={27} /></span><p className="eyebrow mt-6">Configuración inicial</p><h1 className="display-title mt-3 text-[48px]">Abre tu vitrina en Mall GYE</h1><p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted">Completa los datos básicos. La tienda quedará pendiente de revisión antes de aparecer públicamente.</p></div><form className="mt-9 grid gap-4 rounded-[8px] border border-line bg-white p-6 sm:grid-cols-2" onSubmit={submit}><label className="grid gap-2 text-sm font-bold">Razón comercial<input className="field" name="companyName" required placeholder="Ej. Moda del Centro" /></label><label className="grid gap-2 text-sm font-bold">RUC o identificación<input className="field" name="taxId" /></label><label className="grid gap-2 text-sm font-bold sm:col-span-2">Descripción<textarea className="field min-h-24" name="description" placeholder="Cuéntanos qué vende tu negocio" /></label><label className="grid gap-2 text-sm font-bold">Nombre de la tienda<input className="field" name="storeName" required /></label><label className="grid gap-2 text-sm font-bold">WhatsApp<input className="field" name="contactPhone" type="tel" defaultValue={phone ?? ""} required /></label><label className="grid gap-2 text-sm font-bold sm:col-span-2">Dirección<input className="field" name="street" required /></label><label className="grid gap-2 text-sm font-bold sm:col-span-2">Referencia<input className="field" name="reference" /></label>{error && <p className="text-sm text-[var(--danger)] sm:col-span-2" role="alert">{error}</p>}<button className="button-primary sm:col-span-2" type="submit" disabled={loading}>{loading ? <LoaderCircle className="animate-spin" size={17} /> : <StoreIcon size={17} />} Crear comercio y solicitar revisión</button></form></div>;
}
