const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");

function loadEnvFiles(rootDir = process.cwd()) {
  const candidates = [".env.local", ".env"];

  for (const filename of candidates) {
    const filePath = path.join(rootDir, filename);
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const content = fs.readFileSync(filePath, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }

      const eqIndex = line.indexOf("=");
      if (eqIndex <= 0) {
        continue;
      }

      const key = line.slice(0, eqIndex).trim();
      let value = line.slice(eqIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
}

/**
 * Create a short-lived PostgreSQL Pool for CLI seed scripts.
 */
function createScriptPool() {
  loadEnvFiles();
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is required in .env.local or environment variables.");
  }
  return new Pool({ connectionString });
}

module.exports = {
  loadEnvFiles,
  createScriptPool,
};
