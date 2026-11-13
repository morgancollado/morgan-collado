import { getPostBySlug, getAllPostsSorted } from "@/app/blog/_lib/helpers";
import { getPoemBySlug, getAllPoems } from "@/app/poetry/_lib/poems";
import { isTopic } from "@/lib/newsletter/db";

/**
 * The bridge between the two content collections and the mailer.
 *
 * Both are read from disk, so anything importing this module is Node only. It
 * runs from the send workflow, not from the site.
 */

const BLOG_FIELDS = ["slug", "title", "description", "date"];

/** How many opening lines of a poem ride along in the notification. */
const POEM_EXCERPT_LINES = 4;

/**
 * Filenames are slugs, so anything outside this shape cannot name a file.
 * Letters may be uppercase because some published filenames are (Lioness.md);
 * no dot or slash is allowed, so nothing here can climb out of the directory.
 */
export function isSlugShaped(slug) {
  return typeof slug === "string" && /^[A-Za-z0-9][A-Za-z0-9-]{0,120}$/.test(slug);
}

/** Everything sendable, newest first. A blank slug in the send workflow takes the first. */
export function listSendable() {
  const posts = getAllPostsSorted(BLOG_FIELDS).map((post) => ({
    kind: "blog",
    slug: post.slug,
    title: post.title || post.slug,
    date: post.date || "",
    description: post.description || "",
  }));

  const poems = getAllPoems().map((poem) => ({
    kind: "poetry",
    slug: poem.slug,
    title: poem.title,
    date: poem.date,
    excerpt: (poem.stanzas[0] || []).slice(0, POEM_EXCERPT_LINES),
  }));

  return { blog: posts, poetry: poems };
}

/**
 * One piece, read fresh from disk at send time.
 *
 * The body of an email going to real subscribers comes from the repository,
 * never from what someone typed into the workflow form. Returns null for
 * anything that isn't on disk.
 */
export function loadForSend(kind, slug) {
  if (!isTopic(kind) || !isSlugShaped(slug)) return null;

  try {
    if (kind === "blog") {
      const post = getPostBySlug(slug, BLOG_FIELDS);
      if (!post?.title) return null;
      return {
        slug,
        title: post.title,
        date: post.date || "",
        description: post.description || "",
      };
    }

    const poem = getPoemBySlug(slug);
    if (!poem?.title) return null;
    return {
      slug,
      title: poem.title,
      date: poem.date,
      excerpt: (poem.stanzas[0] || []).slice(0, POEM_EXCERPT_LINES),
    };
  } catch {
    // getBySlug throws ENOENT for a slug with no file behind it.
    return null;
  }
}
