"use client";

import { LoaderCircle, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { clientApi } from "@/lib/client-api";

export function AddToCartButton({
  productId,
  variantId,
  quantity = 1,
  compact = false,
}: {
  productId: string;
  variantId?: string;
  quantity?: number;
  compact?: boolean;
}) {
  const [state, setState] = useState<"idle" | "loading" | "added">("idle");
  const [error, setError] = useState("");
  const router = useRouter();

  async function add() {
    setState("loading");
    setError("");
    try {
      await clientApi("/api/backend/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId, variantId, quantity }),
      });
      setState("added");
      router.refresh();
      window.setTimeout(() => setState("idle"), 1600);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "No se pudo agregar.";
      if (message.toLowerCase().includes("autentic") || message.toLowerCase().includes("unauthorized")) {
        router.push("/login?regreso=/carrito");
        return;
      }
      setError(message);
      setState("idle");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={add}
        disabled={state === "loading"}
        className={compact ? "button-primary !size-11 !p-0" : "button-primary w-full"}
        aria-label={compact ? "Agregar al carrito" : undefined}
      >
        {state === "loading" ? (
          <LoaderCircle className="animate-spin" size={18} />
        ) : (
          <ShoppingBag size={18} />
        )}
        {!compact && (state === "added" ? "Agregado" : "Agregar al carrito")}
      </button>
      {error && <p className="mt-2 text-xs text-[var(--danger)]" role="alert">{error}</p>}
    </div>
  );
}
