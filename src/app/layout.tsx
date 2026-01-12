import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const cinzel = Cinzel({ subsets: ["latin"], variable: '--font-cinzel' });

export const metadata: Metadata = {
  title: "Eldritch Horror Map",
  description: "Interactive Game Board",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${cinzel.variable} antialiased`}>{children}</body>
    </html>
  );
}
