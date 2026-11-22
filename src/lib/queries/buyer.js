import "server-only";
import { query } from "@/lib/db";

export async function getBuyerCartData(buyerId) {
  await query(
    `INSERT INTO carts (buyer_id)
     VALUES ($1)
     ON CONFLICT (buyer_id) DO NOTHING`,
    [buyerId]
  );

  const cartRes = await query(
    `SELECT id FROM carts WHERE buyer_id = $1 LIMIT 1`,
    [buyerId]
  );
  const cartId = cartRes.rows[0].id;

  const itemsRes = await query(
    `SELECT
       ci.id,
       ci.product_id,
       ci.quantity_kg,
       p.name AS product_name,
       p.price_per_kg,
       p.stock_kg,
       p.is_active,
       p.image_url,
       s.id AS store_id,
       s.store_name,
       s.dock_location,
       u.seller_status
     FROM cart_items ci
     INNER JOIN products p ON p.id = ci.product_id
     INNER JOIN stores s ON s.id = p.store_id
     INNER JOIN users u ON u.id = s.seller_id
     WHERE ci.cart_id = $1
     ORDER BY s.store_name ASC, ci.created_at ASC, ci.id ASC`,
    [cartId]
  );

  const items = itemsRes.rows.map((row) => {
    const pricePerKg = Number(row.price_per_kg);
    const quantityKg = Number(row.quantity_kg);
    const stockKg = Number(row.stock_kg);
    return {
      ...row,
      price_per_kg: pricePerKg,
      quantity_kg: quantityKg,
      stock_kg: stockKg,
      subtotal: Math.round(pricePerKg * quantityKg * 100) / 100,
      is_available:
        row.seller_status === "approved" &&
        row.is_active !== false &&
        stockKg >= quantityKg,
    };
  });

  const totalAmount = Math.round(
    items.reduce((sum, item) => sum + item.subtotal, 0) * 100
  ) / 100;

  return { cartId, items, totalAmount };
}

export async function getBuyerAddresses(userId) {
  const result = await query(
    `SELECT
       id,
       label,
       recipient_name,
       recipient_phone,
       full_address,
       city,
       postal_code,
       is_default,
       created_at
     FROM user_addresses
     WHERE user_id = $1
     ORDER BY is_default DESC, id DESC`,
    [userId]
  );
  return result.rows;
}

export async function getBuyerOrdersWithItems(buyerId) {
  const ordersRes = await query(
    `SELECT
       o.id,
       o.order_code,
       o.store_id,
       o.shipping_address_snapshot,
       o.payment_method,
       o.total_amount,
       o.status,
       o.created_at,
       o.updated_at,
       s.store_name,
       s.dock_location
     FROM orders o
     INNER JOIN stores s ON s.id = o.store_id
     WHERE o.buyer_id = $1
     ORDER BY o.created_at DESC, o.id DESC`,
    [buyerId]
  );

  const orders = ordersRes.rows;
  if (orders.length === 0) {
    return [];
  }

  const orderIds = orders.map((order) => order.id);
  const itemsRes = await query(
    `SELECT
       oi.id,
       oi.order_id,
       oi.product_id,
       oi.product_name_snapshot,
       oi.price_per_kg_snapshot,
       oi.quantity_kg,
       oi.subtotal,
       r.id AS review_id,
       r.rating AS review_rating,
       r.comment AS review_comment
     FROM order_items oi
     LEFT JOIN reviews r ON r.order_item_id = oi.id
     WHERE oi.order_id = ANY($1::int[])
     ORDER BY oi.id ASC`,
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
