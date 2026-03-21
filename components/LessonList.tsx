import type { Lesson } from '@/types/courses';

interface LessonListProps {
  lessons: Lesson[];
  onRemoveLesson: (lessonId: string) => void;
}

export const LessonList = ({ lessons, onRemoveLesson }: LessonListProps) => {
  return (
    <ul>
      {lessons.map((lesson) => (
        <li key={lesson.id}>
          <span>{lesson.title}</span>
          <button onClick={() => onRemoveLesson(lesson.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
};
