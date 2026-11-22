import { getCurrentUser } from "@/lib/auth-guards";
import { query } from "@/lib/db";
import NavbarClient from "@/components/NavbarClient";

export default async function Navbar() {
  const user = await getCurrentUser();
  let cartCount = 0;
  let avatarUrl = null;

  if (user?.role === "buyer") {
    const result = await query(
      `SELECT COUNT(*)::int AS count
       FROM cart_items ci
       INNER JOIN carts c ON c.id = ci.cart_id
       WHERE c.buyer_id = $1`,
      [user.id]
    );
    cartCount = result.rows[0]?.count ?? 0;
  } else if (user?.role === "seller") {
    const storeRes = await query(
      `SELECT store_image_url
       FROM stores
       WHERE seller_id = $1
       LIMIT 1`,
      [user.id]
    );
    avatarUrl = storeRes.rows[0]?.store_image_url || null;
  }

  const safeUser = user
    ? {
        full_name: user.full_name,
        role: user.role,
        seller_status: user.seller_status,
        avatar_url: avatarUrl,
      }
    : null;

  return <NavbarClient user={safeUser} cartCount={cartCount} />;
}
