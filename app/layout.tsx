import Navbar from "@/components/general/navigation/Navbar";
import type { Metadata } from "next";
import Link from "next/link";
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

        <footer>
          <p>&copy; 2026 Marketplace Kursów Online. Wszystkie prawa zastrzeżone.</p>
        </footer>
      </body>
    </html>
  );
}
