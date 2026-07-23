import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  (await cookies()).delete("mall_session");
  return NextResponse.json({ ok: true });
}
