import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { getAllPostsSorted } from "../blog/_lib/helpers";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

function escapeXml(value = "") {
  return String(value).replace(/[<>&'"]/g, (c) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;",
  })[c]);
}

// Full article HTML for feed readers: same remark pipeline the site's
// article pages use, with root-relative links and images made absolute.
const markdown = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeStringify);

function renderContent(content = "") {
  const html = String(markdown.processSync(content));
  return html.replace(/(src|href)="\//g, `$1="${SITE_URL}/`);
}

function cdata(value = "") {
  return `<![CDATA[${String(value).replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;
}

export async function GET() {
  const posts = getAllPostsSorted([
    "slug",
    "title",
    "description",
    "date",
    "category",
    "content",
  ]);

  const items = posts
    .map((post) => {
      const url = `${SITE_URL}/blog/${post.slug}`;
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(post.description)}</description>
      <content:encoded>${cdata(renderContent(post.content))}</content:encoded>
      ${post.category ? `<category>${escapeXml(post.category)}</category>` : ""}
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    </item>`;
    })
    .join("\n");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Morgan Collado — Writing</title>
    <link>${SITE_URL}/blog</link>
    <description>Notes on the software I've built — the projects, the problems, and the lessons along the way.</description>
    <language>en-us</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date(posts[0]?.date ?? Date.now()).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
