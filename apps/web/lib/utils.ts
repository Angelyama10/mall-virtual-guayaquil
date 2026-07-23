import type { Product } from "@/lib/types";

export function money(value: string | number, currency = "USD") {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(value));
}

export function shortDate(value: string) {
  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function productImage(product: Pick<Product, "slug" | "images">) {
  if (product.slug.includes("zapatillas")) return "/images/product-sneakers-black.png";
  if (product.slug.includes("camiseta")) return "/images/product-tshirt-coral.png";
  const image = product.images.find((item) => item.isPrimary) ?? product.images[0];
  if (image?.url && !image.url.includes("example.com")) return image.url;
  return "/images/product-tshirt-coral.png";
}

export function orderStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "Pendiente",
    SENT_TO_WHATSAPP: "Enviado a WhatsApp",
    CONFIRMED: "Confirmado",
    PROCESSING: "En preparación",
    READY_FOR_PICKUP: "Listo para retirar",
    ON_THE_WAY: "En camino",
    DELIVERED: "Entregado",
    CANCELLED: "Cancelado",
    REFUNDED: "Reembolsado",
    PAID: "Pagado",
    FAILED: "Fallido",
    ACTIVE: "Activa",
    PENDING_REVIEW: "Pendiente de revisión",
    SUSPENDED: "Suspendida",
    PAUSED: "Pausada",
    REJECTED: "Rechazada",
  };
  return labels[status] ?? status.replaceAll("_", " ");
}

export function roleHome(role?: string) {
  if (role === "MERCHANT") return "/comercio";
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "/admin";
  return "/cuenta";
}
