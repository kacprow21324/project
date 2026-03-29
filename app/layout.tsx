import Navbar from "@/components/general/navigation/Navbar";
import Footer from "@/components/general/navigation/Footer";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marketplace Kursów Online",
  description: "Platforma edukacyjna do nauki kursów online",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body>
        <Navbar/>

        <main>{children}</main>

        <Footer />
      </body>
    </html>
  );
}
