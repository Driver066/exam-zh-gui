import {
  stringifyRichContentBlocks,
  type ExamZhOptionBag,
  type RichContentBlock,
} from '../../shared/document';

export type ParenAnswerColorSelection = 'black' | 'red' | 'custom';

export function getParenAnswerColorSelection(
  options: ExamZhOptionBag | undefined,
): ParenAnswerColorSelection {
  const color = options?.['paren/text-color'];

  if (color === undefined || color === 'black') {
    return 'black';
  }

  return color === 'red' ? 'red' : 'custom';
}

export function getPreviewParenAnswerColor(options: ExamZhOptionBag | undefined): 'black' | 'red' {
  return getParenAnswerColorSelection(options) === 'red' ? 'red' : 'black';
}

export function summarizeRichContent(
  blocks: RichContentBlock[] | undefined,
  fallback: string,
  maxLength = 28,
): string {
  const text = stringifyRichContentBlocks(blocks).replace(/\s+/gu, ' ').trim();

  if (text.length === 0) {
    return fallback;
  }

  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}
