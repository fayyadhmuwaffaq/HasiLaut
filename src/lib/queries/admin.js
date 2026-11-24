import "server-only";
import { query } from "@/lib/db";

export async function getAdminOverviewStats() {
  const result = await query(`
    SELECT
      (SELECT COUNT(*)::int FROM users) AS total_users,
      (SELECT COUNT(*)::int FROM users WHERE role = 'seller' AND seller_status = 'pending') AS pending_sellers,
      (
        SELECT COUNT(*)::int
        FROM products p
        INNER JOIN stores s ON s.id = p.store_id
        INNER JOIN users u ON u.id = s.seller_id
        WHERE u.seller_status = 'approved' AND p.is_active = TRUE AND p.stock_kg >= 0.5
      ) AS active_products,
      (SELECT COUNT(*)::int FROM categories) AS total_categories
  `);

  const row = result.rows[0] ?? {};
  return {
    totalUsers: row.total_users ?? 0,
    pendingSellers: row.pending_sellers ?? 0,
    activeProducts: row.active_products ?? 0,
    totalCategories: row.total_categories ?? 0,
  };
}

export async function getAdminSellerQueue() {
  const result = await query(`
    SELECT
      u.id,
      u.full_name,
      u.email,
      u.phone_number,
      u.seller_status,
      u.created_at,
      s.id AS store_id,
      s.store_name,
      s.dock_location,
      s.description AS store_description
    FROM users u
    INNER JOIN stores s ON s.seller_id = u.id
    WHERE u.role = 'seller'
    ORDER BY
      CASE
        WHEN u.seller_status = 'pending' THEN 0
        WHEN u.seller_status = 'approved' THEN 1
        ELSE 2
      END,
      u.created_at DESC,
      u.id DESC
  `);

  return result.rows;
}

export async function getAdminCategories() {
  const result = await query(`
    SELECT
      c.id,
      c.name,
      c.slug,
      c.created_at,
      COUNT(p.id)::int AS product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id
    ORDER BY c.id ASC
  `);

  return result.rows;
}

export async function getAdminUsers() {
  const result = await query(`
    SELECT
      u.id,
      u.full_name,
      u.email,
      u.phone_number,
      u.role,
      u.seller_status,
      u.created_at,
      s.store_name,
      s.dock_location,
      (SELECT COUNT(*)::int FROM orders o WHERE o.buyer_id = u.id) AS order_count,
      CASE
        WHEN s.id IS NULL THEN 0
        ELSE (SELECT COUNT(*)::int FROM products p WHERE p.store_id = s.id)
      END AS product_count
    FROM users u
    LEFT JOIN stores s ON s.seller_id = u.id
    WHERE u.role IN ('buyer', 'seller')
    ORDER BY u.id ASC
  `);

  return result.rows;
}

export async function getAdminProducts() {
  const result = await query(`
    SELECT
      p.id,
      p.name,
      p.price_per_kg,
      p.stock_kg,
      p.is_active,
      p.admin_disabled,
      p.image_url,
      p.created_at,
      c.name AS category_name,
      s.store_name,
      s.dock_location,
      u.seller_status
    FROM products p
    INNER JOIN categories c ON c.id = p.category_id
    INNER JOIN stores s ON s.id = p.store_id
    INNER JOIN users u ON u.id = s.seller_id
    ORDER BY p.created_at DESC, p.id DESC
  `);

  return result.rows.map((row) => ({
    ...row,
    price_per_kg: Number(row.price_per_kg),
    stock_kg: Number(row.stock_kg),
  }));
}
