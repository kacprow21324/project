'use client';

import { StudentCourses } from '@/components/StudentCourses';
import { InstructorCourses } from '@/components/InstructorCourses';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Course } from '@/types/courses';

export default function DashboardPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          setLoading(false);
          return;
        }

        // Fetch user role
        const { data: roleData, error: roleError } = await supabase
          .from('users')
          .select('role_id')
          .eq('UID', session.user.id)
          .single();

        let role: string;
        if (!roleError && roleData) {
          role = roleData.role_id === 2 ? 'Instructor' : 'User';
        } else {
          role = 'User';
        }
        setUserRole(role);

        // Courses
        let coursesData: Course[] = [];
        if (role === 'Instructor') {
          const { data, error } = await supabase.from('courses').select('*');
          if (error) {
            console.error('Error fetching courses for instructor:', error);
          } else {
            coursesData = data || [];
          }
        } else {
          // For users, fetch only signed up courses
          const { data, error } = await supabase
            .from('course_signups')
            .select('courses(*)')
            .eq('user_uid', session.user.id);
          if (error) {
            console.error('Error fetching courses for user:', error);
          } else {
            coursesData = (data as unknown as Array<{ courses: Course | null }> | null)
            ?.map(item => item.courses)
            .filter((c): c is Course => c !== null) || [];;
          }
        }
        setCourses(coursesData);
      } catch (error) {
        console.error('Error initializing dashboard:', error);
        setUserRole('User');
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, []);

  if (loading) {
    return <div>Ładowanie...</div>;
  }

  return (
    <div>
      {userRole === 'Instructor' ? (
        <InstructorCourses initialCourses={courses} onCoursesUpdate={setCourses} />
      ) : (
        <StudentCourses courses={courses} />
      )}
    </div>
  );
}