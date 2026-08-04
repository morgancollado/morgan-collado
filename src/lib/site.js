/**
 * The origin every absolute URL on the site is built from — og:image targets,
 * canonical links, sitemap entries.
 *
 * Order matters. `VERCEL_URL` is the *deployment* host, a new and unguessable
 * one per push, so a link preview built from it points at a build rather than
 * at the site and stops resolving once that deployment is superseded or the
 * project has deployment protection turned on.
 * `VERCEL_PROJECT_PRODUCTION_URL` is the stable production domain, which is
 * what a shared poem should carry. `VERCEL_URL` stays below it so preview
 * deployments still resolve their own images, and an explicit
 * NEXT_PUBLIC_BASE_URL overrides everything.
 */
export const siteOrigin =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL &&
    `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  "http://localhost:3000";

/** An absolute URL for a site-relative path. */
export function absoluteUrl(path = "/") {
  return new URL(path, siteOrigin).href;
}
