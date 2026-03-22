'use client';

import { useState } from 'react';
import type { Course } from '@/types/courses';
import { CourseBuilder } from './CourseBuilder';
import { supabase } from '@/lib/supabaseClient';

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

  const handleCourseUpdate = async (updatedCourse: Course) => {
    let category_id = null;
    if (updatedCourse.category) {
      const { data, error: catError } = await supabase
        .from('categories')
        .select('id')
        .eq('title', updatedCourse.category)
        .single();
      if (catError) {
        console.error('Error finding category:', catError);
      } else {
        category_id = data?.id;
      }
    }

    const { error } = await supabase
      .from('courses')
      .update({
        title: updatedCourse.title,
        description: updatedCourse.description,
        level: updatedCourse.level,
        price: updatedCourse.price,
        category_id: category_id,
      })
      .eq('id', updatedCourse.id);

    if (error) {
      console.error('Error updating course:', error);
      alert('Błąd podczas aktualizacji kursu: ' + error.message);
      return;
    }

    const newCourses = courses.map((c) =>
      c.id === updatedCourse.id ? updatedCourse : c
    );
    setCourses(newCourses);
    if (onCoursesUpdate) {
      onCoursesUpdate(newCourses);
    }
    setEditingCourseId(null);
  };

  const handleAddCourse = async () => {
    const newCourseData = {
      title: 'Nowy kurs',
      description: '',
      level: '',
      price: 0,
      category_id: null,
    };
    const { data, error } = await supabase
      .from('courses')
      .insert(newCourseData)
      .select()
      .single();

    if (error) {
      console.error('Error adding course:', error);
      alert('Błąd podczas dodawania kursu: ' + error.message);
      return;
    }

    const newCourse: Course = { ...data, sections: [] };
    const updatedCourses = [...courses, newCourse];
    setCourses(updatedCourses);
    if (onCoursesUpdate) {
      onCoursesUpdate(updatedCourses);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten kurs?')) return;

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) {
      console.error('Error deleting course:', error);
      alert('Błąd podczas usuwania kursu: ' + error.message);
      return;
    }

    const newCourses = courses.filter((c) => c.id !== courseId);
    setCourses(newCourses);
    if (onCoursesUpdate) {
      onCoursesUpdate(newCourses);
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
              <th>Poziom</th>
              <th>Cena</th>
              <th>Kategoria</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td>{course.title}</td>
                <td>{course.description}</td>
                <td>{course.level}</td>
                <td>{course.price}</td>
                <td>{course.category}</td>
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
