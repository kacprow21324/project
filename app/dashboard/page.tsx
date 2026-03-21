'use client';

import { StudentCourses } from '@/components/StudentCourses';
import { InstructorCourses } from '@/components/InstructorCourses';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { mockCourse } from '@/types/coursesMockData';

export default function DashboardPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([mockCourse]);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('users')
          .select('role_id')
          .eq('UID', session.user.id)
          .single();

        if (!error && data) {
          const role = data.role_id === 2 ? 'Instructor' : 'User';
          setUserRole(role);
        } else {
          setUserRole('User');
        }
      } catch (error) {
        console.error('Error:', error);
        setUserRole('User');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
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