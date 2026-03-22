type VideoBlock = {
  type: 'video';
  url: string;
};

type TextBlock = {
  type: 'text';
  body: string;
};

type FileBlock = {
  type: 'file';
  url: string;
  name: string;
};

type AssignmentBlock = {
  type: 'assignment';
  instruction: string;
};

export type ContentBlock = VideoBlock | TextBlock | FileBlock | AssignmentBlock;

export interface Lesson {
  id: string;
  title: string;
  contentBlocks: ContentBlock[];
}

export interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  price: number;
  category: string;
  sections: Section[];
}
