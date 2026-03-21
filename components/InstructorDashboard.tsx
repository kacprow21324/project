'use client';

import { useState } from 'react';
import type { Course } from '@/types/courses';
import { CourseBuilder } from './CourseBuilder';

interface InstructorDashboardProps {
  courses: Course[];
  onCourseSave?: (course: Course) => void;
}

export const InstructorDashboard = ({
  courses,
  onCourseSave,
}: InstructorDashboardProps) => {
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [coursesState, setCoursesState] = useState<Course[]>(courses);

  // Calculate statistics
  const totalCourses = coursesState.length;
  const totalSections = coursesState.reduce(
    (sum, course) => sum + course.sections.length,
    0
  );
  const totalLessons = coursesState.reduce(
    (sum, course) =>
      sum +
      course.sections.reduce(
        (sectionSum, section) => sectionSum + section.lessons.length,
        0
      ),
    0
  );

  const editingCourse = coursesState.find(
    (course) => course.id === editingCourseId
  );

  const handleCourseUpdate = (updatedCourse: Course) => {
    const updatedCourses = coursesState.map((course) =>
      course.id === updatedCourse.id ? updatedCourse : course
    );
    setCoursesState(updatedCourses);

    if (onCourseSave) {
      onCourseSave(updatedCourse);
    }
  };

  // Show CourseBuilder when editing
  if (editingCourse) {
    return (
      <div>
        <button onClick={() => setEditingCourseId(null)}>
          ← Back to Dashboard
        </button>
        <hr />
        <CourseBuilder
          initialCourse={editingCourse}
          onCourseUpdate={handleCourseUpdate}
        />
      </div>
    );
  }

  // Show Dashboard
  return (
    <div>
      <h1>Instructor Dashboard</h1>

      <section>
        <h2>Statistics</h2>
        <div>
          <div>
            <strong>Total Courses:</strong> {totalCourses}
          </div>
          <div>
            <strong>Total Sections:</strong> {totalSections}
          </div>
          <div>
            <strong>Total Lessons:</strong> {totalLessons}
          </div>
        </div>
      </section>

      <section>
        <h2>Courses</h2>
        {coursesState.length === 0 ? (
          <p>No courses yet</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Sections</th>
                <th>Lessons</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coursesState.map((course) => {
                const sectionCount = course.sections.length;
                const lessonCount = course.sections.reduce(
                  (sum, section) => sum + section.lessons.length,
                  0
                );
                return (
                  <tr key={course.id}>
                    <td>{course.title}</td>
                    <td>{course.desc}</td>
                    <td>{sectionCount}</td>
                    <td>{lessonCount}</td>
                    <td>
                      <button onClick={() => setEditingCourseId(course.id)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};
