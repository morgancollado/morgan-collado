import Link from "next/link";
import { Box, Typography } from "@mui/material";
import { playfair } from "./_lib/fonts";
import { DuotoneFilters } from "./_lib/duotone";

export const metadata = {
  title: "Blog Lab — Morgan Collado",
  description: "Exploratory visual treatments for the blog. Not for indexing.",
  robots: { index: false, follow: false },
};

export default function LabLayout({ children }) {
  return (
    <div className={playfair.variable}>
      <DuotoneFilters />
      <Box
        component="nav"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: { xs: 2, md: 4 },
          py: 1.25,
          borderBottom: 1,
          borderColor: "divider",
          fontFamily: "var(--font-playfair)",
        }}
      >
        <Typography
          component={Link}
          href="/blog-lab"
          variant="overline"
          sx={{
            letterSpacing: 3,
            color: "inherit",
            textDecoration: "none",
            "&:hover": { color: "primary.main" },
          }}
        >
          ◀ Blog Lab
        </Typography>
        <Typography
          component={Link}
          href="/blog"
          variant="overline"
          sx={{
            letterSpacing: 3,
            color: "text.secondary",
            textDecoration: "none",
            "&:hover": { color: "primary.main" },
          }}
        >
          Production /blog ↗
        </Typography>
      </Box>
      {children}
    </div>
  );
}
