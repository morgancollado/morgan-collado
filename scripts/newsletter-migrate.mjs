/**
 * Applies scripts/newsletter-schema.sql to DATABASE_URL.
 *
 * Standalone by design, like scripts/generate-og-images.mjs — the schema is a
 * handful of statements and wiring a migration framework into `build` would be
 * the heaviest thing in the repo. The SQL is all `if not exists`, so re-running
 * this is a no-op.
 *
 *   npm run newsletter:migrate
 */
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import { schemaStatements } from "./newsletter-statements.mjs";

const here = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: join(here, "..", ".env.local") });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    "DATABASE_URL is not set. Add it to .env.local (see .env.local.example)."
  );
  process.exit(1);
}

const statements = schemaStatements();

const sql = neon(url);

for (const statement of statements) {
  const label = statement.replace(/\s+/g, " ").slice(0, 60);
  try {
    // Called as a plain function: driver 0.10 has no sql.query().
    await sql(statement);
    console.log(`ok   ${label}…`);
  } catch (error) {
    console.error(`fail ${label}…`);
    console.error(error.message);
    process.exit(1);
  }
}

console.log(`\nApplied ${statements.length} statements.`);
