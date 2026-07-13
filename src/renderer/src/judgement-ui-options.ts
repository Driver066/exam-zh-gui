import {
  parseRichContentInput,
  removeJudgementRefs,
  stringifyRichContentBlocks,
  type ExamDocument,
  type ExamQuestion,
  type RichContentBlock,
} from '../../shared/document';
import {
  insertTextAtSelection,
  type TextInsertionResult,
  type TextSelection,
} from './math/symbols';

export type JudgementAnswerSelection = 'unset' | 'correct' | 'incorrect';
export type JudgementAnswerStyleSelection = 'text' | 'symbol';
export type JudgementAnswerColorSelection = 'black' | 'red';

export interface JudgementPlaceholderUpdate extends TextInsertionResult {
  blocks: RichContentBlock[];
}

export function getJudgementAnswerSelection(question: ExamQuestion): JudgementAnswerSelection {
  const answer = question.judgement?.correctAnswer;
  return answer === undefined ? 'unset' : answer ? 'correct' : 'incorrect';
}

export function setJudgementAnswerSelection(
  question: ExamQuestion,
  selection: JudgementAnswerSelection,
): ExamQuestion {
  return updateJudgementSetup(question, {
    correctAnswer: selection === 'unset' ? undefined : selection === 'correct',
  });
}

export function getJudgementAnswerStyleSelection(
  question: ExamQuestion,
): JudgementAnswerStyleSelection {
  return question.judgement?.answerStyle ?? 'text';
}

export function setJudgementAnswerStyle(
  question: ExamQuestion,
  selection: JudgementAnswerStyleSelection,
): ExamQuestion {
  return updateJudgementSetup(question, {
    answerStyle: selection === 'text' ? undefined : selection,
  });
}

export function getGlobalJudgementAnswerColor(
  document: Pick<ExamDocument, 'setup'>,
): JudgementAnswerColorSelection {
  return document.setup.judgement?.answerColor === 'red' ? 'red' : 'black';
}

export function setGlobalJudgementAnswerColor(
  document: ExamDocument,
  selection: JudgementAnswerColorSelection,
): ExamDocument {
  const setup = { ...document.setup };
  setup.judgement = selection === 'red' ? { answerColor: 'red' } : undefined;
  return { ...document, setup };
}

export function insertJudgementPlaceholder(
  value: string,
  selection?: TextSelection | null,
): JudgementPlaceholderUpdate {
  if (value.includes('{{判断括号}}')) {
    const parsed = parseRichContentInput(value, { context: 'judgementStem' });
    const cursor = selection?.end ?? value.length;
    return {
      value,
      selectionStart: cursor,
      selectionEnd: cursor,
      blocks: parsed.blocks,
    };
  }

  const insertion = insertTextAtSelection(value, '{{判断括号}}', selection);
  return {
    ...insertion,
    blocks: parseRichContentInput(insertion.value, { context: 'judgementStem' }).blocks,
  };
}

export function removeJudgementPlaceholders(value: string): JudgementPlaceholderUpdate {
  const parsed = parseRichContentInput(value, { context: 'judgementStem' });
  const blocks = removeJudgementRefs(parsed.blocks);
  const nextValue = stringifyRichContentBlocks(blocks);
  return {
    value: nextValue,
    selectionStart: nextValue.length,
    selectionEnd: nextValue.length,
    blocks,
  };
}

export function setJudgementPlacementAndStem(
  question: ExamQuestion,
  blocks: RichContentBlock[],
  placement: 'lineEnd' | 'inline',
): ExamQuestion {
  return {
    ...updateJudgementSetup(question, {
      placement: placement === 'lineEnd' ? undefined : 'inline',
    }),
    stem: placement === 'lineEnd' ? removeJudgementRefs(blocks) : blocks,
  };
}

function updateJudgementSetup(
  question: ExamQuestion,
  updates: NonNullable<ExamQuestion['judgement']>,
): ExamQuestion {
  const judgement = { ...(question.judgement ?? {}), ...updates };

  for (const key of Object.keys(judgement) as Array<keyof typeof judgement>) {
    if (judgement[key] === undefined) {
      delete judgement[key];
    }
  }

  return {
    ...question,
    judgement: Object.keys(judgement).length > 0 ? judgement : undefined,
  };
}
