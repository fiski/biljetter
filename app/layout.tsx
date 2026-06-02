import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond, Crimson_Text, IBM_Plex_Mono, Inter, Montserrat, Spectral } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["400", "500", "600", "800"],
  display: "swap",
});

const crimsonText = Crimson_Text({
  variable: "--font-crimson-text",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "biljetter - Konserter i Göteborg",
  description: "Hitta konserter och evenemang i Göteborg",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body
        className={`${cinzel.variable} ${cormorant.variable} ${ibmPlexMono.variable} ${inter.variable} ${montserrat.variable} ${spectral.variable} ${crimsonText.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
