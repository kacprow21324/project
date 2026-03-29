'use client';

import Link from 'next/link';
import styles from './Footer.module.css';

const footerColumns = [
  {
    title: 'Wspolpraca',
    links: [
      { label: 'Zostan instruktorem', href: '/register' },
      { label: 'Program partnerski', href: '/courses' },
      { label: 'Dla firm i zespolow', href: '/courses' },
    ],
  },
  {
    title: 'Oferta',
    links: [
      { label: 'Sciezki kariery', href: '/courses' },
      { label: 'Egzaminy i certyfikaty', href: '/courses' },
      { label: 'Kursy premium', href: '/courses' },
    ],
  },
  {
    title: 'Dla uczestnikow',
    links: [
      { label: 'Program polecen', href: '/dashboard' },
      { label: 'Opinie kursantow', href: '/courses' },
      { label: 'Kontakt i wsparcie', href: '/login' },
    ],
  },
  {
    title: 'Pomoc',
    links: [
      { label: 'Centrum pomocy', href: '/courses' },
      { label: 'Polityka prywatnosci', href: '/' },
      { label: 'Regulamin platformy', href: '/' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <section className={styles.top}>
        <div className={styles.brandBlock}>
          <p className={styles.brand}>Marketplace Kursow Online</p>
          <p className={styles.contact}>kontakt@marketplacekursow.pl</p>
          <p className={styles.contact}>+48 500 600 700</p>
        </div>

        {footerColumns.map((column) => (
          <div key={column.title} className={styles.column}>
            <h4 className={styles.columnTitle}>{column.title}</h4>
            <ul className={styles.linkList}>
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className={styles.link}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className={styles.newsletter}>
          <h4 className={styles.columnTitle}>Newsletter</h4>
          <p className={styles.newsText}>Dostawaj informacje o nowych kursach i promocjach.</p>
          <div className={styles.newsForm}>
            <input type="email" placeholder="Podaj swoj adres e-mail" className={styles.newsInput} />
            <button className={styles.newsButton}>Zapisz</button>
          </div>
          <div className={styles.socials}>
            <span className={styles.social}>f</span>
            <span className={styles.social}>x</span>
            <span className={styles.social}>yt</span>
            <span className={styles.social}>in</span>
          </div>
        </div>
      </section>

      <section className={styles.bottom}>
        <p className={styles.copy}>© 2026 Marketplace Kursow Online. Wszystkie prawa zastrzezone.</p>
        <div className={styles.bottomLinks}>
          <Link href="/" className={styles.bottomLink}>Ustawienia cookies</Link>
          <Link href="/" className={styles.bottomLink}>Polityka prywatnosci</Link>
          <Link href="/" className={styles.bottomLink}>Regulamin zakupow</Link>
        </div>
      </section>
    </footer>
  );
}
