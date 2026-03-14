import type { Metadata } from "next";
import Link from "next/link";

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
        <header>
          <nav>
            <ul>
              <li>
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href="/auth">Auth</Link>
              </li>
            </ul>
          </nav>
        </header>

        <main>{children}</main>

        <footer>
          <p>&copy; 2026 Marketplace Kursów Online. Wszystkie prawa zastrzeżone.</p>
        </footer>
      </body>
    </html>
  );
}
