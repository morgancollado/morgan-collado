import { getPostBySlug } from "@/app/blog/_lib/helpers";
import Broadsheet from "@/components/blog-lab/broadsheet";

export const metadata = {
  title: "The Broadsheet — Blog Lab",
  robots: { index: false, follow: false },
};

export default function BroadsheetPage() {
  const post = getPostBySlug("onboarding", [
    "title",
    "description",
    "content",
    "date",
    "category",
  ]);
  return <Broadsheet {...post} />;
}
