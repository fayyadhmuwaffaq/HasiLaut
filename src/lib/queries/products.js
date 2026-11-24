import "server-only";
import { query } from "@/lib/db";

const SORT_ORDER_SQL = {
  newest: "p.created_at DESC, p.id DESC",
  price_asc: "p.price_per_kg ASC, p.id DESC",
  price_desc: "p.price_per_kg DESC, p.id DESC",
};

export async function getAllCategories() {
  const result = await query(
    `SELECT id, name, slug
     FROM categories
     ORDER BY id ASC`
  );
  return result.rows;
}

export async function getPublicFeaturedProducts({ limit = 8 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 6, 1), 24);
  const result = await query(
    `SELECT
       p.id,
       p.name,
       p.description,
       p.price_per_kg,
       p.stock_kg,
       p.is_active,
       p.image_url,
       p.created_at,
       c.id AS category_id,
       c.name AS category_name,
       c.slug AS category_slug,
       s.id AS store_id,
       s.store_name,
       s.dock_location,
       COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0)::float AS avg_rating,
       COUNT(r.id)::int AS review_count
     FROM products p
     INNER JOIN stores s ON s.id = p.store_id
     INNER JOIN users u ON u.id = s.seller_id
     INNER JOIN categories c ON c.id = p.category_id
     LEFT JOIN reviews r ON r.product_id = p.id
     WHERE u.role = 'seller' AND u.seller_status = 'approved' AND p.is_active = TRUE
     GROUP BY p.id, c.id, s.id
     ORDER BY p.created_at DESC, p.id DESC
     LIMIT $1`,
    [safeLimit]
  );

  return result.rows;
}

export async function getBuyerRecommendedProducts({ limit = 8 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 6, 1), 24);
  const result = await query(
    `SELECT
       p.id,
       p.name,
       p.description,
       p.price_per_kg,
       p.stock_kg,
       p.is_active,
       p.image_url,
       p.created_at,
       c.id AS category_id,
       c.name AS category_name,
       c.slug AS category_slug,
       s.id AS store_id,
       s.store_name,
       s.dock_location,
       COALESCE(rev.avg_rating, 0)::float AS avg_rating,
       COALESCE(rev.review_count, 0)::int AS review_count
     FROM products p
     INNER JOIN stores s ON s.id = p.store_id
     INNER JOIN users u ON u.id = s.seller_id
     INNER JOIN categories c ON c.id = p.category_id
     LEFT JOIN (
       SELECT
         product_id,
         ROUND(AVG(rating)::numeric, 1) AS avg_rating,
         COUNT(*)::int AS review_count
       FROM reviews
       GROUP BY product_id
     ) rev ON rev.product_id = p.id
     WHERE u.role = 'seller'
       AND u.seller_status = 'approved'
       AND p.is_active = TRUE
       AND p.stock_kg >= 0.5
     ORDER BY RANDOM()
     LIMIT $1`,
    [safeLimit]
  );

  return result.rows;
}

export async function searchProducts({
  q = "",
  categorySlug = "",
  minPrice = null,
  maxPrice = null,
  sort = "newest",
  page = 1,
  pageSize = 12,
} = {}) {
  const safePageSize = Math.min(Math.max(Number(pageSize) || 12, 1), 36);
  const requestedPage = Math.max(Number(page) || 1, 1);

  const conditions = [
    "u.role = 'seller'",
    "u.seller_status = 'approved'",
    "p.is_active = TRUE",
  ];
  const params = [];

  const trimmedQuery = typeof q === "string" ? q.trim() : "";
  if (trimmedQuery) {
    params.push(`%${trimmedQuery}%`);
    conditions.push(`(p.name ILIKE $${params.length} OR s.store_name ILIKE $${params.length})`);
  }

  const trimmedCategory = typeof categorySlug === "string" ? categorySlug.trim() : "";
  if (trimmedCategory) {
    params.push(trimmedCategory);
    conditions.push(`c.slug = $${params.length}`);
  }

  if (minPrice !== null && Number.isFinite(Number(minPrice)) && Number(minPrice) >= 0) {
    params.push(Number(minPrice));
    conditions.push(`p.price_per_kg >= $${params.length}`);
  }

  if (maxPrice !== null && Number.isFinite(Number(maxPrice)) && Number(maxPrice) >= 0) {
    params.push(Number(maxPrice));
    conditions.push(`p.price_per_kg <= $${params.length}`);
  }

  const whereClause = conditions.join(" AND ");
  const orderBySql = SORT_ORDER_SQL[sort] || SORT_ORDER_SQL.newest;

  const countResult = await query(
    `SELECT COUNT(*)::int AS total
     FROM products p
     INNER JOIN stores s ON s.id = p.store_id
     INNER JOIN users u ON u.id = s.seller_id
     INNER JOIN categories c ON c.id = p.category_id
     WHERE ${whereClause}`,
    params
  );

  const totalCount = countResult.rows[0]?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * safePageSize;

  const listParams = [...params, safePageSize, offset];
  const limitParamIndex = params.length + 1;
  const offsetParamIndex = params.length + 2;

  const listResult = await query(
    `SELECT
       p.id,
       p.name,
       p.description,
       p.price_per_kg,
       p.stock_kg,
       p.is_active,
       p.image_url,
       p.created_at,
       c.id AS category_id,
       c.name AS category_name,
       c.slug AS category_slug,
       s.id AS store_id,
       s.store_name,
       s.dock_location,
       COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0)::float AS avg_rating,
       COUNT(r.id)::int AS review_count
     FROM products p
     INNER JOIN stores s ON s.id = p.store_id
     INNER JOIN users u ON u.id = s.seller_id
     INNER JOIN categories c ON c.id = p.category_id
     LEFT JOIN reviews r ON r.product_id = p.id
     WHERE ${whereClause}
     GROUP BY p.id, c.id, s.id
     ORDER BY ${orderBySql}
     LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`,
    listParams
  );

  return {
    products: listResult.rows,
    totalCount,
    totalPages,
    currentPage,
    pageSize: safePageSize,
  };
}

export async function getProductDetailById(rawId) {
  const productId = Number(rawId);
  if (!Number.isInteger(productId) || productId <= 0) {
    return null;
  }

  const productResult = await query(
    `SELECT
       p.id,
       p.name,
       p.description,
       p.price_per_kg,
       p.stock_kg,
       p.is_active,
       p.image_url,
       p.created_at,
       p.updated_at,
       c.id AS category_id,
       c.name AS category_name,
       c.slug AS category_slug,
       s.id AS store_id,
       s.store_name,
       s.description AS store_description,
       s.dock_location,
       s.store_image_url,
       COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0)::float AS avg_rating,
       COUNT(r.id)::int AS review_count
     FROM products p
     INNER JOIN stores s ON s.id = p.store_id
     INNER JOIN users u ON u.id = s.seller_id
     INNER JOIN categories c ON c.id = p.category_id
     LEFT JOIN reviews r ON r.product_id = p.id
     WHERE p.id = $1
       AND u.role = 'seller'
       AND u.seller_status = 'approved'
     GROUP BY p.id, c.id, s.id
     LIMIT 1`,
    [productId]
  );

  const product = productResult.rows[0];
  if (!product) {
    return null;
  }

  const reviewsResult = await query(
    `SELECT
       r.id,
       r.rating,
       r.comment,
       r.created_at,
       u.full_name AS reviewer_name
     FROM reviews r
     INNER JOIN users u ON u.id = r.buyer_id
     WHERE r.product_id = $1
     ORDER BY r.created_at DESC, r.id DESC`,
    [productId]
  );

  return {
    product,
    reviews: reviewsResult.rows,
  };
}

/**
 * Fetch an approved seller store profile along with paginated catalog products.
 */
export async function getPublicStoreById(
  rawId,
  { page = 1, pageSize = 12 } = {}
) {
  const storeId = Number(rawId);
  if (!Number.isInteger(storeId) || storeId <= 0) {
    return null;
  }

  const storeResult = await query(
    `SELECT
       s.id,
       s.store_name,
       s.description,
       s.dock_location,
       s.store_image_url,
       s.created_at,
       u.full_name AS owner_name,
       (
         SELECT COUNT(*)::int
         FROM products p
         WHERE p.store_id = s.id AND p.is_active = TRUE
       ) AS total_products,
       (
         SELECT COUNT(*)::int
         FROM products p
         WHERE p.store_id = s.id AND p.is_active = TRUE AND p.stock_kg >= 0.5
       ) AS available_products
     FROM stores s
     INNER JOIN users u ON u.id = s.seller_id
     WHERE s.id = $1
       AND u.role = 'seller'
       AND u.seller_status = 'approved'
     LIMIT 1`,
    [storeId]
  );

  const store = storeResult.rows[0];
  if (!store) {
    return null;
  }

  const safePageSize = Math.min(Math.max(Number(pageSize) || 12, 1), 36);
  const requestedPage = Math.max(Number(page) || 1, 1);
  const totalCount = store.total_products ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * safePageSize;

  const productsResult = await query(
    `SELECT
       p.id,
       p.name,
       p.description,
       p.price_per_kg,
       p.stock_kg,
       p.is_active,
       p.image_url,
       p.created_at,
       c.id AS category_id,
       c.name AS category_name,
       c.slug AS category_slug,
       s.id AS store_id,
       s.store_name,
       s.dock_location,
       COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0)::float AS avg_rating,
       COUNT(r.id)::int AS review_count
     FROM products p
     INNER JOIN stores s ON s.id = p.store_id
     INNER JOIN categories c ON c.id = p.category_id
     LEFT JOIN reviews r ON r.product_id = p.id
     WHERE s.id = $1 AND p.is_active = TRUE
     GROUP BY p.id, c.id, s.id
     ORDER BY p.created_at DESC, p.id DESC
     LIMIT $2 OFFSET $3`,
    [storeId, safePageSize, offset]
  );

  return {
    store,
    products: productsResult.rows,
    totalCount,
    totalPages,
    currentPage,
    pageSize: safePageSize,
  };
}
