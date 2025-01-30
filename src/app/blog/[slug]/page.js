import * as React from "react";
import { Box, Grid, Typography } from "@mui/material";
import { getAllPosts, getPostBySlug } from "../_lib/helpers";
import BackToTop from "@/components/back-to-top";
import Image from "next/image";

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
  const contentElements = [];
  let imageIndex = 0;

  splitContent.forEach((paragraph, idx) => {
    contentElements.push(
      <Typography
        key={`para-${idx}`}
        sx={{ paddingY: 2, textAlign: "left" }}
        variant="body1"
      >
        {paragraph}
      </Typography>
    );

    if ((idx + 1) % 2 === 0 && imageIndex < imgs.length) {
      contentElements.push(
        <Box
          key={`img-${imageIndex}`}
          sx={{
            position: "relative",
            width: "100%",
            aspectRatio: "16/9",
          }}
        >
          <Image
            src={imgs[imageIndex].img}
            alt={`Blog image ${imgs[imageIndex].alt}`}
            fill 
          />
        </Box>
      );
      imageIndex++;
    }
  });

  return (
    <Box sx={{ flexGrow: 1, padding: 5 }}>
      <Grid container justifyContent="center">
        <Grid item xs={12} md={6}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            align="center"
            sx={{ mb: 4 }}
          >
            {title}
          </Typography>
          {contentElements}
        </Grid>
      </Grid>
      <BackToTop />
    </Box>
  );
};

export default BlogPost;
