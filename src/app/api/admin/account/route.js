import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth-guards";
import { updateOwnAccountIdentity } from "@/lib/account-profile";

export async function PATCH(request) {
  const { user, error } = await requireApiRole(["admin"]);
  if (error) {
    return error;
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format data akun tidak valid." },
      { status: 400 }
    );
  }

  try {
    const result = await updateOwnAccountIdentity({
      userId: user.id,
      role: "admin",
      body,
      includePhone: true,
    });

    if (!result.ok) {
      return NextResponse.json(
        result.fieldErrors
          ? { error: result.error, fieldErrors: result.fieldErrors }
          : { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(
      {
        message: "Identitas akun Admin berhasil diperbarui.",
        user: result.user,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("PATCH /api/admin/account error:", err);
    return NextResponse.json(
      { error: "Gagal memperbarui identitas akun." },
      { status: 500 }
    );
  }
}
