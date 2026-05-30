/**
 * Exécute migrations_v2.sql sur Supabase (nécessite DATABASE_URL ou SUPABASE_DB_PASSWORD).
 * Usage: node scripts/run-migration.mjs
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, "../supabase/migrations_v2.sql"), "utf8");

const ref = "ngtnnoqmupbixszuugih";
const password = process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD;

if (!password) {
  console.error(
    "Manque SUPABASE_DB_PASSWORD (mot de passe DB du projet Supabase → Settings → Database)",
  );
  process.exit(1);
}

const { default: pg } = await import("pg");
const client = new pg.Client({
  connectionString: `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-eu-west-3.pooler.supabase.com:6543/postgres`,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log("Migration V2 OK");
} catch (e) {
  console.error("Migration erreur:", e.message);
  process.exit(1);
} finally {
  await client.end();
}
