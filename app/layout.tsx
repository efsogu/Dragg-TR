import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/lib/i18n";
import "./globals.css";

const satoshi = localFont({
  src: [
    {
      path: "../public/fonts/satoshi/satoshi-light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/satoshi/satoshi-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/satoshi/satoshi-medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/satoshi/satoshi-bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

const SITE_URL = "https://dragg-tr.vercel.app";
const REPOSITORY_URL = "https://github.com/efsogu/Dragg-TR";
const DESCRIPTION =
  "Free and open-source personal finance app. Track income, expenses, budgets, goals, and reports. Self-hostable. Built with Next.js + Supabase.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Dragg-TR – Personal Finance Dashboard | Open Source",
    template: "%s | Dragg-TR",
  },
  description: DESCRIPTION,
  keywords: [
    "personal finance",
    "expense tracker",
    "budget app",
    "open source finance",
    "self-hosted budget tracker",
    "finance dashboard",
    "free budget app",
    "nextjs finance app",
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Dragg-TR",
    title: "Dragg-TR – Open Source Personal Finance Dashboard",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Dragg-TR – Open Source Personal Finance Dashboard",
    description: DESCRIPTION,
  },
  icons: {
    icon: [
      {
        url: "/dragg-icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/dragg-icon-app.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFF9F1" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0D0E" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("dragg-theme");var d=t==="dark"||t==="light"?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Dragg-TR",
  alternateName: "Dragg Finance",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description:
    "Free and open-source personal finance app. Track income, expenses, budgets, goals, and reports. Self-hostable.",
  inLanguage: ["tr-TR", "en", "pt-BR"],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "TRY",
  },
  url: SITE_URL,
  sameAs: [REPOSITORY_URL],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${satoshi.variable} bg-background font-sans antialiased`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_INIT_SCRIPT,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(STRUCTURED_DATA),
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            {children}
            <Toaster richColors position="top-right" />
          </LanguageProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
        <SpeedInsights />
      </body>
    </html>
  );
}
