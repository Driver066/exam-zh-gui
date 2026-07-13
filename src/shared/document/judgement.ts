import type { ExamDocument, ExamQuestion } from './model';

export interface ResolvedJudgementSetup {
  correctAnswer?: boolean;
  answerStyle: 'text' | 'symbol';
  placement: 'lineEnd' | 'inline';
  answerColor: 'black' | 'red';
}

export function resolveJudgementSetup(
  document: Pick<ExamDocument, 'setup'>,
  question: Pick<ExamQuestion, 'judgement'>,
): ResolvedJudgementSetup {
  return {
    correctAnswer: question.judgement?.correctAnswer,
    answerStyle: question.judgement?.answerStyle ?? 'text',
    placement: question.judgement?.placement ?? 'lineEnd',
    answerColor: document.setup.judgement?.answerColor === 'red' ? 'red' : 'black',
  };
}

export function formatJudgementAnswer(
  setup: Pick<ResolvedJudgementSetup, 'correctAnswer' | 'answerStyle'>,
  symbolFormat: 'latex' | 'unicode',
): string {
  if (setup.correctAnswer === undefined) {
    return '';
  }

  if (setup.answerStyle === 'symbol') {
    if (symbolFormat === 'latex') {
      return setup.correctAnswer ? '$\\checkmark$' : '$\\times$';
    }
    return setup.correctAnswer ? '✓' : '×';
  }

  return setup.correctAnswer ? '对' : '错';
}
