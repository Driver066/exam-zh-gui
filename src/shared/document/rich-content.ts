import type { InlineContent, RichContentBlock, ScoreMark, SolutionAnnotation } from './model';

export type RichContentParseDiagnosticCode =
  | 'unclosed_inline_math'
  | 'unknown_blank_placeholder'
  | 'unknown_placeholder'
  | 'invalid_placeholder_context'
  | 'duplicate_choice_paren_placeholder'
  | 'duplicate_judgement_placeholder';

export type RichContentInputContext =
  | 'choiceStem'
  | 'blankStem'
  | 'judgementStem'
  | 'problemStem'
  | 'subQuestionStem'
  | 'choiceOption'
  | 'solution'
  | 'blankAnswer'
  | 'generic';

export interface RichContentParseDiagnostic {
  code: RichContentParseDiagnosticCode;
  message: string;
}

export interface ParseRichContentOptions {
  blankIds?: string[];
  context?: RichContentInputContext;
}

export interface ParseRichContentResult {
  blocks: RichContentBlock[];
  diagnostics: RichContentParseDiagnostic[];
}

export interface TeacherContentStringifyContext {
  scoreMarks?: ScoreMark[];
  annotations?: SolutionAnnotation[];
}

export function parseRichContentInput(
  input: string,
  options: ParseRichContentOptions = {},
): ParseRichContentResult {
  const diagnostics: RichContentParseDiagnostic[] = [];
  const blocks: RichContentBlock[] = [];
  const paragraphLines: string[] = [];

  function flushParagraph(): void {
    const text = paragraphLines.join('\n');
    paragraphLines.length = 0;

    if (text.trim().length === 0) {
      return;
    }

    blocks.push({
      type: 'paragraph',
      children: parseInlineContent(text, options, diagnostics),
    });
  }

  for (const line of input.replace(/\r\n/g, '\n').split('\n')) {
    const displayMath = line.match(/^\s*\$\$([\s\S]*)\$\$\s*$/u);

    if (displayMath) {
      flushParagraph();
      blocks.push({
        type: 'displayMath',
        latex: displayMath[1],
      });
      continue;
    }

    if (line.trim().length === 0) {
      flushParagraph();
      continue;
    }

    paragraphLines.push(line);
  }

  flushParagraph();

  return { blocks, diagnostics };
}

export function stringifyRichContentBlocks(
  blocks: RichContentBlock[] | undefined,
  blankIds: string[] = [],
  teacherContent?: TeacherContentStringifyContext,
): string {
  return (blocks ?? [])
    .map((block) => stringifyRichContentBlock(block, blankIds, teacherContent))
    .join('\n\n');
}

export function hasUnclosedInlineMath(input: string): boolean {
  return parseRichContentInput(input).diagnostics.some(
    (diagnostic) => diagnostic.code === 'unclosed_inline_math',
  );
}

export function removeChoiceParenRefs(blocks: RichContentBlock[]): RichContentBlock[] {
  return removeInlineRefs(blocks, 'choiceParenRef');
}

export function removeJudgementRefs(blocks: RichContentBlock[]): RichContentBlock[] {
  return removeInlineRefs(blocks, 'judgementRef');
}

function removeInlineRefs(
  blocks: RichContentBlock[],
  type: 'choiceParenRef' | 'judgementRef',
): RichContentBlock[] {
  return blocks.map((block) => {
    switch (block.type) {
      case 'paragraph':
        return {
          ...block,
          children: block.children.filter((child) => child.type !== type),
        };
      case 'list':
        return {
          ...block,
          items: block.items.map((item) => removeInlineRefs(item, type)),
        };
      case 'textFigure':
        return {
          ...block,
          text: removeInlineRefs(block.text, type),
        };
      case 'displayMath':
      case 'image':
      case 'figureGroup':
      case 'rawLatex':
        return block;
    }
  });
}

function parseInlineContent(
  input: string,
  options: ParseRichContentOptions,
  diagnostics: RichContentParseDiagnostic[],
): InlineContent[] {
  const content: InlineContent[] = [];
  let cursor = 0;
  let choiceParenRefCount = 0;
  let judgementRefCount = 0;

  while (cursor < input.length) {
    const nextMath = input.indexOf('$', cursor);
    const nextPlaceholder = input.indexOf('{{', cursor);
    const nextToken = minPositive(nextMath, nextPlaceholder);

    if (nextToken === -1) {
      pushText(content, input.slice(cursor));
      break;
    }

    pushText(content, input.slice(cursor, nextToken));

    if (nextToken === nextMath) {
      const closingMath = input.indexOf('$', nextMath + 1);

      if (closingMath === -1) {
        pushText(content, input.slice(nextMath));
        diagnostics.push({
          code: 'unclosed_inline_math',
          message: '行内公式缺少结束的 "$"，已按普通文本保留。',
        });
        break;
      }

      content.push({
        type: 'inlineMath',
        latex: input.slice(nextMath + 1, closingMath),
      });
      cursor = closingMath + 1;
      continue;
    }

    const placeholderMatch = input.slice(nextPlaceholder).match(/^\{\{([^{}]+)\}\}/u);

    if (!placeholderMatch) {
      pushText(content, input.slice(nextPlaceholder, nextPlaceholder + 1));
      cursor = nextPlaceholder + 1;
      continue;
    }

    const placeholderText = placeholderMatch[1];
    const placeholderSource = placeholderMatch[0];
    const blankMatch = placeholderText.match(/^第(\d+)空$/u);

    if (placeholderText === '选择括号') {
      if (isPlaceholderAllowed('choiceParenRef', options.context)) {
        if (choiceParenRefCount === 0) {
          content.push({ type: 'choiceParenRef' });
          choiceParenRefCount += 1;
        } else {
          content.push({ type: 'choiceParenRef' });
          diagnostics.push({
            code: 'duplicate_choice_paren_placeholder',
            message: '选择题只能有一个选择括号位置。',
          });
        }
      } else {
        pushText(content, placeholderSource);
        diagnostics.push({
          code: 'invalid_placeholder_context',
          message: '选择括号占位只能用于单选题或多选题题干。',
        });
      }

      cursor = nextPlaceholder + placeholderSource.length;
      continue;
    }

    if (placeholderText === '判断括号') {
      if (isPlaceholderAllowed('judgementRef', options.context)) {
        content.push({ type: 'judgementRef' });
        if (judgementRefCount > 0) {
          diagnostics.push({
            code: 'duplicate_judgement_placeholder',
            message: '判断题只能有一个判断括号位置。',
          });
        }
        judgementRefCount += 1;
      } else {
        pushText(content, placeholderSource);
        diagnostics.push({
          code: 'invalid_placeholder_context',
          message: '判断括号占位只能用于判断题题干。',
        });
      }

      cursor = nextPlaceholder + placeholderSource.length;
      continue;
    }

    if (placeholderText === '横线') {
      if (isPlaceholderAllowed('stemLine', options.context)) {
        content.push({ type: 'stemLine' });
      } else {
        pushText(content, placeholderSource);
        diagnostics.push({
          code: 'invalid_placeholder_context',
          message: '题干横线占位只能用于题干类文本。',
        });
      }

      cursor = nextPlaceholder + placeholderSource.length;
      continue;
    }

    if (!blankMatch) {
      pushText(content, placeholderSource);
      diagnostics.push({
        code: 'unknown_placeholder',
        message: `占位符“${placeholderSource}”暂不支持。`,
      });
      cursor = nextPlaceholder + placeholderSource.length;
      continue;
    }

    const blankIndex = Number(blankMatch[1]) - 1;
    const blankId = options.blankIds?.[blankIndex];

    if (blankId) {
      if (isPlaceholderAllowed('blankRef', options.context)) {
        content.push({ type: 'blankRef', blankId });
      } else {
        pushText(content, placeholderSource);
        diagnostics.push({
          code: 'invalid_placeholder_context',
          message: '填空占位符只能用于填空题题干。',
        });
      }
    } else {
      pushText(content, placeholderSource);
      diagnostics.push({
        code: 'unknown_blank_placeholder',
        message: `填空占位符“${placeholderSource}”没有对应的填空项。`,
      });
    }

    cursor = nextPlaceholder + placeholderSource.length;
  }

  return mergeAdjacentText(content);
}

function stringifyRichContentBlock(
  block: RichContentBlock,
  blankIds: string[],
  teacherContent?: TeacherContentStringifyContext,
): string {
  switch (block.type) {
    case 'paragraph':
      return block.children
        .map((child) => stringifyInlineContent(child, blankIds, teacherContent))
        .join('');
    case 'displayMath':
      return `$$${block.latex}$$`;
    case 'rawLatex':
      return block.latex;
    case 'list':
      return block.items
        .map(
          (item, index) =>
            `${index + 1}. ${stringifyRichContentBlocks(item, blankIds, teacherContent)}`,
        )
        .join('\n');
    case 'image':
      return `[image:${block.assetId}]`;
    case 'figureGroup':
      return '[figure group]';
    case 'textFigure':
      return stringifyRichContentBlocks(block.text, blankIds, teacherContent);
  }
}

function stringifyInlineContent(
  content: InlineContent,
  blankIds: string[],
  teacherContent?: TeacherContentStringifyContext,
): string {
  switch (content.type) {
    case 'text':
      return content.text;
    case 'inlineMath':
      return `$${content.latex}$`;
    case 'rawLatex':
      return content.latex;
    case 'blankRef': {
      const index = blankIds.indexOf(content.blankId);
      return index === -1 ? `{{${content.blankId}}}` : `{{第${index + 1}空}}`;
    }
    case 'choiceParenRef':
      return '{{选择括号}}';
    case 'judgementRef':
      return '{{判断括号}}';
    case 'scoreRef': {
      const scoreMark = teacherContent?.scoreMarks?.find((item) => item.id === content.scoreMarkId);
      return `\\score{${scoreMark?.points ?? ''}}`;
    }
    case 'annotationRef': {
      const annotation = teacherContent?.annotations?.find(
        (item) => item.id === content.annotationId,
      );
      return `\\score{${stringifyInlineRichText(annotation?.content)}}`;
    }
    case 'stemLine':
      return '{{横线}}';
  }
}

function stringifyInlineRichText(content: SolutionAnnotation['content'] | undefined): string {
  return (content ?? [])
    .map((item) => {
      if (item.type === 'text') return item.text;
      if (item.type === 'inlineMath') return `$${item.latex}$`;
      return item.latex;
    })
    .join('');
}

function isPlaceholderAllowed(
  type: 'blankRef' | 'choiceParenRef' | 'judgementRef' | 'stemLine',
  context: RichContentInputContext | undefined,
): boolean {
  if (!context) {
    return true;
  }

  switch (type) {
    case 'blankRef':
      return context === 'blankStem';
    case 'choiceParenRef':
      return context === 'choiceStem';
    case 'judgementRef':
      return context === 'judgementStem';
    case 'stemLine':
      return (
        context === 'choiceStem' ||
        context === 'blankStem' ||
        context === 'judgementStem' ||
        context === 'problemStem' ||
        context === 'subQuestionStem'
      );
  }
}

function pushText(content: InlineContent[], text: string): void {
  if (text.length > 0) {
    content.push({ type: 'text', text });
  }
}

function mergeAdjacentText(content: InlineContent[]): InlineContent[] {
  const merged: InlineContent[] = [];

  for (const item of content) {
    const previous = merged[merged.length - 1];

    if (item.type === 'text' && previous?.type === 'text') {
      previous.text += item.text;
    } else {
      merged.push(item);
    }
  }

  return merged;
}

function minPositive(left: number, right: number): number {
  if (left === -1) {
    return right;
  }

  if (right === -1) {
    return left;
  }

  return Math.min(left, right);
}
