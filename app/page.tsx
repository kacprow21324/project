'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { mapCourseRowToAppCourse, type AppCourse } from '@/lib/appData';
import styles from './HomePage.module.css';

const categories = [
  'Programowanie',
  'Biznes',
  'Marketing',
  'Języki obce',
  'Grafika i UX',
  'Data i AI',
];

const careerPaths = [
  { title: 'Frontend Developer', subtitle: 'HTML, CSS, React, TypeScript', lessons: '42 lekcje' },
  { title: 'Data Analyst', subtitle: 'Excel, SQL, Power BI, Python', lessons: '38 lekcji' },
  { title: 'Specjalista AI', subtitle: 'Prompting, automatyzacje, narzedzia AI', lessons: '31 lekcji' },
  { title: 'Digital Marketing', subtitle: 'SEO, Meta Ads, analityka kampanii', lessons: '36 lekcji' },
];

const achievements = [
  'Ania ukonczyla kurs SQL od podstaw i zdobyla certyfikat.',
  'Krzysztof zakonczyl sciezke Frontend i rozpoczal portfolio.',
  'Monika ukonczyla kurs analizy danych i awansowala w pracy.',
  'Pawel zakonczyl kurs AI i wdrozyl automatyzacje w firmie.',
  'Karolina ukonczyla kurs Excel i oszczedza 5h tygodniowo.',
  'Mateusz zakonczyl sciezke Marketing i uruchomil kampanie.',
];

const testimonials = [
  {
    author: 'Sandra Z.',
    review: 'Najbardziej podoba mi sie praktyczna struktura lekcji i szybkie przejscie od teorii do cwiczen.',
  },
  {
    author: 'Milosz K.',
    review: 'Po miesiacu nauki mam juz pierwsze zlecenia. Dashboard postepu mocno motywuje.',
  },
  {
    author: 'Katarzyna T.',
    review: 'Kursy sa konkretne, bez lania wody. Swietne materialy dla osob, ktore chca zmiany zawodowej.',
  },
];

export default function Home() {
  const [featuredCourses, setFeaturedCourses] = useState<AppCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadFeatured = async () => {
      try {
        const result = await supabase
          .from('courses')
          .select('id, title, description, level, price, category_id, instructor_uid, isOpen, categories(id, title)')
          .eq('isOpen', true)
          .order('created_at', { ascending: false })
          .limit(8);

        if (!isActive) return;

        setFeaturedCourses((result.data ?? []).map((row) => mapCourseRowToAppCourse(row)));
      } catch (error) {
        console.error('Error loading homepage courses:', error);
        if (isActive) {
          setFeaturedCourses([]);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadFeatured();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <h1 className={styles.heroTitle}>Ucz się praktycznie. Buduj nowe kompetencje krok po kroku.</h1>
          <p className={styles.heroText}>
            Marketplace kursów online dla użytkowników, instruktorów i zespołów. Przeglądaj kursy,
            zapisuj się, śledź postępy i rozwijaj się w tempie, które pasuje do Ciebie.
          </p>
          <div className={styles.heroActions}>
            <Link href="/courses" className={styles.btnPrimary}>Przeglądaj kursy</Link>
            <Link href="/register" className={styles.btnGhost}>Załóż konto</Link>
          </div>
        </div>
        <ul className={styles.heroList}>
          <li>Realna ścieżka nauki: kurs → lekcje → postęp</li>
          <li>Panel instruktora z tworzeniem kursów i analizą uczestników</li>
          <li>Recenzje kursów i transparentna ocena jakości treści</li>
          <li>Filtry po kategorii, poziomie, cenie i wyszukiwarka</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Najpopularniejsze kategorie</h2>
        <div className={styles.categoryGrid}>
          {categories.map((category) => (
            <div key={category} className={styles.categoryCard}>{category}</div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTop}>
          <h2 className={styles.sectionTitle}>Sciezki kariery</h2>
          <Link href="/courses" className={styles.courseLink}>Zobacz wszystkie sciezki</Link>
        </div>
        <div className={styles.pathGrid}>
          {careerPaths.map((path) => (
            <article key={path.title} className={styles.pathCard}>
              <h3>{path.title}</h3>
              <p className={styles.muted}>{path.subtitle}</p>
              <p className={styles.pathMeta}>{path.lessons}</p>
              <Link href="/courses" className={styles.courseLink}>Rozpocznij sciezke</Link>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Dlaczego warto uczyć się tutaj</h2>
        <div className={styles.valueGrid}>
          <article className={styles.valueCard}>
            <h3>Jasna struktura kursów</h3>
            <p className={styles.muted}>Każdy kurs ma plan lekcji i podział na sekcje, żeby nauka była przewidywalna.</p>
          </article>
          <article className={styles.valueCard}>
            <h3>Widoczny postęp</h3>
            <p className={styles.muted}>Oznaczaj ukończone lekcje i monitoruj procent realizacji kursu.</p>
          </article>
          <article className={styles.valueCard}>
            <h3>Wiedza od praktyków</h3>
            <p className={styles.muted}>Instruktorzy tworzą i aktualizują kursy zgodnie z potrzebami rynku.</p>
          </article>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Polecane kursy</h2>
        {loading ? (
          <p className={styles.muted}>Ładowanie kursów...</p>
        ) : featuredCourses.length === 0 ? (
          <p className={styles.muted}>Brak kursów do wyświetlenia.</p>
        ) : (
          <div className={styles.courseGrid}>
            {featuredCourses.map((course) => (
              <article key={course.id} className={styles.courseCard}>
                <h3>{course.title}</h3>
                <div className={styles.courseMeta}>
                  <span className={styles.badge}>{course.level || 'Poziom nieokreślony'}</span>
                  <span className={styles.badge}>{course.category}</span>
                  <span className={styles.badge}>{course.price} PLN</span>
                </div>
                <p className={styles.muted}>{course.description || 'Brak opisu kursu.'}</p>
                <Link href={`/courses/${course.id}`} className={styles.courseLink}>Przejdź do kursu</Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className={styles.ctaBand}>
        <div>
          <h2 className={styles.ctaTitle}>Nie wiesz od czego zaczac nauke?</h2>
          <p className={styles.ctaText}>Wybierz obszar, ktory chcesz rozwijac, a my poprowadzimy Cie krok po kroku przez kursy i lekcje.</p>
        </div>
        <Link href="/courses" className={styles.btnPrimary}>Rozpocznij teraz</Link>
      </section>

      <section className={styles.section}>
        <div className={styles.statsHero}>
          <h2 className={styles.statsTitle}>Dolacz do 372 000 osob, ktore rozwijaja kompetencje online.</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}><strong>19 lat</strong><span>doswiadczenia szkoleniowego</span></div>
            <div className={styles.statCard}><strong>1200+</strong><span>kursow i sciezek kariery</span></div>
            <div className={styles.statCard}><strong>94%</strong><span>uzytkownikow poleca platforme</span></div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTop}>
          <h2 className={styles.sectionTitle}>Najnowsze osiagniecia uczestnikow</h2>
          <Link href="/courses" className={styles.courseLink}>Baza specjalistow</Link>
        </div>
        <div className={styles.achievementGrid}>
          {achievements.map((item) => (
            <article key={item} className={styles.achievementCard}>
              <span className={styles.achievementTime}>Najnowsze</span>
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Opinie naszych uczestnikow</h2>
        <div className={styles.testimonialGrid}>
          {testimonials.map((item) => (
            <article key={item.author} className={styles.testimonialCard}>
              <div className={styles.avatar}>{item.author[0]}</div>
              <p className={styles.testimonialAuthor}>{item.author}</p>
              <p className={styles.muted}>{item.review}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
