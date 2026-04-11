'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { mapCourseRowToAppCourse, roleIdToName, type AppCourse } from '@/lib/appData';
import { deleteCourseWithRelations } from '@/lib/courseDeletion';
import styles from './DashboardPanels.module.css';
import Link from 'next/link';

interface AppUser {
  id: number;
  UID: string;
  role_id: number;
  created_at: string;
  username?: string | null;
}

interface SignupHistoryRow {
  id: number;
  created_at: string;
  user_uid: string;
  course_id: number;
  courses: { title: string } | { title: string }[] | null;
}

interface CourseReviewRow {
  id: number;
  created_at: string;
  user_uid: string;
  course_id: number;
  rating: number;
  comment: string;
  courses: { title: string } | { title: string }[] | null;
}

type NoticeTone = 'success' | 'error' | 'info';

interface UsernameRpcRow {
  uid: string;
  display_name: string | null;
}

export const AdminPanel = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [courses, setCourses] = useState<AppCourse[]>([]);
  const [signups, setSignups] = useState<SignupHistoryRow[]>([]);
  const [reviews, setReviews] = useState<CourseReviewRow[]>([]);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const getDisplayName = (user: AppUser) => {
    if (currentUserUid && user.UID === currentUserUid && currentUserName.trim() !== '') {
      return currentUserName.trim();
    }

    const username = typeof user.username === 'string' ? user.username.trim() : '';
    if (username) {
      return username;
    }

    return `Użytkownik ${user.UID.slice(0, 8)}`;
  };

  const sortByDisplayName = (left: AppUser, right: AppUser) =>
    getDisplayName(left).localeCompare(getDisplayName(right), 'pl-PL');

  const instructors = users
    .filter((user) => roleIdToName(user.role_id) === 'Instructor')
    .sort(sortByDisplayName);
  const participants = users
    .filter((user) => roleIdToName(user.role_id) === 'User')
    .sort(sortByDisplayName);
  const admins = users.filter((user) => roleIdToName(user.role_id) === 'Admin');
  const openCourses = courses.filter((course) => course.isOpen);

  const getDisplayNameByUid = (uid: string | null | undefined) => {
    if (!uid) {
      return 'Brak danych';
    }

    if (currentUserUid && uid === currentUserUid && currentUserName.trim() !== '') {
      return currentUserName.trim();
    }

    const user = users.find((candidate) => candidate.UID === uid);
    if (!user) {
      return `Użytkownik ${uid.slice(0, 8)}`;
    }

    return getDisplayName(user);
  };

  const loadAdminData = useCallback(async () => {
    setLoading(true);

    const [sessionResult, courseResult, signupResult, reviewResult] = await Promise.all([
      supabase.auth.getSession(),
      supabase
        .from('courses')
        .select('id, title, description, level, price, category_id, instructor_uid, isOpen, categories(id, title)')
        .order('created_at', { ascending: false }),
      supabase
        .from('course_signups')
        .select('id, created_at, user_uid, course_id, courses(title)')
        .order('created_at', { ascending: false }),
      supabase
        .from('course_reviews')
        .select('id, created_at, user_uid, course_id, rating, comment, courses(title)')
        .order('created_at', { ascending: false }),
    ]);

    const sessionUser = sessionResult.data.session?.user;
    setCurrentUserUid(sessionUser?.id ?? null);
    setCurrentUserName(typeof sessionUser?.user_metadata?.username === 'string' ? sessionUser.user_metadata.username : '');

    const userSelectVariants = [
      'id, UID, role_id, created_at, username',
      'id, UID, role_id, created_at, name',
      'id, UID, role_id, created_at, nick',
      'id, UID, role_id, created_at',
    ];

    let loadedUsers: AppUser[] = [];
    for (const variant of userSelectVariants) {
      const variantResult = await supabase
        .from('users')
        .select(variant)
        .order('created_at', { ascending: false });

      if (variantResult.error || !variantResult.data) {
        continue;
      }

      loadedUsers = (variantResult.data as unknown as Array<Record<string, unknown>>).map((row) => {
        const candidateUsername = [row.username, row.name, row.nick]
          .find((value) => typeof value === 'string' && value.trim() !== '') as string | undefined;

        return {
          id: Number(row.id),
          UID: String(row.UID ?? ''),
          role_id: Number(row.role_id),
          created_at: String(row.created_at ?? ''),
          username: candidateUsername ?? null,
        };
      });
      break;
    }

    if (currentUserUid && currentUserName.trim() !== '') {
      const currentRow = loadedUsers.find((user) => user.UID === currentUserUid);
      if (currentRow && (!currentRow.username || currentRow.username.trim() === '')) {
        const updateVariants = [
          { username: currentUserName.trim() },
          { name: currentUserName.trim() },
          { nick: currentUserName.trim() },
        ];

        for (const patch of updateVariants) {
          const { error: updateError } = await supabase
            .from('users')
            .update(patch)
            .eq('UID', currentUserUid);

          if (!updateError) {
            loadedUsers = loadedUsers.map((user) =>
              user.UID === currentUserUid ? { ...user, username: currentUserName.trim() } : user
            );
            break;
          }
        }
      }
    }

    const unresolvedUserIds = loadedUsers
      .filter((user) => !user.username || user.username.trim() === '')
      .map((user) => user.UID)
      .filter((uid) => uid !== '');

    if (unresolvedUserIds.length > 0) {
      const usernamesRpc = await supabase.rpc('admin_usernames', { user_ids: unresolvedUserIds });
      if (!usernamesRpc.error && Array.isArray(usernamesRpc.data)) {
        const rpcRows = usernamesRpc.data as unknown as UsernameRpcRow[];
        const displayNameByUid = new Map<string, string>();
        rpcRows.forEach((row) => {
          if (row.uid && typeof row.display_name === 'string' && row.display_name.trim() !== '') {
            displayNameByUid.set(row.uid, row.display_name.trim());
          }
        });

        if (displayNameByUid.size > 0) {
          loadedUsers = loadedUsers.map((user) => {
            const resolved = displayNameByUid.get(user.UID);
            return resolved ? { ...user, username: resolved } : user;
          });
        }
      }
    }

    if (loadedUsers.length === 0) {
      setNotice({ tone: 'error', message: 'Błąd ładowania użytkowników.' });
    }

    if (courseResult.error) {
      setNotice({ tone: 'error', message: `Błąd ładowania kursów: ${courseResult.error.message}` });
    }

    if (signupResult.error) {
      setNotice({ tone: 'error', message: `Błąd ładowania zapisów: ${signupResult.error.message}` });
    }

    if (reviewResult.error) {
      setNotice({ tone: 'error', message: `Błąd ładowania opinii: ${reviewResult.error.message}` });
    }

    setUsers(loadedUsers);
    setCourses((courseResult.data ?? []).map((row) => mapCourseRowToAppCourse(row)));
    setSignups((signupResult.data as SignupHistoryRow[] | null) ?? []);
    setReviews((reviewResult.data as CourseReviewRow[] | null) ?? []);
    setLoading(false);
  }, [currentUserName, currentUserUid]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadAdminData();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [loadAdminData]);

  const deleteUser = async (uid: string) => {
    const user = users.find((candidate) => candidate.UID === uid);
    if (user && roleIdToName(user.role_id) === 'Admin') {
      setNotice({ tone: 'info', message: 'Nie można usunąć konta z rolą Admin.' });
      return;
    }

    if (!confirm('Usunąć użytkownika z tabeli users?')) {
      return;
    }

    const rpcDelete = await supabase.rpc('admin_delete_user', { target_uid: uid });
    if (!rpcDelete.error) {
      setNotice({ tone: 'success', message: 'Użytkownik został usunięty.' });
      await loadAdminData();
      return;
    }

    const { error } = await supabase.from('users').delete().eq('UID', uid);
    if (error) {
      setNotice({ tone: 'error', message: `Błąd usuwania użytkownika: ${rpcDelete.error.message || error.message}` });
      return;
    }

    setNotice({ tone: 'success', message: 'Użytkownik został usunięty.' });
    await loadAdminData();
  };

  const deleteCourse = async (courseId: number) => {
    if (!confirm('Usunąć kurs?')) {
      return;
    }

    const { error } = await deleteCourseWithRelations(courseId);
    if (error) {
      const isPermissionError = error.toLowerCase().includes('permission') || error.toLowerCase().includes('policy');
      setNotice({
        tone: 'error',
        message: isPermissionError
          ? `Brak uprawnień bazy danych do usuwania kursu: ${error}`
          : `Błąd usuwania kursu: ${error}`,
      });
      return;
    }

    setNotice({ tone: 'success', message: 'Kurs został usunięty.' });
    await loadAdminData();
  };

  const toggleCourseVisibility = async (courseId: number, nextVisibility: boolean) => {
    const { error } = await supabase
      .from('courses')
      .update({ isOpen: nextVisibility })
      .eq('id', courseId);

    if (error) {
      setNotice({ tone: 'error', message: `Błąd moderacji kursu: ${error.message}` });
      return;
    }

    setNotice({ tone: 'success', message: nextVisibility ? 'Kurs został otwarty.' : 'Kurs został zamknięty.' });
    await loadAdminData();
  };

  const deleteReview = async (reviewId: number) => {
    if (!confirm('Usunąć opinię użytkownika?')) {
      return;
    }

    const rpcDelete = await supabase.rpc('admin_delete_review', { target_review_id: reviewId });
    if (!rpcDelete.error) {
      setNotice({ tone: 'success', message: 'Komentarz został usunięty.' });
      await loadAdminData();
      return;
    }

    const { error } = await supabase
      .from('course_reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      const message = rpcDelete.error.message || error.message || '';
      const isPermissionError = message.toLowerCase().includes('permission') || message.toLowerCase().includes('policy');
      setNotice({
        tone: 'error',
        message: isPermissionError
          ? `Brak uprawnień bazy danych do usuwania komentarza: ${message}`
          : `Błąd usuwania opinii: ${message}`,
      });
      return;
    }

    setNotice({ tone: 'success', message: 'Komentarz został usunięty.' });
    await loadAdminData();
  };

  const getReviewCourseTitle = (review: CourseReviewRow) => {
    if (!review.courses) {
      return `ID: ${review.course_id}`;
    }

    if (Array.isArray(review.courses)) {
      return review.courses[0]?.title ?? `ID: ${review.course_id}`;
    }

    return review.courses.title ?? `ID: ${review.course_id}`;
  };

  const getSignupCourseTitle = (signup: SignupHistoryRow) => {
    if (!signup.courses) {
      return `ID: ${signup.course_id}`;
    }

    if (Array.isArray(signup.courses)) {
      return signup.courses[0]?.title ?? `ID: ${signup.course_id}`;
    }

    return signup.courses.title ?? `ID: ${signup.course_id}`;
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

      {notice ? (
        <section className={`${styles.notice} ${notice.tone === 'success' ? styles.noticeSuccess : notice.tone === 'error' ? styles.noticeError : styles.noticeInfo}`}>
          {notice.message}
        </section>
      ) : null}

      <section className={styles.card}>
        <h3 className={styles.bold}>Statystyki platformy</h3>
        <div className={styles.statsGrid}>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>Użytkownicy łącznie</p>
            <strong>{users.length}</strong>
          </article>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>Instruktorzy</p>
            <strong>{instructors.length}</strong>
          </article>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>Uczestnicy</p>
            <strong>{participants.length}</strong>
          </article>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>Administratorzy</p>
            <strong>{admins.length}</strong>
          </article>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>Kursy łącznie</p>
            <strong>{courses.length}</strong>
          </article>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>Kursy otwarte</p>
            <strong>{openCourses.length}</strong>
          </article>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>Zapisy na kursy</p>
            <strong>{signups.length}</strong>
          </article>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>Opinie i komentarze</p>
            <strong>{reviews.length}</strong>
          </article>
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={styles.bold}>Lista instruktorów i uczestników</h3>
        <div className={styles.twoCol}>
          <div>
            <h4 className={styles.bold}>Instruktorzy</h4>
            {instructors.length === 0 ? (
              <p>Brak instruktorów.</p>
            ) : (
              <ul className={styles.miniList}>
                {instructors.map((user) => (
                  <li key={user.id} className={styles.miniListItem}>
                    <span>{getDisplayName(user)}</span>
                    <small>{new Date(user.created_at).toLocaleDateString('pl-PL')}</small>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h4 className={styles.bold}>Uczestnicy</h4>
            {participants.length === 0 ? (
              <p>Brak uczestników.</p>
            ) : (
              <ul className={styles.miniList}>
                {participants.slice(0, 20).map((user) => (
                  <li key={user.id} className={styles.miniListItem}>
                    <span>{getDisplayName(user)}</span>
                    <small>{new Date(user.created_at).toLocaleDateString('pl-PL')}</small>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className={styles.card}>
      <h3 className={styles.bold}>Zarządzanie użytkownikami</h3>
      {users.length === 0 ? (
        <p>Brak użytkowników.</p>
      ) : (
        <table className={styles.gridTable}>
          <thead>
            <tr>
              <th>Nazwa użytkownika</th>
              <th>UID</th>
              <th>Rola</th>
              <th>Data utworzenia</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{getDisplayName(user)}</td>
                <td>{user.UID}</td>
                <td>{roleIdToName(user.role_id)}</td>
                <td>{new Date(user.created_at).toLocaleString('pl-PL')}</td>
                <td>
                  <button
                    onClick={() => deleteUser(user.UID)}
                    className={styles.dangerButton}
                    disabled={roleIdToName(user.role_id) === 'Admin'}
                    title={roleIdToName(user.role_id) === 'Admin' ? 'Nie można usuwać administratora' : 'Usuń użytkownika'}
                  >
                    Usuń
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </section>

      <section className={styles.card}>
      <h3 className={styles.bold}>Zarządzanie kursami (moderacja)</h3>
      {courses.length === 0 ? (
        <p>Brak kursów.</p>
      ) : (
        <table className={styles.gridTable}>
          <thead>
            <tr>
              <th>Tytuł</th>
              <th>Instruktor</th>
              <th>Kategoria</th>
              <th>Status</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td className={styles.link}><Link href={`/courses/${course.id}`}>{course.title}</Link></td>
                <td>{getDisplayNameByUid(course.instructorUid)}</td>
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
      <h3 className={styles.bold}>Historia zapisów na kursy</h3>
      {signups.length === 0 ? (
        <p>Brak zapisów.</p>
      ) : (
        <table className={styles.gridTable}>
          <thead>
            <tr>
              <th>Data</th>
              <th>Użytkownik</th>
              <th>UID użytkownika</th>
              <th>Kurs</th>
            </tr>
          </thead>
          <tbody>
            {signups.map((signup) => (
              <tr key={signup.id}>
                <td>{new Date(signup.created_at).toLocaleString('pl-PL')}</td>
                <td>{getDisplayNameByUid(signup.user_uid)}</td>
                <td>{signup.user_uid}</td>
                <td className={styles.link}><Link href={`/courses/${signup.course_id}`}>{getSignupCourseTitle(signup)}</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </section>

      <section className={styles.card}>
      <h3 className={styles.bold}>Moderacja opinii użytkowników</h3>
      {reviews.length === 0 ? (
        <p>Brak opinii do moderacji.</p>
      ) : (
        <table className={styles.gridTable}>
          <thead>
            <tr>
              <th>Data</th>
              <th>Użytkownik</th>
              <th>UID użytkownika</th>
              <th>Kurs</th>
              <th>Ocena</th>
              <th>Komentarz</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id}>
                <td>{new Date(review.created_at).toLocaleString('pl-PL')}</td>
                <td>{getDisplayNameByUid(review.user_uid)}</td>
                <td>{review.user_uid}</td>
                <td className={styles.link}>
                  <Link href={`/courses/${review.course_id}`}>{getReviewCourseTitle(review)}</Link>
                </td>
                <td>{review.rating}/5</td>
                <td>{review.comment}</td>
                <td>
                  <button onClick={() => deleteReview(review.id)} className={styles.dangerButton}>Usuń komentarz</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </section>
    </div>
  );
};
