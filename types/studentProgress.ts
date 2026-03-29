export interface Student {
  id: string;
  name: string;
  email: string;
}

export interface StudentProgress {
  studentId: string;
  courseId: string;
  completedBlockIds: string[];
  completedAt?: Date;
}

export interface StudentCourseProgress {
  student: Student;
  progress: StudentProgress;
  totalBlocks: number;
  completedBlocks: number;
  progressPercentage: number;
  status: 'Not Started' | 'In Progress' | 'Completed';
}

export function calculateProgress(
  completedBlockCount: number,
  totalBlockCount: number
): number {
  if (totalBlockCount === 0) return 0;
  return Math.round((completedBlockCount / totalBlockCount) * 100);
}

export function getProgressStatus(
  progressPercentage: number
): 'Not Started' | 'In Progress' | 'Completed' {
  if (progressPercentage === 0) return 'Not Started';
  if (progressPercentage === 100) return 'Completed';
  return 'In Progress';
}

interface ProgressLesson {
  contentBlocks: unknown[];
}

interface ProgressSection {
  lessons: ProgressLesson[];
}

interface ProgressCourse {
  sections: ProgressSection[];
}

export function getTotalBlocksInCourse(course: ProgressCourse): number {
  return course.sections.reduce((sum: number, section: ProgressSection) => {
    return (
      sum +
      section.lessons.reduce(
        (lessonSum: number, lesson: ProgressLesson) =>
          lessonSum + lesson.contentBlocks.length,
        0
      )
    );
  }, 0);
}
