'use client';

import { useState } from 'react';
import type { Course } from '@/types/courses';
import { CourseBuilder } from './CourseBuilder';

interface InstructorCoursesProps {
  initialCourses: Course[];
  onCoursesUpdate?: (courses: Course[]) => void;
}

export const InstructorCourses = ({
  initialCourses,
  onCoursesUpdate,
}: InstructorCoursesProps) => {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  const handleCourseUpdate = (updatedCourse: Course) => {
    const newCourses = courses.map((c) =>
      c.id === updatedCourse.id ? updatedCourse : c
    );
    setCourses(newCourses);
    if (onCoursesUpdate) {
      onCoursesUpdate(newCourses);
    }
  };

  const handleAddCourse = () => {
    const newCourse: Course = {
      id: `course-${Date.now()}`,
      title: 'Nowy kurs',
      desc: '',
      sections: [],
    };
    setCourses([...courses, newCourse]);
  };

  const handleDeleteCourse = (courseId: string) => {
    if (confirm('Czy na pewno chcesz usunąć ten kurs?')) {
      setCourses(courses.filter((c) => c.id !== courseId));
    }
  };

  const editingCourse = courses.find((c) => c.id === editingCourseId);

  if (editingCourse) {
    return (
      <div>
        <button onClick={() => setEditingCourseId(null)}>
          Powrót do listy
        </button>
        <hr />
        <CourseBuilder
          initialCourse={editingCourse}
          onCourseUpdate={handleCourseUpdate}
        />
      </div>
    );
  }

  return (
    <div>
      <h2>Moje Kursy</h2>
      <button onClick={handleAddCourse}>Stwórz nowy kurs</button>

      {courses.length === 0 ? (
        <p>Nie masz jeszcze żadnych kursów.</p>
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
            {courses.map((course) => (
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
                  <button onClick={() => setEditingCourseId(course.id)}>
                    Edytuj
                  </button>
                  <button onClick={() => handleDeleteCourse(course.id)}>
                    Usuń
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
