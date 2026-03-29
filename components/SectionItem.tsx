import type { Section, Lesson } from '@/types/courses';
import { LessonList } from './LessonList';

interface SectionItemProps {
  section: Section;
  onUpdateTitle: (sectionId: string, newTitle: string) => void;
  onRemoveSection: (sectionId: string) => void;
  onAddLesson: (sectionId: string, lesson: Lesson) => void;
  onRemoveLesson: (sectionId: string, lessonId: string) => void;
}

export const SectionItem = ({
  section,
  onUpdateTitle,
  onRemoveSection,
  onAddLesson,
  onRemoveLesson,
}: SectionItemProps) => {
  const handleAddLesson = () => {
    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      title: 'New Lesson',
      contentBlocks: [],
    };
    onAddLesson(section.id, newLesson);
  };

  return (
    <li>
      <div>
        <input
          type="text"
          value={section.title}
          onChange={(e) => onUpdateTitle(section.id, e.target.value)}
        />
        <button onClick={() => onRemoveSection(section.id)}>
          Delete Section
        </button>
      </div>

      <div>
        <button onClick={handleAddLesson}>Add Lesson</button>
      </div>

      <LessonList
        lessons={section.lessons}
        onRemoveLesson={(lessonId) => onRemoveLesson(section.id, lessonId)}
      />
    </li>
  );
};
