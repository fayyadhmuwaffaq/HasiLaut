import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth-guards";
import { getAdminProducts } from "@/lib/queries/admin";

export async function GET() {
  const { error } = await requireApiRole(["admin"]);
  if (error) {
    return error;
  }

  try {
    const products = await getAdminProducts();
    return NextResponse.json({ products }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/products error:", err);
    return NextResponse.json(
      { error: "Gagal memuat daftar produk moderasi." },
      { status: 500 }
    );
  }
}
