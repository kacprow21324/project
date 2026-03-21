import type { Course } from './courses';

export const mockCourse: Course = {
  id: 'course-001',
  title: 'Wprowadzenie do TypeScript',
  desc: 'Kompletny kurs nauczający TypeScript od podstaw do zaawansowanych koncepcji',
  sections: [
    {
      id: 'section-001',
      title: 'Podstawy TypeScript',
      lessons: [
        {
          id: 'lesson-001',
          title: 'Co to jest TypeScript?',
          contentBlocks: [
            {
              type: 'video',
              url: 'https://example.com/videos/what-is-typescript.mp4',
            },
            {
              type: 'text',
              body: 'TypeScript to nadzbiór JavaScript\'a, który dodaje statyczne typowanie. Pozwala to na szybsze wykrywanie błędów podczas programowania.',
            },
            {
              type: 'file',
              url: 'https://example.com/files/typescript-cheatsheet.pdf',
              name: 'TypeScript Cheatsheet',
            },
          ],
        },
        {
          id: 'lesson-002',
          title: 'Konfiguracja środowiska',
          contentBlocks: [
            {
              type: 'text',
              body: 'Aby zacząć pracę z TypeScript, musisz zainstalować Node.js i npm. Następnie globalnie zainstaluj TypeScript: npm install -g typescript',
            },
            {
              type: 'assignment',
              instruction: 'Zainstaluj TypeScript na swoim komputerze i sprawdź wersję poleceniem: tsc --version',
            },
            {
              type: 'video',
              url: 'https://example.com/videos/setup-typescript.mp4',
            },
          ],
        },
      ],
    },
    {
      id: 'section-002',
      title: 'Zaawansowane koncepcje',
      lessons: [
        {
          id: 'lesson-003',
          title: 'Interfejsy i typy',
          contentBlocks: [
            {
              type: 'video',
              url: 'https://example.com/videos/interfaces-types.mp4',
            },
            {
              type: 'text',
              body: 'Interfejsy definiują kontrakt dla struktury obiektu. Typy mogą reprezentować nie tylko obiekty, ale również prymitywy i unijne typy.',
            },
            {
              type: 'file',
              url: 'https://example.com/files/interfaces-example.ts',
              name: 'Przykłady interfejsów',
            },
          ],
        },
        {
          id: 'lesson-004',
          title: 'Generyczne typy',
          contentBlocks: [
            {
              type: 'text',
              body: 'Generyczne typy pozwalają na tworzenie komponentów kodu, które działają z wieloma różnymi typami danych.',
            },
            {
              type: 'video',
              url: 'https://example.com/videos/generics.mp4',
            },
            {
              type: 'assignment',
              instruction: 'Napisz funkcję generyczną, która zwraca pierwszy element tablicy dowolnego typu.',
            },
          ],
        },
      ],
    },
  ],
};
