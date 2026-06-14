import { getAllPostsSorted } from "./_lib/helpers";
import BlogIndex from "@/components/blog-index";

export const metadata = {
  title: "Writing | Morgan Collado",
  description:
    "Notes on the software I've built — the projects, the problems, and the lessons along the way.",
};

export default function BlogIndexPage() {
  const posts = getAllPostsSorted([
    "slug",
    "title",
    "description",
    "imgs",
    "date",
    "category",
  ]);
  return <BlogIndex posts={posts} />;
}
