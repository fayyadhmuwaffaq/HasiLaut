import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth-guards";
import { getAdminUsers } from "@/lib/queries/admin";

export async function GET() {
  const { error } = await requireApiRole(["admin"]);
  if (error) {
    return error;
  }

  try {
    const users = await getAdminUsers();
    return NextResponse.json({ users }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/users error:", err);
    return NextResponse.json(
      { error: "Gagal memuat daftar pengguna." },
      { status: 500 }
    );
  }
}
