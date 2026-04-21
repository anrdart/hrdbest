import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { SITE_CONFIG } from "@/constants";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });
const outfit = Outfit({ subsets: ["latin"], weight: ["700", "800", "900"] });

export const metadata: Metadata = {
  title: {
    default: SITE_CONFIG.name,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className} suppressHydrationWarning>
        <div id="app-root" style={{ height: '100%', width: '100%', isolation: 'isolate', ...outfit.style }}>
          {children}
        </div>
        
        {/* Mobile Debugger - Eruda */}
        <Script src="https://cdn.jsdelivr.net/npm/eruda" strategy="afterInteractive" />
        <Script id="eruda-init" strategy="afterInteractive">
          {`if (typeof eruda !== 'undefined') eruda.init();`}
        </Script>
      </body>
    </html>
  );
}
