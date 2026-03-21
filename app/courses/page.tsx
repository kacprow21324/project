'use client';

import { mockCourse } from '@/types/coursesMockData';

export default function Courses() {
  const availableCourses = [mockCourse];

  const handleEnroll = (courseId: string) => {
    alert('Zapisano na kurs: ' + courseId);
  };

  return (
    <div>
      <h1>Dostępne kursy</h1>

      {availableCourses.length === 0 ? (
        <p>Brak dostępnych kursów</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Tytuł</th>
              <th>Opis</th>
              <th>Sekcje</th>
              <th>Lekcje</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {availableCourses.map((course) => (
              <tr key={course.id}>
                <td>{course.title}</td>
                <td>{course.desc}</td>
                <td>{course.sections.length}</td>
                <td>
                  {course.sections.reduce(
                    (sum, s) => sum + s.lessons.length,
                    0
                  )}
                </td>
                <td>
                  <button onClick={() => handleEnroll(course.id)}>
                    Zapisz się
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
