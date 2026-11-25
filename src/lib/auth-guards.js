import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { query } from "@/lib/db";

export function getDefaultHomeForUser(user) {
  if (!user) {
    return "/login";
  }
  if (user.role === "admin") {
    return "/admin";
  }
  if (user.role === "seller") {
    return user.seller_status === "approved"
      ? "/seller/dashboard"
      : "/seller/pending";
  }
  return "/buyer/home";
}

export const getSessionAuth = cache(async () => {
  const session = await auth();
  const userId = Number(session?.user?.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return { sessionUser: null, dbUser: null };
  }

  const result = await query(
    `SELECT id, full_name, email, phone_number, role, seller_status, rejection_reason, rejected_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );

  return {
    sessionUser: session.user,
    dbUser: result.rows[0] ?? null,
  };
});

export const getCurrentUser = cache(async () => {
  const { dbUser } = await getSessionAuth();
  return dbUser;
});

export async function requireRolePage(allowedRoles) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!allowedRoles.includes(user.role)) {
    redirect(getDefaultHomeForUser(user));
  }
  return user;
}

export async function requireApprovedSellerPage() {
  const { sessionUser, dbUser } = await getSessionAuth();
  if (!dbUser) {
    redirect("/login");
  }
  if (dbUser.role !== "seller") {
    redirect(getDefaultHomeForUser(dbUser));
  }

  if (dbUser.seller_status !== "approved") {
    // Avoid a redirect loop with middleware when JWT still holds stale 'approved'.
    if (sessionUser?.seller_status === "approved") {
      return {
        user: dbUser,
        store: null,
        needsSessionSync: true,
        syncTarget: "/seller/pending",
      };
    }
    redirect("/seller/pending");
  }

  const storeResult = await query(
    `SELECT id, seller_id, store_name, description, dock_location, store_image_url
     FROM stores
     WHERE seller_id = $1
     LIMIT 1`,
    [dbUser.id]
  );

  return {
    user: dbUser,
    store: storeResult.rows[0] ?? null,
    needsSessionSync: false,
    syncTarget: null,
  };
}

export async function getPendingSellerState() {
  const { sessionUser, dbUser } = await getSessionAuth();
  if (!dbUser) {
    redirect("/login");
  }
  if (dbUser.role !== "seller") {
    redirect(getDefaultHomeForUser(dbUser));
  }

  const storeResult = await query(
    `SELECT id, seller_id, store_name, description, dock_location, store_image_url
     FROM stores
     WHERE seller_id = $1
     LIMIT 1`,
    [dbUser.id]
  );
  const store = storeResult.rows[0] ?? null;

  if (dbUser.seller_status === "approved") {
    if (sessionUser?.seller_status !== "approved") {
      return {
        user: dbUser,
        store,
        storeStats: { totalOrders: 0, activeOrders: 0 },
        adminContact: null,
        needsSessionSync: true,
        syncTarget: "/seller/dashboard",
      };
    }
    redirect("/seller/dashboard");
  }

  const [ordersRes, adminRes] = await Promise.all([
    store?.id
      ? query(
          `SELECT
             COUNT(*)::int AS total_orders,
             COUNT(*) FILTER (
               WHERE status IN ('pending_payment', 'processing', 'shipped')
             )::int AS active_orders
           FROM orders
           WHERE store_id = $1`,
          [store.id]
        )
      : Promise.resolve({ rows: [{ total_orders: 0, active_orders: 0 }] }),
    query(
      `SELECT full_name, email, phone_number
       FROM users
       WHERE role = 'admin'
       ORDER BY (phone_number IS NOT NULL AND phone_number <> '') DESC, id ASC
       LIMIT 1`
    ),
  ]);

  const orderRow = ordersRes.rows[0] ?? {};
  return {
    user: dbUser,
    store,
    storeStats: {
      totalOrders: orderRow.total_orders ?? 0,
      activeOrders: orderRow.active_orders ?? 0,
    },
    adminContact: adminRes.rows[0] ?? null,
    needsSessionSync: false,
    syncTarget: null,
  };
}

export async function requireApiAuth() {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Autentikasi diperlukan." },
        { status: 401 }
      ),
    };
  }
  return { user, error: null };
}

export async function requireApiRole(allowedRoles) {
  const { user, error } = await requireApiAuth();
  if (error) {
    return { user: null, error };
  }

  if (!allowedRoles.includes(user.role)) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Anda tidak memiliki izin untuk mengakses fitur ini." },
        { status: 403 }
      ),
    };
  }

  return { user, error: null };
}

export async function requireApiApprovedSeller() {
  const { user, error } = await requireApiRole(["seller"]);
  if (error) {
    return { user: null, store: null, error };
  }

  if (user.seller_status !== "approved") {
    return {
      user: null,
      store: null,
      error: NextResponse.json(
        { error: "Akun mitra belum disetujui oleh Admin." },
        { status: 403 }
      ),
    };
  }

  const storeResult = await query(
    `SELECT id, seller_id, store_name, description, dock_location, store_image_url
     FROM stores
     WHERE seller_id = $1
     LIMIT 1`,
    [user.id]
  );

  const store = storeResult.rows[0];
  if (!store) {
    return {
      user: null,
      store: null,
      error: NextResponse.json(
        { error: "Profil toko belum ditemukan." },
        { status: 404 }
      ),
    };
  }

  return { user, store, error: null };
}
