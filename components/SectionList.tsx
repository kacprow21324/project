import type { Section } from '@/types/courses';
import { SectionItem } from './SectionItem';

interface SectionListProps {
  sections: Section[];
  onUpdateSectionTitle: (sectionId: string, newTitle: string) => void;
  onRemoveSection: (sectionId: string) => void;
  onAddLessonToSection: (sectionId: string, lesson: any) => void;
  onRemoveLessonFromSection: (sectionId: string, lessonId: string) => void;
}

export const SectionList = ({
  sections,
  onUpdateSectionTitle,
  onRemoveSection,
  onAddLessonToSection,
  onRemoveLessonFromSection,
}: SectionListProps) => {
  return (
    <ul>
      {sections.map((section) => (
        <SectionItem
          key={section.id}
          section={section}
          onUpdateTitle={onUpdateSectionTitle}
          onRemoveSection={onRemoveSection}
          onAddLesson={onAddLessonToSection}
          onRemoveLesson={onRemoveLessonFromSection}
        />
      ))}
    </ul>
  );
};
