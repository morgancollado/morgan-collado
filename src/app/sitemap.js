import { getAllPostsSorted } from "./blog/_lib/helpers";
import { SITE_URL } from "@/lib/site";

export default function sitemap() {
  const posts = getAllPostsSorted(["slug", "date"]);
  const newest = posts[0]?.date;

  return [
    { url: SITE_URL, lastModified: newest },
    { url: `${SITE_URL}/about` },
    { url: `${SITE_URL}/blog`, lastModified: newest },
    ...posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.date,
    })),
  ];
}
