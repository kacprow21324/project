'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import styles from './Courses.module.css';
import {
  fetchCategories,
  mapCourseRowToAppCourse,
  roleIdToName,
  type AppCourse,
  type CategoryOption,
  type UserRole,
} from '@/lib/appData';

export default function Courses() {
  const [availableCourses, setAvailableCourses] = useState<AppCourse[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>('User');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [maxPriceFilter, setMaxPriceFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<number[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const fetchCourses = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const [coursesResponse, categoryData, authData] = await Promise.all([
          supabase
            .from('courses')
            .select('id, title, description, level, price, category_id, instructor_uid, isOpen, categories(id, title)')
            .order('created_at', { ascending: false }),
          fetchCategories(),
          supabase.auth.getSession(),
        ]);

        if (!isActive) {
          return;
        }

        const { data, error } = coursesResponse;

        if (error || !data) {
          console.error('Error fetching courses:', error);
          setAvailableCourses([]);
          setLoadError('Nie udało się pobrać kursów. Spróbuj ponownie za chwilę.');
        } else {
          const mapped = data.map((row) => mapCourseRowToAppCourse(row));
          setAvailableCourses(mapped.filter((course) => course.isOpen));
        }

        setCategories(categoryData);

        const authedUser = authData?.data?.session?.user;
        if (authedUser) {
          const [roleResult, signupResult] = await Promise.all([
            supabase
              .from('users')
              .select('role_id')
              .eq('UID', authedUser.id)
              .single(),
            supabase
              .from('course_signups')
              .select('course_id')
              .eq('user_uid', authedUser.id),
          ]);

          if (!isActive) {
            return;
          }

          setUserRole(roleResult.data ? roleIdToName(roleResult.data.role_id) : 'User');
          setEnrolledCourseIds((signupResult.data ?? []).map((signup) => Number(signup.course_id)));
        } else {
          setEnrolledCourseIds([]);
        }
      } catch (error) {
        console.error('Unexpected error while loading courses:', error);
        if (isActive) {
          setLoadError('Wystąpił nieoczekiwany błąd podczas ładowania kursów.');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchCourses();

    return () => {
      isActive = false;
    };
  }, []);

  const handleEnroll = async (courseId: number) => {
    const { data: authData } = await supabase.auth.getSession();
    const authedUser = authData?.session?.user;
    if (!authedUser) {
      alert('Musisz być zalogowany, aby się zapisać.');
      return;
    }

    if (userRole !== 'User') {
      alert('Tylko użytkownik z rolą User może zapisać się na kurs.');
      return;
    }

    const { data: existingSignup } = await supabase
      .from('course_signups')
      .select('id')
      .eq('course_id', courseId)
      .eq('user_uid', authedUser.id)
      .maybeSingle();

    if (existingSignup) {
      alert('Jesteś już zapisany na ten kurs.');
      return;
    }

    const { error } = await supabase
      .from('course_signups')
      .insert({ course_id: courseId, user_uid: authedUser.id });

    if (error) {
      console.error('Error enrolling:', error);
      alert('Błąd podczas zapisywania: ' + error.message);
    } else {
      setEnrolledCourseIds((prev) => (prev.includes(courseId) ? prev : [...prev, courseId]));
      alert('Zapisano na kurs!');
    }
  };

  const filteredCourses = availableCourses.filter((course) => {
    const categoryMatches = categoryFilter === 'all' || String(course.categoryId) === categoryFilter;
    const levelMatches = levelFilter === 'all' || course.level === levelFilter;
    const maxPrice = maxPriceFilter.trim() === '' ? Number.POSITIVE_INFINITY : Number(maxPriceFilter);
    const priceMatches = Number.isNaN(maxPrice) ? true : course.price <= maxPrice;
    const query = searchQuery.trim().toLowerCase();
    const queryMatches =
      query === '' ||
      course.title.toLowerCase().includes(query) ||
      course.description.toLowerCase().includes(query);
    return categoryMatches && levelMatches && priceMatches && queryMatches;
  });

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    if (sortBy === 'priceAsc') return a.price - b.price;
    if (sortBy === 'priceDesc') return b.price - a.price;
    return b.id - a.id;
  });

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.heading}>Katalog kursów</h1>
          <p className={styles.subtext}>Przeglądaj kursy, filtruj i zapisuj się na szkolenia dopasowane do Twojego poziomu.</p>
        </div>
        <Link href="/dashboard" className={styles.linkBtn}>Przejdź do dashboardu</Link>
      </div>

      <div className={styles.layout}>
        <aside className={styles.filters}>
          <h2 className={styles.filterTitle}>Filtry</h2>
          <label className={styles.label}>
            Szukaj kursu
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className={styles.search}
              placeholder="Np. React, SQL, Python"
            />
          </label>

          <label className={styles.label}>
            Sortowanie
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={styles.select}>
              <option value="newest">Najnowsze</option>
              <option value="priceAsc">Cena rosnąco</option>
              <option value="priceDesc">Cena malejąco</option>
            </select>
          </label>

          <label className={styles.label}>
          Kategoria:
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={styles.select}>
            <option value="all">Wszystkie</option>
            {categories.map((category) => (
              <option key={category.id} value={String(category.id)}>
                {category.title}
              </option>
            ))}
          </select>
          </label>

          <label className={styles.label}>
          Poziom:
          <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className={styles.select}>
            <option value="all">Wszystkie</option>
            <option value="Podstawowy">Podstawowy</option>
            <option value="Średnio Zaawansowany">Średnio Zaawansowany</option>
            <option value="Zaawansowany">Zaawansowany</option>
          </select>
          </label>

          <label className={styles.label}>
          Cena maksymalna:
          <input
            type="number"
            min={0}
            value={maxPriceFilter}
            onChange={(e) => setMaxPriceFilter(e.target.value)}
            placeholder="np. 199"
            className={styles.input}
          />
          </label>
        </aside>

        <section>
          {loadError ? (
            <p className={styles.message}>{loadError}</p>
          ) : loading ? (
            <p className={styles.message}>Ładowanie kursów...</p>
          ) : sortedCourses.length === 0 ? (
            <p className={styles.message}>Brak dostępnych kursów dla wybranych filtrów.</p>
          ) : (
            <div className={styles.coursesGrid}>
              {sortedCourses.map((course) => (
                <article key={course.id} className={styles.card}>
                  <h3 className={styles.cardTitle}>{course.title}</h3>
                  <div className={styles.meta}>
                    <span className={styles.badge}>{course.level || 'Poziom nieokreślony'}</span>
                    <span className={styles.badge}>{course.category}</span>
                    <span className={styles.badge}>{course.price} PLN</span>
                  </div>
                  <p className={styles.description}>{course.description || 'Brak opisu kursu.'}</p>
                  <div className={styles.actions}>
                    <Link href={`/courses/${course.id}`} className={styles.secondaryBtn}>Zobacz szczegóły</Link>
                    {userRole === 'User' ? (
                      enrolledCourseIds.includes(course.id) ? (
                        <span className={styles.badge}>Jesteś zapisany</span>
                      ) : (
                        <button onClick={() => handleEnroll(course.id)} className={styles.primaryBtn}>
                          Zapisz się
                        </button>
                      )
                    ) : (
                      <span className={styles.message}>Zapis możliwy tylko dla roli User</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
