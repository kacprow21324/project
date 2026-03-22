'use client';

import { supabase } from '@/lib/supabaseClient';
import type { Course } from '@/types/courses';
import { useEffect, useState } from 'react';

interface StudentCoursesProps {
  courses: Course[];
}

export const StudentCourses = ({ courses }: StudentCoursesProps) => {
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const displayedCourses = courses.length;

  return (
    <div>
      <h2>Moje Kursy</h2>

      {loading ? (
        <p>Ładowanie kursów...</p>
      ) : fetchError ? (
        <p style={{ color: 'red' }}>Błąd: {fetchError}</p>
      ) : displayedCourses === 0 ? (
        <p>Nie jesteś zapisany na żaden kurs. Przejdź do sekcji "Przeglądaj" aby znaleźć kursy.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Tytuł Kursu</th>
              <th>Opis</th>
              <th>Poziom</th>
              <th>Cena</th>
              <th>Kategoria</th>
              <th>Postęp</th>
              <th>Status</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course: Course) => {
              return (
                <tr key={course.id}>
                  <td>{course.title}</td>
                  <td>{course.description}</td>
                  <td>{course.level}</td>
                  <td>{course.price}</td>
                  <td>{course.category}</td>
                  <td>%</td>
                  <td>status</td>
                  <td>
                    <button>Przejdź do kursu</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};
