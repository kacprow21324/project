'use client';

import { StudentCourses } from '@/components/StudentCourses';
import { InstructorCourses } from '@/components/InstructorCourses';
import { AdminPanel } from '@/components/AdminPanel';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  mapCourseRowToAppCourse,
  roleIdToName,
  type AppCourse,
  type CourseRow,
  type UserRole,
} from '@/lib/appData';

export default function DashboardPage() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<AppCourse[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const initializeDashboard = async () => {
      setLoadError(null);

      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          if (isActive) {
            setLoading(false);
          }
          return;
        }

        // Fetch user role
        const { data: roleData, error: roleError } = await supabase
          .from('users')
          .select('role_id')
          .eq('UID', session.user.id)
          .single();

        let role: UserRole;
        if (!roleError && roleData) {
          role = roleIdToName(roleData.role_id);
        } else {
          role = 'User';
        }
        if (!isActive) return;
        setUserRole(role);

        // Courses
        let coursesData: AppCourse[] = [];
        if (role === 'Instructor') {
          const { data, error } = await supabase
            .from('courses')
            .select('id, title, description, level, price, category_id, instructor_uid, isOpen, categories(id, title)')
            .eq('instructor_uid', session.user.id)
            .order('created_at', { ascending: false });
          if (error) {
            console.error('Error fetching courses for instructor:', error);
          } else {
            coursesData = (data || []).map((row) => mapCourseRowToAppCourse(row));
          }
        } else if (role === 'User') {
          // For users, fetch only signed up courses
          const { data, error } = await supabase
            .from('course_signups')
            .select('courses(id, title, description, level, price, category_id, instructor_uid, isOpen, categories(id, title))')
            .eq('user_uid', session.user.id);
          if (error) {
            console.error('Error fetching courses for user:', error);
          } else {
            const signupRows =
              (data as Array<{ courses: CourseRow | CourseRow[] | null }> | null) ?? [];

            coursesData = signupRows.flatMap((item) => {
              if (!item.courses) {
                return [];
              }

              const relatedCourses = Array.isArray(item.courses)
                ? item.courses
                : [item.courses];

              return relatedCourses.map((course) => mapCourseRowToAppCourse(course));
            });
          }
        }
        if (!isActive) return;
        setCourses(coursesData);
      } catch (error) {
        console.error('Error initializing dashboard:', error);
        if (isActive) {
          setLoadError('Nie udało się załadować dashboardu. Spróbuj odświeżyć stronę.');
          setUserRole('User');
          setCourses([]);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    initializeDashboard();

    return () => {
      isActive = false;
    };
  }, []);

  if (loading) {
    return <div>Ładowanie...</div>;
  }

  if (loadError) {
    return <div>{loadError}</div>;
  }

  return (
    <div>
      {userRole === 'Instructor' && (
        <InstructorCourses initialCourses={courses} onCoursesUpdate={setCourses} />
      )}
      {userRole === 'User' && <StudentCourses courses={courses} />}
      {userRole === 'Admin' && <AdminPanel />}
    </div>
  );
}