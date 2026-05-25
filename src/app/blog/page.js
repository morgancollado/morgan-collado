import { Container, Grid, Typography } from "@mui/material";
import { getAllPostsSorted } from "./_lib/helpers";
import BlogCard from "@/components/blog-card";
import BackToTop from "@/components/back-to-top";

export const metadata = {
  title: "Blog | Morgan Collado",
  description:
    "Notes on the software I've built — the projects, the problems, and the lessons along the way.",
};

export default function BlogIndex() {
  const posts = getAllPostsSorted([
    "slug",
    "title",
    "description",
    "imgs",
    "date",
    "category",
  ]);

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Typography variant="h2" component="h1" align="center" gutterBottom>
        Blog
      </Typography>
      <Typography
        variant="h6"
        component="p"
        align="center"
        color="text.secondary"
        sx={{ mb: 6 }}
      >
        Notes on the software I&apos;ve built.
      </Typography>
      <Grid container spacing={4}>
        {posts.map((post) => (
          <Grid item key={post.slug} xs={12} sm={6} md={4}>
            <BlogCard post={post} />
          </Grid>
        ))}
      </Grid>
      <BackToTop />
    </Container>
  );
}
