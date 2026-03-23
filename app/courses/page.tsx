'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Course } from '@/types/courses';

export default function Courses() {
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('User')

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase.from('courses').select('*');
      if (error) {
        console.error('Error fetching courses:', error);
        setAvailableCourses([]);
      } else {
        setAvailableCourses(data || []);
      }
      setLoading(false);

      // session
      const { data: authData } = await supabase.auth.getSession();
      const authedUser = authData?.session?.user;
      if (authedUser) {
        setUser(authedUser);

        // user role
        const { data: roleData, error: roleError } = await supabase
          .from('users')
          .select('role_id')
          .eq('UID', authedUser.id)
          .single();
        if (!roleError && roleData) {
          setUserRole(roleData.role_id === 2 ? 'Instructor' : 'User');
        }
      }
    };
    fetchCourses();
  }, []);

  const handleEnroll = async (courseId: string) => {
    const { data: authData } = await supabase.auth.getSession();
    const authedUser = authData?.session?.user;
    if (!authedUser) {
      alert('Musisz być zalogowany, aby się zapisać.');
      return;
    }

    const { error } = await supabase
      .from('course_signups')
      .insert({ course_id: courseId, user_uid: authedUser.id });

    if (error) {
      console.error('Error enrolling:', error);
      alert('Błąd podczas zapisywania: ' + error.message);
    } else {
      alert('Zapisano na kurs!');
    }
  };

  return (
    <div>
      <h1>Dostępne kursy</h1>

      {loading ? (
        <p>Ładowanie kursów...</p>
      ) : availableCourses.length === 0 ? (
        <p>Brak dostępnych kursów</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Tytuł</th>
              <th>Opis</th>
              <th>Poziom</th>
              <th>Cena</th>
              <th>Kategoria</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {availableCourses.map((course) => (
              <tr key={course.id}>
                <td>{course.title}</td>
                <td>{course.description}</td>
                <td>{course.level}</td>
                <td>{course.price}</td>
                <td>{course.category}</td>
                <td>
                  {userRole == 'User' ? (
                    <button onClick={() => handleEnroll(course.id)}>
                      Zapisz się
                    </button>
                  ) : (
                    <span>Jako instruktor nie możesz się zapisać na kurs</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
