'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import styles from './LessonPage.module.css';
import { roleIdToName, type UserRole } from '@/lib/appData';

interface CourseLesson {
  id: number;
  lesson_number: number;
  title: string;
}

interface LessonSection {
  id: number;
  course_lessons_id: number;
  title: string;
  text: string;
}

interface CourseInfo {
  id: number;
  title: string;
}

export default function LessonDetailsPage() {
  const params = useParams<{ slug: string; lessonId: string }>();
  const courseId = useMemo(() => Number(params?.slug), [params]);
  const lessonId = useMemo(() => Number(params?.lessonId), [params]);

  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [sections, setSections] = useState<LessonSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('User');
  const [userId, setUserId] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isLessonDone, setIsLessonDone] = useState(false);
  const [savingDone, setSavingDone] = useState(false);
  const [courseProgress, setCourseProgress] = useState<{ done: number; total: number; percent: number }>({ done: 0, total: 0, percent: 0 });

  useEffect(() => {
    let isActive = true;

    const loadLessonPage = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!Number.isFinite(courseId) || !Number.isFinite(lessonId)) {
          setError('Nieprawidłowe parametry lekcji.');
          return;
        }

        const [courseResult, lessonsResult, sessionResult] = await Promise.all([
          supabase.from('courses').select('id, title, isOpen').eq('id', courseId).single(),
          supabase
            .from('course_lessons')
            .select('id, lesson_number, title')
            .eq('course_id', courseId)
            .order('lesson_number', { ascending: true }),
          supabase.auth.getSession(),
        ]);

        if (!isActive) return;

        if (courseResult.error || !courseResult.data) {
          setError('Kurs nie istnieje.');
          return;
        }

        if (!courseResult.data.isOpen) {
          setError('Kurs jest zamknięty.');
          return;
        }

        const loadedLessons = lessonsResult.data ?? [];
        const currentLesson = loadedLessons.find((lesson) => lesson.id === lessonId);

        if (!currentLesson) {
          setError('Nie znaleziono wskazanej lekcji.');
          return;
        }

        const sectionResult = await supabase
          .from('lesson_sections')
          .select('id, course_lessons_id, title, text')
          .eq('course_lessons_id', lessonId)
          .order('id', { ascending: true });

        if (!isActive) return;

        setCourse({ id: courseResult.data.id, title: courseResult.data.title });
        setLessons(loadedLessons);
        setSections(sectionResult.data ?? []);

        const sessionUser = sessionResult.data.session?.user;
        if (!sessionUser) {
          setUserId(null);
          setIsEnrolled(false);
          setIsLessonDone(false);
          setCourseProgress({ done: 0, total: loadedLessons.length, percent: 0 });
          return;
        }

        setUserId(sessionUser.id);

        const [roleResult, signupResult] = await Promise.all([
          supabase
            .from('users')
            .select('role_id')
            .eq('UID', sessionUser.id)
            .single(),
          supabase
            .from('course_signups')
            .select('id')
            .eq('course_id', courseId)
            .eq('user_uid', sessionUser.id)
            .maybeSingle(),
        ]);

        if (!isActive) return;

        const role = roleResult.data ? roleIdToName(roleResult.data.role_id) : 'User';
        setUserRole(role);
        const enrolled = role === 'Instructor' || role === 'Admin' || Boolean(signupResult.data);
        setIsEnrolled(enrolled);

        const lessonIds = loadedLessons.map((lesson) => lesson.id);
        const progressResult =
          lessonIds.length === 0
            ? { data: [] as Array<{ course_lessons_id: number }> }
            : await supabase
                .from('course_user_progress')
                .select('course_lessons_id')
                .eq('user_uid', sessionUser.id)
                .eq('isDone', true)
                .in('course_lessons_id', lessonIds);

        if (!isActive) return;

        const doneSet = new Set((progressResult.data ?? []).map((row) => row.course_lessons_id));
        setIsLessonDone(doneSet.has(lessonId));

        const done = doneSet.size;
        const total = lessonIds.length;
        setCourseProgress({
          done,
          total,
          percent: total === 0 ? 0 : Math.round((done / total) * 100),
        });
      } catch (e) {
        console.error('Error while loading lesson page:', e);
        if (isActive) {
          setError('Wystąpił błąd podczas ładowania lekcji.');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadLessonPage();

    return () => {
      isActive = false;
    };
  }, [courseId, lessonId]);

  const handleToggleLessonDone = async () => {
    if (!userId) {
      alert('Zaloguj się, aby zapisać postęp.');
      return;
    }

    if (!isEnrolled && userRole === 'User') {
      alert('Najpierw zapisz się na kurs, aby śledzić postęp.');
      return;
    }

    setSavingDone(true);

    try {
      const existing = await supabase
        .from('course_user_progress')
        .select('id, isDone')
        .eq('user_uid', userId)
        .eq('course_lessons_id', lessonId)
        .maybeSingle();

      if (existing.data) {
        const { error } = await supabase
          .from('course_user_progress')
          .update({ isDone: !isLessonDone })
          .eq('id', existing.data.id);

        if (error) {
          alert(`Błąd zapisu postępu: ${error.message}`);
          return;
        }
      } else {
        const { error } = await supabase
          .from('course_user_progress')
          .insert({
            user_uid: userId,
            course_lessons_id: lessonId,
            isDone: true,
          });

        if (error) {
          alert(`Błąd zapisu postępu: ${error.message}`);
          return;
        }
      }

      const nextDone = !isLessonDone;
      setIsLessonDone(nextDone);
      setCourseProgress((prev) => {
        const done = Math.max(0, Math.min(prev.total, prev.done + (nextDone ? 1 : -1)));
        return {
          done,
          total: prev.total,
          percent: prev.total === 0 ? 0 : Math.round((done / prev.total) * 100),
        };
      });
    } finally {
      setSavingDone(false);
    }
  };

  if (loading) {
    return <div>Ładowanie lekcji...</div>;
  }

  if (error || !course) {
    return (
      <div>
        <Link href="/courses" className={styles.backLink}>Wróć do katalogu</Link>
        <p>{error ?? 'Nie udało się wczytać lekcji.'}</p>
      </div>
    );
  }

  const activeLesson = lessons.find((lesson) => lesson.id === lessonId);
  const activeLessonIndex = lessons.findIndex((lesson) => lesson.id === lessonId);
  const previousLesson = activeLessonIndex > 0 ? lessons[activeLessonIndex - 1] : null;
  const nextLesson = activeLessonIndex >= 0 && activeLessonIndex < lessons.length - 1
    ? lessons[activeLessonIndex + 1]
    : null;

  return (
    <div>
      <Link href={`/courses/${course.id}`} className={styles.backLink}>Wróć do kursu</Link>
      <h1>{course.title}</h1>

      <div className={styles.page}>
        <aside className={styles.sidebar}>
          <h2 className={styles.sidebarTitle}>Plan kursu</h2>
          <ul className={styles.lessonNav}>
            {lessons.map((lesson) => (
              <li key={lesson.id}>
                <Link
                  href={`/courses/${course.id}/lesson/${lesson.id}`}
                  className={`${styles.lessonNavLink} ${lesson.id === lessonId ? styles.active : ''}`}
                >
                  {lesson.lesson_number}. {lesson.title}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <section className={styles.content}>
          <div className={styles.lessonTopNav}>
            <Link href={`/courses/${course.id}`} className={styles.arrowLink}>
              ← Powrót do kursu
            </Link>
            <div className={styles.arrowGroup}>
              {previousLesson ? (
                <Link href={`/courses/${course.id}/lesson/${previousLesson.id}`} className={styles.arrowLink}>
                  ← Poprzednia lekcja
                </Link>
              ) : (
                <span className={styles.arrowDisabled}>← Poprzednia lekcja</span>
              )}
              {nextLesson ? (
                <Link href={`/courses/${course.id}/lesson/${nextLesson.id}`} className={styles.arrowLink}>
                  Następna lekcja →
                </Link>
              ) : (
                <span className={styles.arrowDisabled}>Następna lekcja →</span>
              )}
            </div>
          </div>

          <h2>
            Lekcja {activeLesson?.lesson_number}: {activeLesson?.title}
          </h2>

          <div className={styles.progressBox}>
            <div className={styles.progressWrap}>
              <div className={styles.progressBar} style={{ width: `${courseProgress.percent}%` }} />
            </div>
            <p className={styles.progressLabel}>
              Twój postęp w kursie: {courseProgress.done}/{courseProgress.total} lekcji ({courseProgress.percent}%)
            </p>
            <button onClick={handleToggleLessonDone} disabled={savingDone} className={styles.completeButton}>
              {isLessonDone ? 'Oznacz jako nieukończone' : 'Oznacz lekcję jako ukończoną'}
            </button>
          </div>

          {sections.length === 0 ? (
            <p>Ta lekcja nie ma jeszcze sekcji.</p>
          ) : (
            <div>
              {sections.map((section) => (
                <article key={section.id} className={styles.sectionCard}>
                  <h3>{section.title}</h3>
                  <p>{section.text}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
