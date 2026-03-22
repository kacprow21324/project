'use client';

import { useReducer, useState, useEffect } from 'react';
import type { Course, Section } from '@/types/courses';
import { SectionList } from './SectionList';
import { supabase } from '@/lib/supabaseClient';

export type CourseAction =
  | {
      type: 'UPDATE_COURSE_INFO';
      payload: {
        field: 'title' | 'description' | 'level' | 'price' | 'category';
        value: string | number;
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

interface Category {
  id: string | number;
  title: string;
}

export const CourseBuilder = ({ initialCourse, onCourseUpdate }: CourseBuilderProps) => {
  const initialCourseWithSections = { ...initialCourse, sections: initialCourse.sections || [], category: initialCourse.category || '' };
  const [course, dispatch] = useReducer(courseReducer, initialCourseWithSections);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from('categories').select('id, title');
      if (error) {
        console.error('Error fetching categories:', error);
      } else {
        setCategories(data || []);
      }
    };
    fetchCategories();
  }, []);

  const handleSave = () => {
    if (onCourseUpdate) {
      onCourseUpdate(course);
    }
  };

  const updateCourseInfo = (field: 'title' | 'description' | 'level' | 'price' | 'category', value: string | number) => {
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
        <h2>Informacje o kursie</h2>
        <div>
          <label>
            Tytuł:
            <input
              type="text"
              value={course.title}
              onChange={(e) => updateCourseInfo('title', e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Opis:
            <textarea
              value={course.description}
              onChange={(e) => updateCourseInfo('description', e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Poziom:
            <select value={course.level} onChange={(e) => updateCourseInfo('level', e.target.value)}>
              <option value="">Wybierz poziom</option>
              <option value="Podstawowy">Podstawowy</option>
              <option value="Średnio Zaawansowany">Średnio Zaawansowany</option>
              <option value="Zaawansowany">Zaawansowany</option>
            </select>
          </label>
        </div>
        <div>
          <label>
            Cena:
            <input
              type="number"
              value={course.price}
              onChange={(e) => updateCourseInfo('price', parseFloat(e.target.value) || 0)}
            />
          </label>
        </div>
        <div>
          <label>
            Kategoria:
            <select
              value={course.category}
              onChange={(e) => updateCourseInfo('category', e.target.value)}
            >
              <option value="">Wybierz kategorię</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.title}>
                  {cat.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section>
        <h2>Lekcje ({course.sections.length})</h2>
        <button
          onClick={() => {
            const newSection: Section = {
              id: `section-${Date.now()}`,
              title: 'Nowa lekcja',
              lessons: [],
            };
            addSection(newSection);
          }}
        >
          Dodaj lekcję
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
        <button onClick={handleSave}>Zapisz kurs</button>
      </section>

      <section>
        <h2>Debug</h2>
        <pre>{JSON.stringify(course, null, 2)}</pre>
      </section>
    </div>
  );
};