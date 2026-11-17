import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth-guards";
import { getBuyerOrdersWithItems } from "@/lib/queries/buyer";

export async function GET() {
  const { user, error } = await requireApiRole(["buyer"]);
  if (error) {
    return error;
  }

  try {
    const orders = await getBuyerOrdersWithItems(user.id);
    return NextResponse.json({ orders }, { status: 200 });
  } catch (err) {
    console.error("GET /api/buyer/orders error:", err);
    return NextResponse.json(
      { error: "Gagal memuat daftar pesanan." },
      { status: 500 }
    );
  }
}
