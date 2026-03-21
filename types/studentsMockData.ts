import type { Student, StudentProgress } from '@/types/studentProgress';

export const mockStudents: Student[] = [
  {
    id: 'student-001',
    name: 'Anna Kowalski',
    email: 'anna.kowalski@example.com',
  },
  {
    id: 'student-002',
    name: 'Bartosz Nowak',
    email: 'bartosz.nowak@example.com',
  },
  {
    id: 'student-003',
    name: 'Ewa Lewandowska',
    email: 'ewa.lewandowska@example.com',
  },
  {
    id: 'student-004',
    name: 'Dariusz Szymański',
    email: 'dariusz.szymanski@example.com',
  },
  {
    id: 'student-005',
    name: 'Katarzyna Woźniak',
    email: 'katarzyna.wozniak@example.com',
  },
];

export const mockStudentProgresses: StudentProgress[] = [
  {
    studentId: 'student-001',
    courseId: 'course-001',
    completedBlockIds: [
      'block-1-1-1',
      'block-1-1-2',
      'block-1-2-1',
      'block-2-1-1',
    ],
    completedAt: new Date('2026-03-15'),
  },
  {
    studentId: 'student-002',
    courseId: 'course-001',
    completedBlockIds: [
      'block-1-1-1',
      'block-1-1-2',
      'block-1-1-3',
    ],
    completedAt: undefined,
  },
  {
    studentId: 'student-003',
    courseId: 'course-001',
    completedBlockIds: [
      'block-1-1-1',
    ],
    completedAt: undefined,
  },
  {
    studentId: 'student-004',
    courseId: 'course-001',
    completedBlockIds: [],
    completedAt: undefined,
  },
  {
    studentId: 'student-005',
    courseId: 'course-001',
    completedBlockIds: [
      'block-1-1-1',
      'block-1-1-2',
      'block-1-1-3',
      'block-1-2-1',
      'block-1-2-2',
      'block-2-1-1',
      'block-2-1-2',
      'block-2-1-3',
    ],
    completedAt: new Date('2026-03-10'),
  },
];
