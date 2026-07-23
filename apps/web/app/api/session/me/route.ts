import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getApiUrl } from "@/lib/api";

export async function GET() {
  const token = (await cookies()).get("mall_session")?.value;
  if (!token) return NextResponse.json({ message: "No autenticado" }, { status: 401 });

  const response = await fetch(`${getApiUrl()}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload, { status: response.status });
}
