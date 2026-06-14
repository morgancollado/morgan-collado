import { getPostBySlug } from "@/app/blog/_lib/helpers";
import AtelierBroadsheet from "@/components/blog-lab/atelier-broadsheet";

export const metadata = {
  title: "The Atelier Broadsheet — Blog Lab",
  robots: { index: false, follow: false },
};

export default function AtelierBroadsheetPage() {
  const post = getPostBySlug("onboarding", [
    "title",
    "description",
    "content",
    "date",
    "category",
  ]);
  return <AtelierBroadsheet {...post} />;
}
