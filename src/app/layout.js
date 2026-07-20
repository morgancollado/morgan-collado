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
import { FolioProvider } from "@/context/folio-context";
import { currentFolio } from "./blog/_lib/helpers";
import styles from "./layout.module.css";
import "./theme.css";

// Runs before anything paints so the saved (or OS) theme applies to the
// server-rendered HTML via the data-theme CSS variables — no light flash.
const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark")t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}})()`;

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
    <html lang="en" className={playfair.variable} suppressHydrationWarning>
      <ThemeProvider>
        <CssBaseline />
        <body className={inter.className}>
          <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
          <a href="#main-content" className={styles.skipLink}>
            Skip to content
          </a>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
          />
          <DuotoneFilters />
          <NavBar />
          <FolioProvider value={currentFolio()}>
            <main id="main-content">{children}</main>
          </FolioProvider>
          <Footer />
          <Analytics />
          <SpeedInsights />
        </body>
      </ThemeProvider>
    </html>
  );
}
