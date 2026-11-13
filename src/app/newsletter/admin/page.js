import NewsletterAdmin from "./NewsletterAdmin";
import { listSendable } from "@/lib/newsletter/posts";

export const metadata = {
  title: "Newsletter | Morgan Collado",
  robots: { index: false, follow: false },
};

/**
 * The send console.
 *
 * The post list is read at build time, exactly as /blog and /poetry read
 * theirs. That is deliberate rather than incidental: the inventory here is by
 * construction the set of pieces that are actually deployed and live, so it is
 * impossible to email a link that 404s. A newly written post shows up here
 * after the deploy that publishes it, which is the correct order anyway.
 */
export default function NewsletterAdminPage() {
  const { blog, poetry } = listSendable();
  return <NewsletterAdmin blog={blog} poetry={poetry} />;
}
