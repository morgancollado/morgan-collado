import { Inter } from "next/font/google";
import { ThemeProvider } from "@/context/theme-context";
import CssBaseline from "@mui/material/CssBaseline";
import NavBar from "@/components/navbar";
import Footer from "@/components/footer";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/next"
import { playfair } from "@/lib/playfair";
import { DuotoneFilters } from "@/lib/duotone";
import { SITE_URL } from "@/lib/site";
import styles from "./layout.module.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Morgan Collado",
  description:
    "A skilled software engineer who wants to make the world a better place.",
  alternates: {
    types: {
      "application/rss+xml": [
        { url: "/feed.xml", title: "Morgan Collado — Writing" },
      ],
    },
  },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Morgan Collado",
  url: SITE_URL,
  jobTitle: "Software Engineer",
  sameAs: [
    "https://github.com/morgancollado",
    "https://www.linkedin.com/in/morgancollado",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={playfair.variable}>
      <ThemeProvider>
        <CssBaseline />
        <body className={inter.className}>
          <a href="#main-content" className={styles.skipLink}>
            Skip to content
          </a>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
          />
          <DuotoneFilters />
          <NavBar />
          <main id="main-content">{children}</main>
          <Footer />
          <Analytics />
          <SpeedInsights />
        </body>
      </ThemeProvider>
    </html>
  );
}
