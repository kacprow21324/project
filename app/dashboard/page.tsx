'use client';

import { InstructorDashboard } from '@/components/InstructorDashboard';
import { mockCourse } from '@/types/coursesMockData';

export default function DashboardPage() {
  const mockCourses = [mockCourse];

  return (
    <div>
      <InstructorDashboard courses={mockCourses} />
    </div>
  );
}