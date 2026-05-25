import { getAllPosts, getPostBySlug } from "../_lib/helpers";
import BlogShell from "@/components/blog-shell";
import Markdown from "@/components/markdown";

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

  if (imgs?.[0]) {
    metadata.openGraph = {
      images: [
        {
          url: baseUrl ? new URL(imgs[0].img, baseUrl).href : imgs[0].img,
          alt: imgs[0].alt,
          width: 800,
          height: 600,
        },
      ],
    };
  }

  return metadata;
}

const BlogPost = ({ params }) => {
  const { slug } = params;

  const { title, content, imgs, date, category, layout, hero } = getPostBySlug(
    slug,
    ["title", "content", "imgs", "date", "category", "layout", "hero"]
  );

  return (
    <BlogShell
      title={title}
      date={date}
      category={category}
      layout={layout}
      hero={hero}
      imgs={imgs}
    >
      <Markdown>{content}</Markdown>
    </BlogShell>
  );
};

export default BlogPost;
