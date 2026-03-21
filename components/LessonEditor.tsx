'use client';

import { useReducer, useState } from 'react';
import type { Lesson, ContentBlock } from '@/types/courses';
import { ContentBlockRenderer } from './ContentBlockRenderer';

export type LessonAction =
  | {
      type: 'ADD_BLOCK';
      payload: ContentBlock;
    }
  | {
      type: 'REMOVE_BLOCK';
      payload: {
        blockIndex: number;
      };
    }
  | {
      type: 'UPDATE_TITLE';
      payload: {
        title: string;
      };
    };

const lessonReducer = (state: Lesson, action: LessonAction): Lesson => {
  switch (action.type) {
    case 'ADD_BLOCK': {
      return {
        ...state,
        contentBlocks: [...state.contentBlocks, action.payload],
      };
    }

    case 'REMOVE_BLOCK': {
      return {
        ...state,
        contentBlocks: state.contentBlocks.filter(
          (_, index) => index !== action.payload.blockIndex
        ),
      };
    }

    case 'UPDATE_TITLE': {
      return {
        ...state,
        title: action.payload.title,
      };
    }

    default:
      return state;
  }
};

type BlockType = 'video' | 'text' | 'file' | 'assignment';

interface LessonEditorProps {
  lesson: Lesson;
  onLessonUpdate: (updatedLesson: Lesson) => void;
}

export const LessonEditor = ({ lesson, onLessonUpdate }: LessonEditorProps) => {
  const [state, dispatch] = useReducer(lessonReducer, lesson);
  const [selectedBlockType, setSelectedBlockType] = useState<BlockType>('video');
  const [formData, setFormData] = useState<{
    videoUrl?: string;
    textBody?: string;
    fileName?: string;
    fileUrl?: string;
    assignmentInstruction?: string;
  }>({});

  const handleAddBlock = () => {
    let newBlock: ContentBlock | null = null;

    switch (selectedBlockType) {
      case 'video':
        if (formData.videoUrl) {
          newBlock = {
            type: 'video',
            url: formData.videoUrl,
          };
        }
        break;
      case 'text':
        if (formData.textBody) {
          newBlock = {
            type: 'text',
            body: formData.textBody,
          };
        }
        break;
      case 'file':
        if (formData.fileName && formData.fileUrl) {
          newBlock = {
            type: 'file',
            url: formData.fileUrl,
            name: formData.fileName,
          };
        }
        break;
      case 'assignment':
        if (formData.assignmentInstruction) {
          newBlock = {
            type: 'assignment',
            instruction: formData.assignmentInstruction,
          };
        }
        break;
    }

    if (newBlock) {
      dispatch({
        type: 'ADD_BLOCK',
        payload: newBlock,
      });
      setFormData({});
    }
  };

  const handleRemoveBlock = (index: number) => {
    dispatch({
      type: 'REMOVE_BLOCK',
      payload: { blockIndex: index },
    });
  };

  const handleUpdateTitle = (newTitle: string) => {
    dispatch({
      type: 'UPDATE_TITLE',
      payload: { title: newTitle },
    });
  };

  const handleStateChange = () => {
    onLessonUpdate(state);
  };

  return (
    <div>
      <div>
        <h3>Lesson Title</h3>
        <input
          type="text"
          value={state.title}
          onChange={(e) => {
            handleUpdateTitle(e.target.value);
            handleStateChange();
          }}
          placeholder="Lesson title"
        />
      </div>

      <div>
        <h3>Content Blocks</h3>

        <div>
          <h4>Add Material</h4>
          <div>
            <label>
              Type:
              <select
                value={selectedBlockType}
                onChange={(e) => setSelectedBlockType(e.target.value as BlockType)}
              >
                <option value="video">Video</option>
                <option value="text">Text</option>
                <option value="file">File</option>
                <option value="assignment">Task/Assignment</option>
              </select>
            </label>
          </div>

          {selectedBlockType === 'video' && (
            <div>
              <label>
                Video URL:
                <input
                  type="text"
                  value={formData.videoUrl || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, videoUrl: e.target.value })
                  }
                  placeholder="https://example.com/video.mp4"
                />
              </label>
            </div>
          )}

          {selectedBlockType === 'text' && (
            <div>
              <label>
                Text Content:
                <textarea
                  value={formData.textBody || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, textBody: e.target.value })
                  }
                  placeholder="Enter your text content here"
                />
              </label>
            </div>
          )}

          {selectedBlockType === 'file' && (
            <div>
              <label>
                File Name:
                <input
                  type="text"
                  value={formData.fileName || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, fileName: e.target.value })
                  }
                  placeholder="document.pdf"
                />
              </label>
              <label>
                File URL:
                <input
                  type="text"
                  value={formData.fileUrl || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, fileUrl: e.target.value })
                  }
                  placeholder="https://example.com/document.pdf"
                />
              </label>
            </div>
          )}

          {selectedBlockType === 'assignment' && (
            <div>
              <label>
                Assignment Instructions:
                <textarea
                  value={formData.assignmentInstruction || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assignmentInstruction: e.target.value,
                    })
                  }
                  placeholder="Enter assignment instructions"
                />
              </label>
            </div>
          )}

          <button onClick={() => {
            handleAddBlock();
            handleStateChange();
          }}>
            Add Material
          </button>
        </div>

        <div>
          <h4>Materials ({state.contentBlocks.length})</h4>
          {state.contentBlocks.length === 0 ? (
            <p>No materials added yet</p>
          ) : (
            <ul>
              {state.contentBlocks.map((block, index) => (
                <li key={index}>
                  <div>
                    <ContentBlockRenderer block={block} />
                  </div>
                  <button onClick={() => {
                    handleRemoveBlock(index);
                    handleStateChange();
                  }}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div>
        <h4>Lesson State (Debug)</h4>
        <pre>{JSON.stringify(state, null, 2)}</pre>
      </div>
    </div>
  );
};
