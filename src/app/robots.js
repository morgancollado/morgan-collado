import { SITE_URL } from "@/lib/site";

export default function robots() {
  return {
    rules: [
      {
        // The queen page is kept out of the index by its own robots meta tag
        // (noindex, nofollow) — listing it here would publish the URL.
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
