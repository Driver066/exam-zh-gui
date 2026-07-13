import { calculateSectionStats } from '../../shared/document';
import type { ExamSection, ExamSectionKind, QuestionType } from '../../shared/document/model';

export const sectionKindLabels: Record<ExamSectionKind, string> = {
  singleChoice: '单选节',
  multipleChoice: '多选节',
  blank: '填空节',
  judgement: '判断节',
  problem: '解答节',
  custom: '混合节',
};

export const questionTypeLabels: Record<QuestionType, string> = {
  singleChoice: '单选题',
  multipleChoice: '多选题',
  blank: '填空题',
  judgement: '判断题',
  problem: '解答题',
  rawLatex: '原始 LaTeX',
};

export const teacherCreatableSectionKinds: ExamSectionKind[] = [
  'singleChoice',
  'multipleChoice',
  'blank',
  'judgement',
  'problem',
  'custom',
];

const structuredQuestionTypes: QuestionType[] = [
  'singleChoice',
  'multipleChoice',
  'blank',
  'judgement',
  'problem',
];

export type SectionQuestionAddMode =
  { kind: 'direct'; questionType: QuestionType } | { kind: 'menu'; questionTypes: QuestionType[] };

export function getSectionQuestionTypes(kind: ExamSectionKind): QuestionType[] {
  return kind === 'custom' ? structuredQuestionTypes : [kind];
}

export function getSectionQuestionAddMode(kind: ExamSectionKind): SectionQuestionAddMode {
  const questionTypes = getSectionQuestionTypes(kind);

  return questionTypes.length === 1
    ? { kind: 'direct', questionType: questionTypes[0]! }
    : { kind: 'menu', questionTypes };
}

export function getSectionKindForQuestionType(type: QuestionType): ExamSectionKind {
  return type === 'rawLatex' ? 'custom' : type;
}

export function getSelectableSectionKinds(section: ExamSection): ExamSectionKind[] {
  if (section.questions.length === 0) {
    return teacherCreatableSectionKinds;
  }

  const inferredKinds = [
    ...new Set(section.questions.map((question) => getSectionKindForQuestionType(question.type))),
  ];
  const compatibleKinds =
    inferredKinds.length === 1 ? [inferredKinds[0]!, 'custom' as const] : ['custom' as const];

  return [...new Set([...compatibleKinds, section.kind])];
}

export function getSectionKindHint(
  section: ExamSection,
  selectableKinds: ExamSectionKind[],
): string | null {
  if (
    section.questions.length === 0 ||
    selectableKinds.length === teacherCreatableSectionKinds.length
  ) {
    return null;
  }

  return '已有题目时，只能切换为与题目匹配的节类型或混合节。';
}

export function getSectionEditorTitle(section: ExamSection, sectionIndex: number): string {
  return `${toChineseSectionNumber(sectionIndex + 1)}、${section.title.trim() || '未命名节'}`;
}

export function getSectionEditorSummary(section: ExamSection): string {
  const { questionCount, totalPoints } = calculateSectionStats(section);
  const structure = questionCount === 0 ? '暂无题目' : `${questionCount} 题 · 共 ${totalPoints} 分`;

  return `${sectionKindLabels[section.kind]} · ${structure}`;
}

export function getNewSectionTitleSelection(section: Pick<ExamSection, 'title'>): {
  start: number;
  end: number;
} {
  return { start: 0, end: section.title.length };
}

export function isSectionPropertiesExpanded(
  expandedIds: ReadonlySet<string>,
  sectionId: string,
): boolean {
  return expandedIds.has(sectionId);
}

export function expandSectionProperties(
  expandedIds: ReadonlySet<string>,
  sectionId: string,
): ReadonlySet<string> {
  return new Set(expandedIds).add(sectionId);
}

export function toggleSectionProperties(
  expandedIds: ReadonlySet<string>,
  sectionId: string,
): ReadonlySet<string> {
  const next = new Set(expandedIds);

  if (next.has(sectionId)) next.delete(sectionId);
  else next.add(sectionId);

  return next;
}

export function removeSectionPropertiesState(
  expandedIds: ReadonlySet<string>,
  sectionId: string,
): ReadonlySet<string> {
  const next = new Set(expandedIds);
  next.delete(sectionId);
  return next;
}

function toChineseSectionNumber(value: number): string {
  const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

  if (value <= 10) return value === 10 ? '十' : (digits[value] ?? String(value));
  if (value < 20) return `十${digits[value - 10]}`;
  if (value < 100) {
    const tens = Math.floor(value / 10);
    const ones = value % 10;
    return `${digits[tens]}十${ones === 0 ? '' : digits[ones]}`;
  }

  return String(value);
}
