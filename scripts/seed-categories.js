const { createScriptPool } = require("./env");

const INITIAL_CATEGORIES = [
  { name: "Ikan Pelagis", slug: "ikan-pelagis" },
  { name: "Ikan Karang", slug: "ikan-karang" },
  { name: "Udang & Kepiting", slug: "udang-kepiting" },
  { name: "Cumi & Kerang", slug: "cumi-kerang" },
  { name: "Olahan Laut", slug: "olahan-laut" },
];

async function main() {
  const pool = createScriptPool();

  try {
    let inserted = 0;

    for (const category of INITIAL_CATEGORIES) {
      const result = await pool.query(
        `INSERT INTO categories (name, slug)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING
         RETURNING id, name, slug`,
        [category.name, category.slug]
      );

      if (result.rowCount > 0) {
        inserted += 1;
      }
    }

    const all = await pool.query(
      `SELECT id, name, slug FROM categories ORDER BY id ASC`
    );

    console.log(
      `Category seed completed (${inserted} inserted, ${all.rowCount} total):`,
      all.rows
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Category seed failed:", error.message);
  process.exitCode = 1;
});
