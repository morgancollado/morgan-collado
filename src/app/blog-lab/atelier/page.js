import { getPostBySlug } from "@/app/blog/_lib/helpers";
import Atelier from "@/components/blog-lab/atelier";

export const metadata = {
  title: "Atelier — Blog Lab",
  robots: { index: false, follow: false },
};

export default function AtelierPage() {
  const post = getPostBySlug("onboarding", [
    "title",
    "description",
    "content",
    "date",
    "category",
  ]);
  return <Atelier {...post} />;
}
