import { getAllPosts, getPostBySlug } from "../_lib/helpers";
import { getProjectBySlug, socialImageFor } from "@/lib/projects";
import { SITE_URL } from "@/lib/site";
import BlogShell from "@/components/blog-shell";

// The same image the home page shows for this article. Falls back to the
// post's first inline image for articles that aren't featured on the home page.
function socialImage(slug, imgs) {
  const card = getProjectBySlug(slug);
  if (card) return { src: socialImageFor(card.imageLink), alt: card.projectName };
  const first = imgs?.[0];
  return first ? { src: first.img, alt: first.alt } : null;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = getAllPosts(["slug"]);

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }) {
  const slug = params.slug;
  const { title, description, imgs } = getPostBySlug(slug, [
    "title",
    "description",
    "imgs",
  ]);

  const metadata = { title, description };

  const social = socialImage(slug, imgs);
  if (social) {
    const url = new URL(social.src, SITE_URL).href;
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

  const { title, description, content, date, category, imgs } = getPostBySlug(
    slug,
    ["title", "description", "content", "date", "category", "imgs"]
  );

  const social = socialImage(slug, imgs);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    datePublished: date,
    mainEntityOfPage: `${SITE_URL}/blog/${slug}`,
    author: {
      "@type": "Person",
      name: "Morgan Collado",
      url: SITE_URL,
    },
    ...(social && { image: new URL(social.src, SITE_URL).href }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogShell
        title={title}
        description={description}
        content={content}
        date={date}
        category={category}
      />
    </>
  );
};

export default BlogPost;
