'use client';

import { useReducer, useEffect } from 'react';
import type { Course, Section } from '@/types/courses';
import { SectionList } from './SectionList';

export type CourseAction =
  | {
      type: 'UPDATE_COURSE_INFO';
      payload: {
        field: 'title' | 'desc';
        value: string;
      };
    }
  | {
      type: 'ADD_SECTION';
      payload: Section;
    }
  | {
      type: 'REMOVE_SECTION';
      payload: {
        sectionId: string;
      };
    }
  | {
      type: 'UPDATE_SECTION_TITLE';
      payload: {
        sectionId: string;
        newTitle: string;
      };
    }
  | {
      type: 'ADD_LESSON_TO_SECTION';
      payload: {
        sectionId: string;
        lesson: any;
      };
    }
  | {
      type: 'REMOVE_LESSON_FROM_SECTION';
      payload: {
        sectionId: string;
        lessonId: string;
      };
    };

const courseReducer = (state: Course, action: CourseAction): Course => {
  switch (action.type) {
    case 'UPDATE_COURSE_INFO': {
      return {
        ...state,
        [action.payload.field]: action.payload.value,
      };
    }

    case 'ADD_SECTION': {
      return {
        ...state,
        sections: [...state.sections, action.payload],
      };
    }

    case 'REMOVE_SECTION': {
      return {
        ...state,
        sections: state.sections.filter(
          (section) => section.id !== action.payload.sectionId
        ),
      };
    }

    case 'UPDATE_SECTION_TITLE': {
      return {
        ...state,
        sections: state.sections.map((section) =>
          section.id === action.payload.sectionId
            ? { ...section, title: action.payload.newTitle }
            : section
        ),
      };
    }

    case 'ADD_LESSON_TO_SECTION': {
      return {
        ...state,
        sections: state.sections.map((section) =>
          section.id === action.payload.sectionId
            ? { ...section, lessons: [...section.lessons, action.payload.lesson] }
            : section
        ),
      };
    }

    case 'REMOVE_LESSON_FROM_SECTION': {
      return {
        ...state,
        sections: state.sections.map((section) =>
          section.id === action.payload.sectionId
            ? {
                ...section,
                lessons: section.lessons.filter(
                  (lesson) => lesson.id !== action.payload.lessonId
                ),
              }
            : section
        ),
      };
    }

    default:
      return state;
  }
};

interface CourseBuilderProps {
  initialCourse: Course;
  onCourseUpdate?: (course: Course) => void;
}

export const CourseBuilder = ({ initialCourse, onCourseUpdate }: CourseBuilderProps) => {
  const [course, dispatch] = useReducer(courseReducer, initialCourse);

  useEffect(() => {
    if (onCourseUpdate) {
      onCourseUpdate(course);
    }
  }, [course, onCourseUpdate]);

  const updateCourseInfo = (field: 'title' | 'desc', value: string) => {
    dispatch({
      type: 'UPDATE_COURSE_INFO',
      payload: { field, value },
    });
  };

  const addSection = (section: Section) => {
    dispatch({
      type: 'ADD_SECTION',
      payload: section,
    });
  };

  const removeSection = (sectionId: string) => {
    dispatch({
      type: 'REMOVE_SECTION',
      payload: { sectionId },
    });
  };

  const updateSectionTitle = (sectionId: string, newTitle: string) => {
    dispatch({
      type: 'UPDATE_SECTION_TITLE',
      payload: { sectionId, newTitle },
    });
  };

  const addLessonToSection = (sectionId: string, lesson: any) => {
    dispatch({
      type: 'ADD_LESSON_TO_SECTION',
      payload: { sectionId, lesson },
    });
  };

  const removeLessonFromSection = (sectionId: string, lessonId: string) => {
    dispatch({
      type: 'REMOVE_LESSON_FROM_SECTION',
      payload: { sectionId, lessonId },
    });
  };

  return (
    <div>
      <h1>Course Builder</h1>

      <section>
        <h2>Course Information</h2>
        <div>
          <label>
            Title:
            <input
              type="text"
              value={course.title}
              onChange={(e) => updateCourseInfo('title', e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Description:
            <textarea
              value={course.desc}
              onChange={(e) => updateCourseInfo('desc', e.target.value)}
            />
          </label>
        </div>
      </section>

      <section>
        <h2>Sections ({course.sections.length})</h2>
        <button
          onClick={() => {
            const newSection: Section = {
              id: `section-${Date.now()}`,
              title: 'New Section',
              lessons: [],
            };
            addSection(newSection);
          }}
        >
          Add Section
        </button>
        <SectionList
          sections={course.sections}
          onUpdateSectionTitle={updateSectionTitle}
          onRemoveSection={removeSection}
          onAddLessonToSection={addLessonToSection}
          onRemoveLessonFromSection={removeLessonFromSection}
        />
      </section>

      <section>
        <h2>Course State (Debug)</h2>
        <pre>{JSON.stringify(course, null, 2)}</pre>
      </section>
    </div>
  );
};