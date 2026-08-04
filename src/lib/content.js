import fs from "fs";
import { join } from "path";
import matter from "gray-matter";

/**
 * Directory-parameterized markdown loader.
 *
 * The blog and the poetry section both keep their content as markdown files
 * with frontmatter, read from disk at build time. This is the one
 * implementation both of them use.
 *
 * @param {string} contentDir path relative to the project root, e.g.
 *   "src/app/blog/_content"
 */
export function createContentLoader(contentDir) {
  const directory = join(process.cwd(), contentDir);

  function getSlugs() {
    return fs.readdirSync(directory).filter((file) => file.endsWith(".md"));
  }

  function getBySlug(slug, fields) {
    const realSlug = slug.replace(/\.md$/, "");
    const fullPath = join(directory, `${realSlug}.md`);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    let items = {};

    // Ensure only the minimal needed data is exposed
    fields.forEach((field) => {
      if (field === "slug") {
        items[field] = realSlug;
      }
      if (field === "content") {
        items[field] = content;
      }

      if (typeof data[field] !== "undefined") {
        items[field] = data[field];
      }
    });

    return items;
  }

  function getAll(fields) {
    return getSlugs().map((slug) => getBySlug(slug, fields));
  }

  function getAllSorted(fields) {
    const withDate = fields.includes("date") ? fields : [...fields, "date"];
    return getAll(withDate).sort((a, b) =>
      (b.date || "").localeCompare(a.date || "")
    );
  }

  return { getSlugs, getBySlug, getAll, getAllSorted };
}
