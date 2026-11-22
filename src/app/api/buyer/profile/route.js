import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth-guards";
import { updateOwnAccountIdentity } from "@/lib/account-profile";

export async function GET() {
  const { user, error } = await requireApiRole(["buyer"]);
  if (error) {
    return error;
  }

  return NextResponse.json(
    {
      profile: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number || "",
      },
    },
    { status: 200 }
  );
}

export async function PATCH(request) {
  const { user, error } = await requireApiRole(["buyer"]);
  if (error) {
    return error;
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format data profil tidak valid." },
      { status: 400 }
    );
  }

  try {
    const result = await updateOwnAccountIdentity({
      userId: user.id,
      role: "buyer",
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
      { message: "Profil berhasil diperbarui.", profile: result.user },
      { status: 200 }
    );
  } catch (err) {
    console.error("PATCH /api/buyer/profile error:", err);
    return NextResponse.json(
      { error: "Gagal memperbarui profil." },
      { status: 500 }
    );
  }
}
