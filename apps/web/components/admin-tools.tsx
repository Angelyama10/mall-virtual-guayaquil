"use client";

import { FormEvent, useState } from "react";
import { Check, LoaderCircle, Plus, Store as StoreIcon, X } from "lucide-react";
import { clientApi } from "@/lib/client-api";
import type { Category, Store } from "@/lib/types";
import { orderStatusLabel } from "@/lib/utils";

export function StoreReview({ initialStores }: { initialStores: Store[] }) {
  const [stores, setStores] = useState(initialStores);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function update(store: Store, status: "ACTIVE" | "REJECTED") {
    setBusy(store.id); setError("");
    try {
      const updated = await clientApi<Store>(`/api/backend/stores/${store.id}/status`, { method: "PATCH", body: JSON.stringify({ status, note: status === "ACTIVE" ? "Aprobada desde el panel administrativo" : "Solicitud rechazada desde el panel administrativo" }) });
      setStores((current) => current.map((item) => item.id === store.id ? updated : item));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No pudimos actualizar la tienda."); }
    finally { setBusy(null); }
  }
  return <div>{error && <p className="mb-4 text-sm text-[var(--danger)]" role="alert">{error}</p>}<div className="grid gap-4 md:grid-cols-2">{stores.map((store) => <article key={store.id} className="rounded-[8px] border border-line bg-white p-5"><div className="flex items-start justify-between gap-4"><span className="grid size-10 place-items-center rounded-[6px] bg-ink text-white"><StoreIcon size={19} /></span><span className={`status-pill ${store.status === "ACTIVE" ? "" : "!bg-[#fff5df] !text-[var(--warning)]"}`}>{orderStatusLabel(store.status)}</span></div><h3 className="mt-5 font-extrabold">{store.name}</h3><p className="mt-2 text-sm text-muted">{store.company?.name} · {store.address?.street ?? "Sin dirección"}</p>{store.status === "PENDING_REVIEW" && <div className="mt-5 flex gap-2"><button className="button-primary flex-1" type="button" disabled={busy === store.id} onClick={() => update(store, "ACTIVE")}>{busy === store.id ? <LoaderCircle className="animate-spin" size={16} /> : <Check size={16} />} Aprobar</button><button className="button-danger !size-11 !p-0" type="button" disabled={busy === store.id} onClick={() => update(store, "REJECTED")} aria-label="Rechazar tienda"><X size={17} /></button></div>}</article>)}</div></div>;
}

export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); const form = new FormData(event.currentTarget);
    try {
      const created = await clientApi<Category>("/api/backend/categories", { method: "POST", body: JSON.stringify({ name: form.get("name"), description: form.get("description") || undefined, sortOrder: Number(form.get("sortOrder") || 0), isActive: true }) });
      setCategories((current) => [...current, created]); setOpen(false); event.currentTarget.reset();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No pudimos crear la categoría."); }
  }
  return <div><div className="flex justify-end"><button className="button-primary" type="button" onClick={() => setOpen((value) => !value)}><Plus size={17} /> Nueva categoría</button></div>{open && <form className="mt-4 grid gap-4 rounded-[8px] border border-line bg-white p-5 sm:grid-cols-[1fr_1.5fr_110px_auto] sm:items-end" onSubmit={submit}><label className="grid gap-2 text-sm font-bold">Nombre<input className="field" name="name" required /></label><label className="grid gap-2 text-sm font-bold">Descripción<input className="field" name="description" /></label><label className="grid gap-2 text-sm font-bold">Orden<input className="field" name="sortOrder" type="number" min="0" defaultValue="0" /></label><button className="button-primary" type="submit">Guardar</button>{error && <p className="text-sm text-[var(--danger)] sm:col-span-4" role="alert">{error}</p>}</form>}<div className="mt-4 overflow-hidden rounded-[8px] border border-line bg-white">{categories.map((category) => <div key={category.id} className="grid gap-2 border-b border-line p-4 last:border-0 sm:grid-cols-[1fr_2fr_auto] sm:items-center"><strong className="text-sm">{category.name}</strong><p className="text-sm text-muted">{category.description ?? "Sin descripción"}</p><span className="status-pill">{category.isActive ? "Activa" : "Inactiva"}</span></div>)}</div></div>;
}
