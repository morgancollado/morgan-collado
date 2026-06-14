import { getPostBySlug } from "@/app/blog/_lib/helpers";
import { readingTime } from "../_lib/reading-time";
import Offset from "@/components/blog-lab/offset";

export const metadata = {
  title: "Offset Editorial — Blog Lab",
  robots: { index: false, follow: false },
};

export default function OffsetPage() {
  const post = getPostBySlug("onboarding", [
    "title",
    "content",
    "date",
    "category",
  ]);
  return <Offset {...post} readMin={readingTime(post.content)} />;
}
