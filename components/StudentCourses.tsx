'use client';

import type { Course } from '@/types/courses';
import { calculateProgress, getProgressStatus, getTotalBlocksInCourse } from '@/types/studentProgress';

interface StudentCoursesProps {
  courses: Course[];
}

export const StudentCourses = ({ courses }: StudentCoursesProps) => {
  return (
    <div>
      <h2>Moje Kursy</h2>

      {courses.length === 0 ? (
        <p>Nie jesteś zapisany na żaden kurs. Przejdź do sekcji "Przeglądaj" aby znaleźć kursy.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Tytuł Kursu</th>
              <th>Opis</th>
              <th>Postęp</th>
              <th>Status</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => {
              const totalBlocks = getTotalBlocksInCourse(course);
              const completedBlocks = 0;
              const progress = calculateProgress(completedBlocks, totalBlocks);
              const status = getProgressStatus(progress);

              return (
                <tr key={course.id}>
                  <td>{course.title}</td>
                  <td>{course.desc}</td>
                  <td>{progress}%</td>
                  <td>{status}</td>
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
