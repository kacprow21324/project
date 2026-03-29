'use client';

import Link from 'next/link';
import type { AppCourse } from '@/lib/appData';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import styles from './DashboardPanels.module.css';

interface StudentCoursesProps {
  courses: AppCourse[];
}

export const StudentCourses = ({ courses }: StudentCoursesProps) => {
  const [progressByCourse, setProgressByCourse] = useState<Record<number, { done: number; total: number; percent: number }>>({});

  useEffect(() => {
    let isActive = true;

    const loadProgress = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user || courses.length === 0) {
          if (isActive) {
            setProgressByCourse({});
          }
          return;
        }

        const courseIds = courses.map((course) => course.id);
        const lessonsResult = await supabase
          .from('course_lessons')
          .select('id, course_id')
          .in('course_id', courseIds);

        const lessons = lessonsResult.data ?? [];
        const lessonIds = lessons.map((lesson) => lesson.id);

        const doneResult =
          lessonIds.length === 0
            ? { data: [] as Array<{ course_lessons_id: number }> }
            : await supabase
                .from('course_user_progress')
                .select('course_lessons_id')
                .eq('user_uid', session.user.id)
                .eq('isDone', true)
                .in('course_lessons_id', lessonIds);

        const lessonToCourse = new Map<number, number>();
        const totalByCourse = new Map<number, number>();

        lessons.forEach((lesson) => {
          lessonToCourse.set(lesson.id, lesson.course_id);
          totalByCourse.set(lesson.course_id, (totalByCourse.get(lesson.course_id) ?? 0) + 1);
        });

        const doneByCourse = new Map<number, number>();
        (doneResult.data ?? []).forEach((row) => {
          const courseId = lessonToCourse.get(row.course_lessons_id);
          if (!courseId) return;
          doneByCourse.set(courseId, (doneByCourse.get(courseId) ?? 0) + 1);
        });

        const nextProgress: Record<number, { done: number; total: number; percent: number }> = {};
        courseIds.forEach((courseId) => {
          const total = totalByCourse.get(courseId) ?? 0;
          const done = doneByCourse.get(courseId) ?? 0;
          const percent = total === 0 ? 0 : Math.round((done / total) * 100);
          nextProgress[courseId] = { done, total, percent };
        });

        if (isActive) {
          setProgressByCourse(nextProgress);
        }
      } catch (error) {
        console.error('Error loading student progress:', error);
      }
    };

    loadProgress();

    return () => {
      isActive = false;
    };
  }, [courses]);

  return (
    <div className={styles.panel}>
      <section className={styles.headerCard}>
        <h2 className={styles.title}>Moje kursy</h2>
        <p className={styles.subtitle}>Lista kursów, na które jesteś zapisany. Kliknij, aby przejść do widoku kursu i lekcji.</p>
      </section>

      {courses.length === 0 ? (
        <section className={styles.card}>
          <p>Nie jesteś zapisany na żaden kurs. Przejdź do sekcji &quot;Przeglądaj&quot; aby znaleźć kursy.</p>
        </section>
      ) : (
        <section className={styles.card}>
        <table className={styles.gridTable}>
          <thead>
            <tr>
              <th>Tytuł Kursu</th>
              <th>Opis</th>
              <th>Poziom</th>
              <th>Cena</th>
              <th>Kategoria</th>
              <th>Postęp</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => {
              return (
                <tr key={course.id}>
                  <td>{course.title}</td>
                  <td>{course.description}</td>
                  <td>{course.level}</td>
                  <td>{course.price}</td>
                  <td>{course.category || 'Bez kategorii'}</td>
                  <td>
                    <div className={styles.progressWrap}>
                      <div
                        className={styles.progressBar}
                        style={{ width: `${progressByCourse[course.id]?.percent ?? 0}%` }}
                      />
                    </div>
                    <div className={styles.progressLabel}>
                      {progressByCourse[course.id]?.done ?? 0}/{progressByCourse[course.id]?.total ?? 0} lekcji
                    </div>
                  </td>
                  <td>
                    <Link href={`/courses/${course.id}`} className={styles.linkButton}>Przejdź do kursu</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </section>
      )}
    </div>
  );
};
