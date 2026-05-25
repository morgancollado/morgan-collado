import Link from "next/link";
import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  Typography,
} from "@mui/material";
import { formatDate } from "@/lib/format-date";

export default function BlogCard({ post }) {
  const thumb = post.imgs?.[0]?.img;

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "transform .2s ease, box-shadow .2s ease",
        "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
      }}
    >
      <CardActionArea
        component={Link}
        href={`/blog/${post.slug}`}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
        }}
      >
        {thumb && <CardMedia component="div" sx={{ pt: "56.25%" }} image={thumb} />}
        <CardContent sx={{ flexGrow: 1, width: "100%" }}>
          {post.category && (
            <Chip
              label={post.category}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ mb: 1 }}
            />
          )}
          <Typography gutterBottom variant="h5" component="h2">
            {post.title}
          </Typography>
          <Typography color="text.secondary">{post.description}</Typography>
          {post.date && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1.5 }}
            >
              {formatDate(post.date)}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
