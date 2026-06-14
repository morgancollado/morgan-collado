import { getPostBySlug } from "@/app/blog/_lib/helpers";
import { readingTime } from "../_lib/reading-time";
import ReadingRoom from "@/components/blog-lab/reading-room";

export const metadata = {
  title: "Reading Room — Blog Lab",
  robots: { index: false, follow: false },
};

export default function ReadingRoomPage() {
  const post = getPostBySlug("onboarding", [
    "title",
    "content",
    "date",
    "category",
  ]);
  return <ReadingRoom {...post} readMin={readingTime(post.content)} />;
}
