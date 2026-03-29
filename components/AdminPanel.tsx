'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { mapCourseRowToAppCourse, roleIdToName, type AppCourse } from '@/lib/appData';
import styles from './DashboardPanels.module.css';

interface AppUser {
  id: number;
  UID: string;
  role_id: number;
  created_at: string;
}

interface SignupHistoryRow {
  id: number;
  created_at: string;
  user_uid: string;
  course_id: number;
  courses: { title: string } | null;
}

export const AdminPanel = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [courses, setCourses] = useState<AppCourse[]>([]);
  const [signups, setSignups] = useState<SignupHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    setLoading(true);

    const [userResult, courseResult, signupResult] = await Promise.all([
      supabase
        .from('users')
        .select('id, UID, role_id, created_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('courses')
        .select('id, title, description, level, price, category_id, instructor_uid, isOpen, categories(id, title)')
        .order('created_at', { ascending: false }),
      supabase
        .from('course_signups')
        .select('id, created_at, user_uid, course_id, courses(title)')
        .order('created_at', { ascending: false }),
    ]);

    setUsers(userResult.data ?? []);
    setCourses((courseResult.data ?? []).map((row) => mapCourseRowToAppCourse(row)));
    setSignups((signupResult.data as SignupHistoryRow[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadAdminData();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const deleteUser = async (uid: string) => {
    if (!confirm('Usunąć użytkownika z tabeli users?')) {
      return;
    }

    const { error } = await supabase.from('users').delete().eq('UID', uid);
    if (error) {
      alert(`Błąd usuwania użytkownika: ${error.message}`);
      return;
    }

    await loadAdminData();
  };

  const deleteCourse = async (courseId: number) => {
    if (!confirm('Usunąć kurs?')) {
      return;
    }

    const { error } = await supabase.from('courses').delete().eq('id', courseId);
    if (error) {
      alert(`Błąd usuwania kursu: ${error.message}`);
      return;
    }

    await loadAdminData();
  };

  const toggleCourseVisibility = async (courseId: number, nextVisibility: boolean) => {
    const { error } = await supabase
      .from('courses')
      .update({ isOpen: nextVisibility })
      .eq('id', courseId);

    if (error) {
      alert(`Błąd moderacji kursu: ${error.message}`);
      return;
    }

    await loadAdminData();
  };

  if (loading) {
    return <div>Ładowanie panelu admina...</div>;
  }

  return (
    <div className={styles.panel}>
      <section className={styles.headerCard}>
        <h2 className={styles.title}>Panel administratora</h2>
        <p className={styles.subtitle}>Zarządzaj użytkownikami, moderuj kursy i przeglądaj historię zapisów.</p>
      </section>

      <section className={styles.card}>
      <h3>Zarządzanie użytkownikami</h3>
      {users.length === 0 ? (
        <p>Brak użytkowników.</p>
      ) : (
        <table className={styles.gridTable}>
          <thead>
            <tr>
              <th>UID</th>
              <th>Rola</th>
              <th>Data utworzenia</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.UID}</td>
                <td>{roleIdToName(user.role_id)}</td>
                <td>{new Date(user.created_at).toLocaleString('pl-PL')}</td>
                <td>
                  <button onClick={() => deleteUser(user.UID)} className={styles.dangerButton}>Usuń</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </section>

      <section className={styles.card}>
      <h3>Zarządzanie kursami (moderacja)</h3>
      {courses.length === 0 ? (
        <p>Brak kursów.</p>
      ) : (
        <table className={styles.gridTable}>
          <thead>
            <tr>
              <th>Tytuł</th>
              <th>Kategoria</th>
              <th>Status</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td>{course.title}</td>
                <td>{course.category}</td>
                <td>{course.isOpen ? 'Otwarte' : 'Zamknięte'}</td>
                <td>
                  <button onClick={() => toggleCourseVisibility(course.id, !course.isOpen)} className={styles.secondaryButton}>
                    {course.isOpen ? 'Zamknij kurs' : 'Otwórz kurs'}
                  </button>{' '}
                  <button onClick={() => deleteCourse(course.id)} className={styles.dangerButton}>Usuń</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </section>

      <section className={styles.card}>
      <h3>Historia zapisów na kursy</h3>
      {signups.length === 0 ? (
        <p>Brak zapisów.</p>
      ) : (
        <table className={styles.gridTable}>
          <thead>
            <tr>
              <th>Data</th>
              <th>UID użytkownika</th>
              <th>Kurs</th>
            </tr>
          </thead>
          <tbody>
            {signups.map((signup) => (
              <tr key={signup.id}>
                <td>{new Date(signup.created_at).toLocaleString('pl-PL')}</td>
                <td>{signup.user_uid}</td>
                <td>{signup.courses?.title ?? `ID: ${signup.course_id}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </section>
    </div>
  );
};
