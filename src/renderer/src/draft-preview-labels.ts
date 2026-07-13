import type { QuestionType } from '../../shared/document/model';

export function getQuestionTeacherContentLabel(questionType: QuestionType): string {
  return questionType === 'problem' ? '解答' : '解析';
}

export function getSubQuestionTeacherContentLabel(questionType: QuestionType): string {
  return questionType === 'problem' ? '小题解答' : '小题解析';
}
