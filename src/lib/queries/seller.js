import "server-only";
import { query } from "@/lib/db";

export async function getSellerOverviewStats(storeId) {
  const [prodRes, orderRes] = await Promise.all([
    query(
      `SELECT
         COUNT(*)::int AS total_products,
         COUNT(*) FILTER (WHERE is_active = TRUE AND stock_kg >= 0.5)::int AS active_products
       FROM products
       WHERE store_id = $1`,
      [storeId]
    ),
    query(
      `SELECT
         COUNT(*) FILTER (WHERE status IN ('pending_payment', 'processing', 'shipped'))::int AS open_orders
       FROM orders
       WHERE store_id = $1`,
      [storeId]
    ),
  ]);

  const prod = prodRes.rows[0] ?? { total_products: 0, active_products: 0 };
  const ord = orderRes.rows[0] ?? {
    open_orders: 0,
  };

  return {
    totalProducts: prod.total_products,
    activeProducts: prod.active_products,
    openOrders: ord.open_orders,
  };
}

export async function getSellerProducts(storeId) {
  const result = await query(
    `SELECT
       p.id,
       p.store_id,
       p.category_id,
       p.name,
       p.description,
       p.price_per_kg,
       p.stock_kg,
       p.is_active,
       p.admin_disabled,
       p.image_url,
       p.created_at,
       p.updated_at,
       c.name AS category_name
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     WHERE p.store_id = $1
     ORDER BY p.created_at DESC, p.id DESC`,
    [storeId]
  );

  return result.rows.map((row) => ({
    ...row,
    price_per_kg: Number(row.price_per_kg),
    stock_kg: Number(row.stock_kg),
  }));
}

export async function getSellerProductById(productId, storeId) {
  const id = Number(productId);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  const result = await query(
    `SELECT
       id,
       store_id,
       category_id,
       name,
       description,
       price_per_kg,
       stock_kg,
       is_active,
       admin_disabled,
       image_url,
       created_at,
       updated_at
     FROM products
     WHERE id = $1 AND store_id = $2
     LIMIT 1`,
    [id, storeId]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    ...row,
    price_per_kg: Number(row.price_per_kg),
    stock_kg: Number(row.stock_kg),
  };
}

export async function getSellerOrdersWithItems(storeId, { limit = 50 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const ordersRes = await query(
    `SELECT
       o.id,
       o.order_code,
       o.buyer_id,
       o.shipping_address_snapshot,
       o.payment_method,
       o.total_amount,
       o.status,
       o.created_at,
       o.updated_at,
       u.full_name AS buyer_name,
       u.phone_number AS buyer_phone
     FROM orders o
     INNER JOIN users u ON u.id = o.buyer_id
     WHERE o.store_id = $1
     ORDER BY o.created_at DESC, o.id DESC
     LIMIT $2`,
    [storeId, safeLimit]
  );

  const orders = ordersRes.rows;
  if (orders.length === 0) {
    return [];
  }

  const orderIds = orders.map((order) => order.id);
  const itemsRes = await query(
    `SELECT
       id,
       order_id,
       product_id,
       product_name_snapshot,
       price_per_kg_snapshot,
       quantity_kg,
       subtotal
     FROM order_items
     WHERE order_id = ANY($1::int[])
     ORDER BY id ASC`,
    [orderIds]
  );

  const itemsByOrder = new Map();
  for (const item of itemsRes.rows) {
    const list = itemsByOrder.get(item.order_id) || [];
    list.push({
      ...item,
      price_per_kg_snapshot: Number(item.price_per_kg_snapshot),
      quantity_kg: Number(item.quantity_kg),
      subtotal: Number(item.subtotal),
    });
    itemsByOrder.set(item.order_id, list);
  }

  return orders.map((order) => ({
    ...order,
    total_amount: Number(order.total_amount),
    items: itemsByOrder.get(order.id) || [],
  }));
}
