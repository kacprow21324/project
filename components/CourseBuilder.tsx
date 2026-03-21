'use client';

import { useReducer } from 'react';
import type { Course, Section } from '@/types/courses';

// Action Types
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

    default:
      return state;
  }
};

interface CourseBuilderProps {
  initialCourse: Course;
}

export const CourseBuilder = ({ initialCourse }: CourseBuilderProps) => {
  const [course, dispatch] = useReducer(courseReducer, initialCourse);

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
        <ul>
          {course.sections.map((section) => (
            <li key={section.id}>
              <input
                type="text"
                value={section.title}
                onChange={(e) =>
                  updateSectionTitle(section.id, e.target.value)
                }
              />
              <button onClick={() => removeSection(section.id)}>
                Remove Section
              </button>
              <p>Lessons: {section.lessons.length}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Course State (Debug)</h2>
        <pre>{JSON.stringify(course, null, 2)}</pre>
      </section>
    </div>
  );
};