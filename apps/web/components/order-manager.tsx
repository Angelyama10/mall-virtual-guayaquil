"use client";

import { Check, ChevronDown, CreditCard, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { clientApi } from "@/lib/client-api";
import type { Order } from "@/lib/types";
import { money, orderStatusLabel, shortDate } from "@/lib/utils";

const transitions: Record<string, string[]> = {
  PENDING: ["SENT_TO_WHATSAPP", "CONFIRMED", "CANCELLED"],
  SENT_TO_WHATSAPP: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED", "REFUNDED"],
  PROCESSING: ["READY_FOR_PICKUP", "ON_THE_WAY", "CANCELLED"],
  READY_FOR_PICKUP: ["ON_THE_WAY", "DELIVERED", "CANCELLED"],
  ON_THE_WAY: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["REFUNDED"],
};

export function OrderManager({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function status(order: Order, nextStatus: string) {
    if (!nextStatus) return;
    setBusy(order.id); setError("");
    try {
      const body: Record<string, string> = { status: nextStatus, note: `Actualizado desde el panel a ${orderStatusLabel(nextStatus)}` };
      if (nextStatus === "CANCELLED") body.cancellationReason = "OTHER";
      const updated = await clientApi<Order>(`/api/backend/orders/${order.id}/status`, { method: "PATCH", body: JSON.stringify(body) });
      setOrders((current) => current.map((item) => item.id === order.id ? updated : item));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No pudimos cambiar el estado."); }
    finally { setBusy(null); }
  }

  async function markPaid(order: Order) {
    setBusy(order.id); setError("");
    try {
      const updated = await clientApi<Order>(`/api/backend/orders/${order.id}/payment`, { method: "PATCH", body: JSON.stringify({ status: "PAID", method: order.payment?.method ?? "WHATSAPP_TRANSFER" }) });
      setOrders((current) => current.map((item) => item.id === order.id ? updated : item));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No pudimos confirmar el pago."); }
    finally { setBusy(null); }
  }

  return <div>{error && <p className="mb-4 rounded-[6px] border border-[#dfb5b1] bg-[#fff5f3] p-3 text-sm text-[var(--danger)]" role="alert">{error}</p>}<div className="overflow-x-auto rounded-[8px] border border-line bg-white"><table className="w-full min-w-[850px] border-collapse text-left text-sm"><thead className="bg-[#f6f7f6] text-xs uppercase text-muted"><tr><th className="p-4">Pedido</th><th className="p-4">Tienda / fecha</th><th className="p-4">Total</th><th className="p-4">Pago</th><th className="p-4">Estado</th><th className="p-4 text-right">Acciones</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="border-t border-line"><td className="p-4 font-extrabold">{order.orderNumber}</td><td className="p-4"><span className="block font-bold">{order.store?.name ?? "Tienda"}</span><span className="text-xs text-muted">{shortDate(order.createdAt)}</span></td><td className="p-4 font-extrabold">{money(order.total)}</td><td className="p-4"><span className={`status-pill ${order.payment?.status === "PAID" ? "" : "!bg-[#fff5df] !text-[var(--warning)]"}`}>{orderStatusLabel(order.payment?.status ?? "PENDING")}</span></td><td className="p-4"><span className="status-pill !bg-[#eef1f0] !text-ink">{orderStatusLabel(order.status)}</span></td><td className="p-4"><div className="flex justify-end gap-2">{order.payment?.status === "PENDING" && <button className="button-secondary !min-h-9 !px-3" type="button" disabled={busy === order.id} onClick={() => markPaid(order)}>{busy === order.id ? <LoaderCircle className="animate-spin" size={15} /> : <CreditCard size={15} />} Pagado</button>}<label className="relative"><span className="sr-only">Cambiar estado</span><select className="field !min-h-9 !w-44 !py-1.5 !pr-9 text-xs font-bold" defaultValue="" disabled={busy === order.id || !(transitions[order.status]?.length)} onChange={(event) => status(order, event.target.value)}><option value="">Cambiar estado</option>{transitions[order.status]?.map((next) => <option key={next} value={next}>{orderStatusLabel(next)}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" size={14} /></label></div></td></tr>)}</tbody></table>{!orders.length && <div className="empty-state m-5"><div><Check className="mx-auto text-teal" /><p className="mt-3 font-extrabold">No hay pedidos pendientes</p></div></div>}</div></div>;
}
