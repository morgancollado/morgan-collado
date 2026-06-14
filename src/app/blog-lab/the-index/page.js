import { getAllPostsSorted } from "@/app/blog/_lib/helpers";
import TheIndex from "@/components/blog-lab/the-index";

export const metadata = {
  title: "The Index — Blog Lab",
  robots: { index: false, follow: false },
};

export default function TheIndexPage() {
  const posts = getAllPostsSorted([
    "slug",
    "title",
    "imgs",
    "date",
    "category",
  ]);
  return <TheIndex posts={posts} />;
}
