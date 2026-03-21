'use client';

import type { ContentBlock } from '@/types/courses';

interface ContentBlockRendererProps {
  block: ContentBlock;
}

export const ContentBlockRenderer = ({ block }: ContentBlockRendererProps) => {
  switch (block.type) {
    case 'video':
      return (
        <div>
          <h4>Video</h4>
          <div>
            <iframe
              width="560"
              height="315"
              src={block.url}
              title="Video content"
              allowFullScreen
            />
          </div>
          <p>
            <small>URL: {block.url}</small>
          </p>
        </div>
      );

    case 'text':
      return (
        <div>
          <h4>Text Content</h4>
          <p>{block.body}</p>
        </div>
      );

    case 'file':
      return (
        <div>
          <h4>File</h4>
          <p>
            <a href={block.url} download>
              Download: {block.name}
            </a>
          </p>
          <small>
            <a href={block.url} target="_blank" rel="noopener noreferrer">
              Open in new tab
            </a>
          </small>
        </div>
      );

    case 'assignment':
      return (
        <div>
          <h4>Assignment / Task</h4>
          <div
            style={{
              border: '1px solid #ccc',
              padding: '12px',
              borderRadius: '4px',
              backgroundColor: '#f9f9f9',
            }}
          >
            <h5>Instructions</h5>
            <p>{block.instruction}</p>
          </div>
        </div>
      );

    default:
      const exhaustiveCheck: never = block;
      return exhaustiveCheck;
  }
};
