import "server-only";

import { cookies } from "next/headers";

const API_URL =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

export async function publicApi<T>(path: string, init?: RequestInit): Promise<T> {
  const shouldRevalidate = !init?.method && init?.cache !== "no-store";
  const response = await fetch(`${API_URL}/${path.replace(/^\//, "")}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    next: shouldRevalidate ? { revalidate: 30 } : undefined,
  });

  if (!response.ok) {
    throw new Error(`API ${response.status}: ${path}`);
  }

  return response.json() as Promise<T>;
}

export async function privateApi<T>(path: string, init?: RequestInit): Promise<T> {
  const token = (await cookies()).get("mall_session")?.value;
  if (!token) throw new Error("UNAUTHENTICATED");

  return publicApi<T>(path, {
    ...init,
    cache: "no-store",
    headers: { ...init?.headers, Authorization: `Bearer ${token}` },
  });
}

export function getApiUrl() {
  return API_URL;
}
