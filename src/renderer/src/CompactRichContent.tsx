import { Fragment } from 'react';

import {
  stringifyRichContentBlocks,
  type InlineContent,
  type RichContentBlock,
} from '../../shared/document';
import { MathPreview } from './math/MathPreview';

export function CompactRichContent({
  blocks,
  fallback = '未填写内容',
}: {
  blocks: RichContentBlock[] | undefined;
  fallback?: string;
}) {
  if (!blocks?.length) {
    return <span>{fallback}</span>;
  }

  return (
    <span className="compact-rich-content">
      {blocks.map((block, index) => (
        <Fragment key={index}>
          {index > 0 ? <span aria-hidden="true"> </span> : null}
          <CompactBlock block={block} />
        </Fragment>
      ))}
    </span>
  );
}

function CompactBlock({ block }: { block: RichContentBlock }) {
  if (block.type === 'paragraph') {
    return (
      <>
        {block.children.map((content, index) => (
          <Fragment key={index}>
            <CompactInlineContent content={content} />
          </Fragment>
        ))}
      </>
    );
  }

  if (block.type === 'displayMath') {
    return <MathPreview latex={block.latex} display={false} fallbackLabel={`$${block.latex}$`} />;
  }

  const text = stringifyRichContentBlocks([block]).replace(/\s+/gu, ' ').trim();
  return <span>{text || '富内容'}</span>;
}

function CompactInlineContent({ content }: { content: InlineContent }) {
  switch (content.type) {
    case 'text':
      return content.text;
    case 'inlineMath':
      return (
        <MathPreview latex={content.latex} display={false} fallbackLabel={`$${content.latex}$`} />
      );
    case 'rawLatex':
      return <span>{content.latex}</span>;
    case 'blankRef':
      return <span className="compact-rich-placeholder">____</span>;
    case 'choiceParenRef':
    case 'judgementRef':
      return <span className="compact-rich-placeholder">（ ）</span>;
    case 'scoreRef':
      return <span className="compact-rich-placeholder">〔评分〕</span>;
    case 'annotationRef':
      return <span className="compact-rich-placeholder">〔批注〕</span>;
    case 'stemLine':
      return <span className="compact-rich-placeholder">________</span>;
  }
}
