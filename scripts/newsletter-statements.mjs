import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * newsletter-schema.sql as one statement per entry. Neon's HTTP driver runs a
 * single statement per request, so the migration sends these one at a time.
 * Comment-only fragments are dropped.
 */
export function schemaStatements() {
  return readFileSync(join(here, "newsletter-schema.sql"), "utf8")
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s && !s.split("\n").every((line) => line.trim().startsWith("--")));
}
