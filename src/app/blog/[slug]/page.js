import * as React from "react";
import { Box, Grid, Typography } from "@mui/material";
import { getAllPosts, getPostBySlug } from "../_lib/helpers";
import CustomCarousel from "@/components/custom-carousel";
import BackToTop from "@/components/back-to-top";

export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = getAllPosts(["slug"]);

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({params}, parent) {
  const slug = params.slug
  const { title, description, imgs } = getPostBySlug(slug, ['title', 'description', 'imgs'])
  const previousImages = (await parent).openGraph?.images || []
  return {
    title: title,
    description: description,
    openGraph: {
      images: [`${imgs[0].img}`, ...previousImages]
    }
  }
}

const BlogPost = ({ params }) => {
  const { slug } = params;

  const { title, content, imgs } = getPostBySlug(slug, [
    "title",
    "content",
    "imgs",
  ]);
  let splitContent = content.split("\n\n");
  return (
    <Box sx={{ flexGrow: 1, padding: 5 }}>
      <Grid container spacing={2} justifyContent="center" alignItems="center">
        <Grid item xs={12} md={6}>
          <CustomCarousel imgs={imgs} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h4" component="h1" gutterBottom>
            {title}
          </Typography>
          {splitContent.map((content, index) => (
            <Typography key={index} sx={{ padding: 1 }}>
              {content}
            </Typography>
          ))}
        </Grid>
      </Grid>
      <BackToTop />
    </Box>
  );
};

export default BlogPost;
