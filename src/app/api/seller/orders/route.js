import { NextResponse } from "next/server";
import { requireApiApprovedSeller } from "@/lib/auth-guards";
import { getSellerOrdersWithItems } from "@/lib/queries/seller";

export async function GET() {
  const { store, error } = await requireApiApprovedSeller();
  if (error) {
    return error;
  }

  try {
    const orders = await getSellerOrdersWithItems(store.id);
    return NextResponse.json({ orders }, { status: 200 });
  } catch (err) {
    console.error("GET /api/seller/orders error:", err);
    return NextResponse.json(
      { error: "Gagal memuat daftar pesanan masuk." },
      { status: 500 }
    );
  }
}
