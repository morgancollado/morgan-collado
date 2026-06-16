import { getAllPosts, getPostBySlug } from "../_lib/helpers";
import { getProjectBySlug, socialImageFor } from "@/lib/projects";
import BlogShell from "@/components/blog-shell";

export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = getAllPosts(["slug"]);

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const slug = params.slug;
  const { title, description, imgs } = getPostBySlug(slug, [
    "title",
    "description",
    "imgs",
  ]);

  const metadata = { title, description };

  // Use the same image the home page shows for this article. Fall back to the
  // post's first inline image for articles that aren't featured on the home page.
  const card = getProjectBySlug(slug);
  const social = card
    ? { src: socialImageFor(card.imageLink), alt: card.projectName }
    : imgs?.[0]
    ? { src: imgs[0].img, alt: imgs[0].alt }
    : null;

  if (social) {
    const url = baseUrl ? new URL(social.src, baseUrl).href : social.src;
    metadata.openGraph = {
      images: [{ url, alt: social.alt }],
    };
    metadata.twitter = {
      card: "summary_large_image",
      images: [url],
    };
  }

  return metadata;
}

const BlogPost = ({ params }) => {
  const { slug } = params;

  const { title, description, content, date, category } = getPostBySlug(slug, [
    "title",
    "description",
    "content",
    "date",
    "category",
  ]);

  return (
    <BlogShell
      title={title}
      description={description}
      content={content}
      date={date}
      category={category}
    />
  );
};

export default BlogPost;
