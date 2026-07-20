// Canonical site origin for absolute URLs (RSS, sitemap, JSON-LD, OG images).
// NEXT_PUBLIC_BASE_URL lets previews override it.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.morgancollado.com"
).replace(/\/$/, "");
