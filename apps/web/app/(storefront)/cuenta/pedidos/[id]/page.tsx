import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, MessageCircle } from "lucide-react";
import { privateApi } from "@/lib/api";
import type { Order } from "@/lib/types";
import { money, orderStatusLabel, shortDate } from "@/lib/utils";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await privateApi<Order>(`orders/${id}`).catch((error) => { if (error instanceof Error && error.message === "UNAUTHENTICATED") redirect(`/login?regreso=/cuenta/pedidos/${id}`); return null; });
  if (!order) notFound();
  return <main id="contenido-principal" className="container-page py-10 md:py-14"><Link className="button-quiet !px-0" href="/cuenta"><ArrowLeft size={17} /> Volver a mis pedidos</Link><div className="mt-5 grid gap-7 lg:grid-cols-[1fr_320px]"><section className="surface p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">{shortDate(order.createdAt)}</p><h1 className="display-title mt-2 text-[42px]">{order.orderNumber}</h1></div><span className="status-pill"><CheckCircle2 size={14} /> {orderStatusLabel(order.status)}</span></div><div className="mt-7 border-t border-line">{order.items?.map((item) => <div key={item.id} className="flex justify-between gap-5 border-b border-line py-5 text-sm"><div><strong>{item.productName}</strong><p className="mt-1 text-muted">{item.quantity} × {money(item.unitPrice)}</p></div><strong>{money(item.totalPrice)}</strong></div>)}</div><p className="mt-6 text-sm leading-7 text-muted">{order.notes}</p></section><aside className="surface h-fit p-6"><h2 className="font-extrabold">Resumen</h2><div className="mt-5 grid gap-3 text-sm"><div className="flex justify-between"><span className="text-muted">Estado del pago</span><strong>{orderStatusLabel(order.payment?.status ?? "PENDING")}</strong></div><div className="flex justify-between"><span className="text-muted">Entrega</span><strong>{order.deliveryType === "PICKUP" ? "Retiro" : "A domicilio"}</strong></div><div className="flex justify-between border-t border-line pt-4 text-lg"><strong>Total</strong><strong>{money(order.total)}</strong></div></div>{order.whatsappCheckoutUrl && <a className="button-primary mt-6 w-full" href={order.whatsappCheckoutUrl} target="_blank" rel="noreferrer"><MessageCircle size={17} /> Abrir WhatsApp</a>}</aside></div></main>;
}
