import { Inter } from "next/font/google";
import { ThemeProvider } from "@/context/theme-context";
import CssBaseline from "@mui/material/CssBaseline";
import NavBar from "@/components/navbar";
import Footer from "@/components/footer";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  metadataBase: new URL(`https://${process.env.VERCEL_URL}`),
  title: "Morgan Collado",
  description:
    "A skilled software engineer who wants to make the world a better place.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <ThemeProvider>
        <CssBaseline />
        <body className={inter.className}>
          <NavBar />
          {children}
          <Footer />
          <Analytics />
          <SpeedInsights />
        </body>
      </ThemeProvider>
    </html>
  );
}
