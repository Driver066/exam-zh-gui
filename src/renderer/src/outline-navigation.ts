import {
  calculateDocumentStats,
  calculateSectionStats,
  resolveQuestionNumbers,
  reviewQuestionScoreMarks,
} from '../../shared/document';
import type {
  BlankSlot,
  ExamDocument,
  ExamQuestion,
  ExamSection,
  RichContentBlock,
  ScoreMode,
} from '../../shared/document';
import type {
  FigureGroupBlock,
  ImageBlock,
  QuestionType,
  RawLatexBlock,
  TextFigureBlock,
} from '../../shared/document/model';

export type OutlineBadgeTone = 'warning' | 'info';

export interface OutlineBadge {
  label: string;
  tone: OutlineBadgeTone;
  priority: number;
}

export interface VisibleOutlineBadges {
  visible: OutlineBadge[];
  hiddenCount: number;
}

export interface OutlineQuestionItem {
  id: string;
  sectionId: string;
  number: number;
  typeLabel: string;
  pointsLabel: string;
  detailLabels: string[];
  badges: OutlineBadge[];
}

export interface OutlineSectionItem {
  id: string;
  title: string;
  numberLabel: string;
  scoreSummary: string;
  questions: OutlineQuestionItem[];
}

export interface OutlineNavigationModel {
  stats: {
    sectionCount: number;
    questionCount: number;
    totalPoints: number;
  };
  sections: OutlineSectionItem[];
}

const questionTypeLabels: Record<QuestionType, string> = {
  singleChoice: '单选题',
  multipleChoice: '多选题',
  blank: '填空题',
  judgement: '判断题',
  problem: '解答题',
  rawLatex: '原始 LaTeX',
};

const scoreWarningCodes = new Set([
  'score_points_missing',
  'score_total_mismatch',
  'score_level_max_mismatch',
  'zero_additive_score_mark',
  'subquestion_score_total_mismatch',
]);

export function buildOutlineNavigation(document: ExamDocument): OutlineNavigationModel {
  const stats = calculateDocumentStats(document);
  const questionNumbers = resolveQuestionNumbers(document);

  return {
    stats,
    sections: document.sections.map((section, sectionIndex) => ({
      id: section.id,
      title: section.title,
      numberLabel: `${toChineseSectionNumber(sectionIndex + 1)}、`,
      scoreSummary: formatOutlineSectionScoreSummary(section),
      questions: section.questions.map((question, questionIndex) => {
        const questionNumber = questionNumbers.get(question.id)?.number ?? questionIndex + 1;
        return buildOutlineQuestionItem(section.id, question, questionNumber);
      }),
    })),
  };
}

export function getVisibleOutlineBadges(
  badges: OutlineBadge[],
  maxVisible = 2,
): VisibleOutlineBadges {
  const sortedBadges = [...badges].sort((left, right) => left.priority - right.priority);

  return {
    visible: sortedBadges.slice(0, maxVisible),
    hiddenCount: Math.max(0, sortedBadges.length - maxVisible),
  };
}

function buildOutlineQuestionItem(
  sectionId: string,
  question: ExamQuestion,
  number: number,
): OutlineQuestionItem {
  return {
    id: question.id,
    sectionId,
    number,
    typeLabel: questionTypeLabels[question.type],
    pointsLabel: question.points !== undefined ? `${question.points}分` : '未设分值',
    detailLabels: getQuestionDetailLabels(question),
    badges: getQuestionBadges(question),
  };
}

function formatOutlineSectionScoreSummary(section: ExamSection): string {
  const { questionCount, totalPoints, commonPoints } = calculateSectionStats(section);

  if (questionCount === 0) {
    return '暂无题目';
  }

  if (commonPoints !== undefined) {
    return `${questionCount} 题 · 每小题 ${commonPoints} 分 · 共 ${totalPoints} 分`;
  }

  return `${questionCount} 题 · 共 ${totalPoints} 分`;
}

function getQuestionDetailLabels(question: ExamQuestion): string[] {
  switch (question.type) {
    case 'singleChoice':
    case 'multipleChoice':
      return [];
    case 'blank': {
      const blankCount = question.blanks?.length ?? 0;
      return blankCount > 0 ? [`${blankCount} 空`] : [];
    }
    case 'judgement':
      return [];
    case 'problem': {
      const subQuestionCount = question.subQuestionGroup?.items.length ?? 0;
      return subQuestionCount > 0 ? [`${subQuestionCount} 小题`] : [];
    }
    case 'rawLatex':
      return [];
  }
}

function getQuestionBadges(question: ExamQuestion): OutlineBadge[] {
  const badges: OutlineBadge[] = [];
  const diagnostics = reviewQuestionScoreMarks(question);

  if (question.type === 'singleChoice' || question.type === 'multipleChoice') {
    badges.push({
      label: (question.correctChoiceIds?.length ?? 0) > 0 ? '已设答案' : '未设答案',
      tone: (question.correctChoiceIds?.length ?? 0) > 0 ? 'info' : 'warning',
      priority: (question.correctChoiceIds?.length ?? 0) > 0 ? 50 : 10,
    });
  }

  if (question.type === 'blank' && (question.blanks?.length ?? 0) > 0) {
    const hasMissingAnswer = (question.blanks ?? []).some(isBlankAnswerEmpty);
    badges.push({
      label: hasMissingAnswer ? '未设答案' : '已设答案',
      tone: hasMissingAnswer ? 'warning' : 'info',
      priority: hasMissingAnswer ? 10 : 50,
    });
  }

  if (question.type === 'judgement') {
    const hasAnswer = question.judgement?.correctAnswer !== undefined;
    badges.push({
      label: hasAnswer ? '已设答案' : '未设答案',
      tone: hasAnswer ? 'info' : 'warning',
      priority: hasAnswer ? 50 : 10,
    });
  }

  if (diagnostics.some((diagnostic) => scoreWarningCodes.has(diagnostic.code))) {
    badges.push({ label: '分值需确认', tone: 'warning', priority: 20 });
  }

  if (diagnostics.some((diagnostic) => diagnostic.code === 'partial_subquestion_score_marks')) {
    badges.push({ label: '部分小题缺评分', tone: 'warning', priority: 30 });
  }

  if (questionHasSolution(question)) {
    badges.push({ label: '有解析', tone: 'info', priority: 60 });
  }

  const scoreMode = getQuestionScoreMode(question);
  if (scoreMode) {
    badges.push({
      label: scoreMode === 'levels' ? '有评分档' : '有评分点',
      tone: 'info',
      priority: scoreMode === 'levels' ? 70 : 80,
    });
  }

  return badges;
}

function isBlankAnswerEmpty(blank: BlankSlot): boolean {
  const answer = blank.answer ?? [];

  return !hasRichContent(answer);
}

function questionHasSolution(question: ExamQuestion): boolean {
  return Boolean(
    hasRichContent(question.solution ?? []) ||
    question.subQuestionGroup?.items.some((item) => hasRichContent(item.solution ?? [])),
  );
}

function getQuestionScoreMode(question: ExamQuestion): ScoreMode | null {
  if ((question.scoreMarks?.length ?? 0) > 0) {
    return question.scoreMode ?? 'additive';
  }

  const subQuestions = question.subQuestionGroup?.items ?? [];
  const subQuestionWithScoreMarks = subQuestions.find((item) => (item.scoreMarks?.length ?? 0) > 0);

  if (!subQuestionWithScoreMarks) {
    return null;
  }

  return subQuestionWithScoreMarks.scoreMode ?? 'additive';
}

function hasRichContent(blocks: RichContentBlock[]): boolean {
  return blocks.some(blockHasContent);
}

function blockHasContent(block: RichContentBlock): boolean {
  switch (block.type) {
    case 'paragraph':
      return block.children.some((child) => {
        switch (child.type) {
          case 'text':
          case 'inlineMath':
          case 'rawLatex':
            return child.type === 'text'
              ? child.text.trim().length > 0
              : child.latex.trim().length > 0;
          case 'blankRef':
          case 'choiceParenRef':
          case 'judgementRef':
          case 'scoreRef':
          case 'annotationRef':
          case 'stemLine':
            return true;
        }
      });
    case 'displayMath':
    case 'rawLatex':
      return block.latex.trim().length > 0;
    case 'list':
      return block.items.some(hasRichContent);
    case 'textFigure':
      return hasRichContent(block.text) || figureBlockHasContent(block);
    case 'image':
      return block.assetId.trim().length > 0;
    case 'figureGroup':
      return block.items.some((item) => figureBlockHasContent(item.figure));
  }
}

function figureBlockHasContent(
  block: ImageBlock | FigureGroupBlock | RawLatexBlock | TextFigureBlock,
): boolean {
  switch (block.type) {
    case 'image':
      return block.assetId.trim().length > 0;
    case 'figureGroup':
      return block.items.some((item) => figureBlockHasContent(item.figure));
    case 'rawLatex':
      return block.latex.trim().length > 0;
    case 'textFigure':
      return hasRichContent(block.text) || figureBlockHasContent(block.figure);
  }
}

function toChineseSectionNumber(value: number): string {
  const numerals = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

  if (value <= 10) {
    return numerals[value] ?? String(value);
  }

  if (value < 20) {
    return `十${numerals[value - 10]}`;
  }

  const tens = Math.floor(value / 10);
  const ones = value % 10;

  return `${numerals[tens] ?? tens}十${ones === 0 ? '' : numerals[ones]}`;
}
