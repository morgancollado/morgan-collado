import { Box, Grid, Typography } from "@mui/material";
import Image from "next/image";
import BackToTop from "./back-to-top";
import CustomCarousel from "./custom-carousel";
import { formatDate } from "@/lib/format-date";

const WIDTHS = {
  prose: { xs: 12, md: 8, lg: 6 },
  wide: { xs: 12, md: 10 },
  gallery: { xs: 12, md: 10 },
};

export default function BlogShell({
  title,
  date,
  category,
  layout = "prose",
  hero = false,
  imgs = [],
  children,
}) {
  const cols = WIDTHS[layout] || WIDTHS.prose;
  const meta = [category, formatDate(date)].filter(Boolean).join("  ·  ");

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, md: 5 } }}>
      {hero && imgs?.[0] && (
        <Box
          sx={{
            position: "relative",
            width: "100%",
            aspectRatio: "21/9",
            mb: 5,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Image
            src={imgs[0].img}
            alt={imgs[0].alt || ""}
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
        </Box>
      )}
      <Grid container justifyContent="center">
        <Grid item {...cols}>
          <Typography variant="h2" component="h1" align="center" gutterBottom sx={{ mb: 1 }}>
            {title}
          </Typography>
          {meta && (
            <Typography
              variant="subtitle2"
              align="center"
              color="text.secondary"
              sx={{ mb: 4 }}
            >
              {meta}
            </Typography>
          )}
          {layout === "gallery" && imgs?.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <CustomCarousel imgs={imgs} />
            </Box>
          )}
          {children}
        </Grid>
      </Grid>
      <BackToTop />
    </Box>
  );
}
