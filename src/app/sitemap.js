import { getAllPosts } from "./blog/_lib/helpers";
import { getAllPoems } from "./poetry/_lib/poems";
import { absoluteUrl } from "@/lib/site";

/**
 * The site's sitemap.
 *
 * Built from the same content loaders the pages use, so a new poem or post is
 * listed by adding the markdown file and nothing else.
 *
 * The URLs are absolute because the sitemap protocol requires it — unlike the
 * metadata routes, `metadataBase` is not applied here, and a relative `<loc>`
 * makes the whole document invalid.
 */
export default function sitemap() {
  const now = new Date();

  const routes = ["/", "/about", "/blog", "/poetry"].map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
  }));

  const posts = getAllPosts(["slug", "date"]).map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: post.date ? new Date(post.date) : now,
  }));

  const poems = getAllPoems().map((poem) => ({
    url: absoluteUrl(`/poetry/${poem.slug}`),
    lastModified: poem.date ? new Date(poem.date) : now,
  }));

  return [...routes, ...posts, ...poems];
}
