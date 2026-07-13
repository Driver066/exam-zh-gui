import {
  getScoreItemLabel,
  reviewQuestionScoreMarks,
  stringifyRichContentBlocks,
  type ExamDocument,
  type ExamQuestion,
  type RichContentBlock,
} from '../../shared/document';
import { getResolvedChoiceAnswerLabel, resolveChoiceLayout } from './choice-layout-options';

export type QuestionEditorTabId = 'answer' | 'settings' | 'teacher';
export type QuestionEditorTabState = Readonly<Record<string, QuestionEditorTabId | undefined>>;
export type QuestionSummaryTone = 'neutral' | 'warning';

export interface QuestionEditorTabDescriptor {
  id: QuestionEditorTabId;
  label: string;
  summary: string;
  tooltip: string;
  tone: QuestionSummaryTone;
}

export interface QuestionSummaryPart {
  key: string;
  label?: string;
  blocks?: RichContentBlock[];
  text?: string;
  tone?: QuestionSummaryTone;
}

export interface QuestionEditorSummary {
  stemBlocks?: RichContentBlock[];
  stemText?: string;
  answerLead: string;
  answerParts: QuestionSummaryPart[];
  tone: QuestionSummaryTone;
}

export function toggleExpandedQuestionId(
  expandedQuestionId: string | null,
  questionId: string,
): string | null {
  return expandedQuestionId === questionId ? null : questionId;
}

export function getAvailableQuestionEditorTabs(
  question: ExamQuestion,
): readonly QuestionEditorTabId[] {
  return question.type === 'rawLatex'
    ? (['settings', 'teacher'] as const)
    : (['answer', 'settings', 'teacher'] as const);
}

export function getDefaultQuestionEditorTab(question: ExamQuestion): QuestionEditorTabId {
  return question.type === 'rawLatex' ? 'settings' : 'answer';
}

export function resolveQuestionEditorTab(
  state: QuestionEditorTabState,
  question: ExamQuestion,
): QuestionEditorTabId {
  const stored = state[question.id];
  return stored && getAvailableQuestionEditorTabs(question).includes(stored)
    ? stored
    : getDefaultQuestionEditorTab(question);
}

export function setQuestionEditorTab(
  state: QuestionEditorTabState,
  question: ExamQuestion,
  tabId: QuestionEditorTabId,
): QuestionEditorTabState {
  const resolvedTab = getAvailableQuestionEditorTabs(question).includes(tabId)
    ? tabId
    : getDefaultQuestionEditorTab(question);

  return { ...state, [question.id]: resolvedTab };
}

export function removeQuestionEditorTabState(
  state: QuestionEditorTabState,
  questionId: string,
): QuestionEditorTabState {
  if (!(questionId in state)) return state;

  const next = { ...state };
  delete next[questionId];
  return next;
}

export function getQuestionEditorTabKeyboardTarget(
  availableTabs: readonly QuestionEditorTabId[],
  currentTab: QuestionEditorTabId,
  key: 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End',
): QuestionEditorTabId {
  if (availableTabs.length === 0) return currentTab;
  if (key === 'Home') return availableTabs[0] ?? currentTab;
  if (key === 'End') return availableTabs[availableTabs.length - 1] ?? currentTab;

  const currentIndex = Math.max(0, availableTabs.indexOf(currentTab));
  const offset = key === 'ArrowRight' ? 1 : -1;
  const targetIndex = (currentIndex + offset + availableTabs.length) % availableTabs.length;
  return availableTabs[targetIndex] ?? currentTab;
}

export function getNewQuestionStemSelection(question: ExamQuestion): {
  start: number;
  end: number;
} {
  const text = stringifyRichContentBlocks(
    question.stem,
    question.blanks?.map((blank) => blank.id),
  );

  if (question.type === 'blank') {
    const placeholderIndex = text.indexOf('{{第1空}}');
    return { start: 0, end: placeholderIndex >= 0 ? placeholderIndex : text.length };
  }

  return { start: 0, end: text.length };
}

export function buildQuestionEditorSummary(
  document: Pick<ExamDocument, 'setup' | 'examZh'>,
  question: ExamQuestion,
): QuestionEditorSummary {
  const stem =
    question.type === 'rawLatex'
      ? { stemText: question.rawLatex?.trim() || '原始 LaTeX 内容' }
      : { stemBlocks: question.stem };

  switch (question.type) {
    case 'singleChoice':
    case 'multipleChoice': {
      const choices = question.choices ?? [];
      const correctIds = question.correctChoiceIds ?? [];
      const layout = resolveChoiceLayout(document, question);
      const correctIdSet = new Set(correctIds);
      const answerParts: QuestionSummaryPart[] = choices
        .map((choice, index) => ({ choice, index }))
        .filter(({ choice }) => correctIdSet.has(choice.id))
        .map(({ choice, index }) => {
          const hasContent = hasRichContent(choice.content);
          return {
            key: choice.id,
            label: `${getResolvedChoiceAnswerLabel(question, index, layout)}：`,
            blocks: hasContent ? choice.content : undefined,
            text: hasContent ? undefined : '内容为空',
            tone: hasContent ? ('neutral' as const) : ('warning' as const),
          };
        });
      const invalidCount = correctIds.filter(
        (choiceId) => !choices.some((choice) => choice.id === choiceId),
      ).length;

      if (correctIds.length === 0) {
        return {
          ...stem,
          answerLead: `${choices.length} 个选项`,
          answerParts: [{ key: 'missing', text: '未设答案', tone: 'warning' }],
          tone: 'warning',
        };
      }

      if (invalidCount > 0) {
        answerParts.push({
          key: 'invalid',
          text: `${invalidCount} 个答案引用失效`,
          tone: 'warning',
        });
      }

      return {
        ...stem,
        answerLead: `${choices.length} 个选项 · 答案`,
        answerParts,
        tone: answerParts.some((part) => part.tone === 'warning') ? 'warning' : 'neutral',
      };
    }

    case 'blank': {
      const blanks = question.blanks ?? [];
      const answerParts = blanks.map((blank, index) => {
        const hasAnswer = hasRichContent(blank.answer);
        return {
          key: blank.id,
          label: blanks.length > 1 ? `第 ${index + 1} 空：` : undefined,
          blocks: hasAnswer ? blank.answer : undefined,
          text: hasAnswer ? undefined : '未设置',
          tone: hasAnswer ? ('neutral' as const) : ('warning' as const),
        };
      });

      return {
        ...stem,
        answerLead: `${blanks.length} 空 · 答案`,
        answerParts,
        tone: answerParts.some((part) => part.tone === 'warning') ? 'warning' : 'neutral',
      };
    }

    case 'judgement': {
      const correctAnswer = question.judgement?.correctAnswer;
      if (correctAnswer === undefined) {
        return {
          ...stem,
          answerLead: '判断答案',
          answerParts: [{ key: 'missing', text: '未设答案', tone: 'warning' }],
          tone: 'warning',
        };
      }

      const text =
        question.judgement?.answerStyle === 'symbol'
          ? correctAnswer
            ? '正确（✓）'
            : '错误（×）'
          : correctAnswer
            ? '正确'
            : '错误';
      return {
        ...stem,
        answerLead: '答案',
        answerParts: [{ key: 'answer', text }],
        tone: 'neutral',
      };
    }

    case 'problem': {
      const items = question.subQuestionGroup?.items ?? [];
      const incompleteCount =
        items.length > 0
          ? items.filter((item) => !hasRichContent(item.solution)).length
          : hasRichContent(question.solution)
            ? 0
            : 1;
      const prefix = items.length > 0 ? `${items.length} 小题` : '解答题';
      return {
        ...stem,
        answerLead: prefix,
        answerParts: [
          {
            key: 'completion',
            text:
              incompleteCount === 0
                ? '解答已填写'
                : items.length > 0
                  ? `${incompleteCount} 个小题待完善`
                  : '解答待填写',
            tone: incompleteCount > 0 ? 'warning' : 'neutral',
          },
        ],
        tone: incompleteCount > 0 ? 'warning' : 'neutral',
      };
    }

    case 'rawLatex':
      return {
        ...stem,
        answerLead: '原始 LaTeX 内容',
        answerParts: [],
        tone: 'neutral',
      };
  }
}

export function buildQuestionEditorTabDescriptors(
  document: Pick<ExamDocument, 'setup' | 'examZh'>,
  question: ExamQuestion,
  contentWarnings: Readonly<Record<string, string>> = {},
): QuestionEditorTabDescriptor[] {
  const descriptors: QuestionEditorTabDescriptor[] = [];

  if (question.type !== 'rawLatex') {
    descriptors.push(buildAnswerTabDescriptor(document, question, contentWarnings));
  }

  descriptors.push(buildSettingsTabDescriptor(question));
  descriptors.push(buildTeacherTabDescriptor(question, contentWarnings));
  return descriptors;
}

function buildAnswerTabDescriptor(
  document: Pick<ExamDocument, 'setup' | 'examZh'>,
  question: ExamQuestion,
  contentWarnings: Readonly<Record<string, string>>,
): QuestionEditorTabDescriptor {
  const summary = buildQuestionEditorSummary(document, question);
  const tooltipParts = [formatAnswerSummaryTooltip(summary)];
  let warningSummary: string | null = null;

  switch (question.type) {
    case 'singleChoice':
    case 'multipleChoice': {
      const choices = question.choices ?? [];
      const correctIds = question.correctChoiceIds ?? [];
      const invalidCount = correctIds.filter(
        (choiceId) => !choices.some((choice) => choice.id === choiceId),
      ).length;
      const emptyAnswerCount = choices.filter(
        (choice) => correctIds.includes(choice.id) && !hasRichContent(choice.content),
      ).length;
      const warnings = collectWarnings(
        contentWarnings,
        choices.map((choice) => `${question.id}:choice:${choice.id}`),
      );

      if (invalidCount > 0) warningSummary = '答案引用失效';
      else if (emptyAnswerCount > 0) warningSummary = '答案内容为空';
      else if (warnings.length > 0) warningSummary = '内容需检查';
      else if (correctIds.length === 0) warningSummary = '未设答案';

      tooltipParts.push(...warnings);
      break;
    }

    case 'blank': {
      const blanks = question.blanks ?? [];
      const missingCount = blanks.filter((blank) => !hasRichContent(blank.answer)).length;
      const warnings = collectWarnings(
        contentWarnings,
        blanks.map((blank) => `${question.id}:blank:${blank.id}:answer`),
      );

      if (warnings.length > 0) warningSummary = '内容需检查';
      else if (missingCount > 0) warningSummary = `${missingCount} 空未设置`;

      tooltipParts.push(...warnings);
      break;
    }

    case 'judgement':
      if (question.judgement?.correctAnswer === undefined) warningSummary = '未设答案';
      break;

    case 'problem': {
      const items = question.subQuestionGroup?.items ?? [];
      const incompleteCount =
        items.length > 0
          ? items.filter((item) => !hasRichContent(item.solution)).length
          : hasRichContent(question.solution)
            ? 0
            : 1;
      const warnings = collectWarnings(
        contentWarnings,
        items.flatMap((item) => [`${item.id}:stem`, `${item.id}:solution`]),
      );

      if (warnings.length > 0) warningSummary = '内容需检查';
      else if (incompleteCount > 0) {
        warningSummary = items.length > 0 ? `${incompleteCount} 小题待完善` : '解答待填写';
      }

      tooltipParts.push(...warnings);
      break;
    }

    case 'rawLatex':
      break;
  }

  return {
    id: 'answer',
    label: question.type === 'problem' ? '小题内容' : '答案内容',
    summary: warningSummary ?? getAnswerTabNormalSummary(question),
    tooltip: joinTooltipParts(tooltipParts),
    tone: warningSummary ? 'warning' : 'neutral',
  };
}

function buildSettingsTabDescriptor(question: ExamQuestion): QuestionEditorTabDescriptor {
  const missingPoints = question.points === undefined;
  return {
    id: 'settings',
    label: '题目设置',
    summary: missingPoints ? '未设分值' : `${question.points} 分`,
    tooltip: missingPoints ? '题目尚未设置分值。' : `题目分值：${question.points} 分。`,
    tone: missingPoints ? 'warning' : 'neutral',
  };
}

function buildTeacherTabDescriptor(
  question: ExamQuestion,
  contentWarnings: Readonly<Record<string, string>>,
): QuestionEditorTabDescriptor {
  const scoreDiagnostics = reviewQuestionScoreMarks(question);
  const solutionWarning = contentWarnings[`${question.id}:solution`];
  const hasSolution = hasRichContent(question.solution);
  const scoreMarks = question.scoreMarks ?? [];
  const annotationCount = question.solutionAnnotations?.length ?? 0;
  const teacherItemCount = scoreMarks.length + annotationCount;
  const normalSummary =
    teacherItemCount > 0
      ? `${hasSolution ? '有解析' : '无解析'} · ${teacherItemCount} 项`
      : hasSolution
        ? '有解析'
        : '尚未填写';
  const warningSummary =
    scoreDiagnostics.length > 0 ? '评分需确认' : solutionWarning ? '解析需检查' : null;
  const tooltipParts = [
    `解析：${hasSolution ? '已填写' : '未填写'}`,
    scoreMarks.length > 0
      ? `评分：${scoreMarks.length} 个${getScoreItemLabel(question.scoreMode)}`
      : '评分：未设置',
    annotationCount > 0 ? `解析批注：${annotationCount} 条` : '解析批注：无',
    ...scoreDiagnostics.map((diagnostic) => diagnostic.message),
    ...(solutionWarning ? [solutionWarning] : []),
  ];

  return {
    id: 'teacher',
    label: '解析与评分',
    summary: warningSummary ?? normalSummary,
    tooltip: joinTooltipParts(tooltipParts),
    tone: warningSummary ? 'warning' : 'neutral',
  };
}

function getAnswerTabNormalSummary(question: ExamQuestion): string {
  switch (question.type) {
    case 'singleChoice':
    case 'multipleChoice':
      return `${question.choices?.length ?? 0} 个选项`;
    case 'blank':
      return `${question.blanks?.length ?? 0} 空`;
    case 'judgement':
      return '已设答案';
    case 'problem': {
      const count = question.subQuestionGroup?.items.length ?? 0;
      return count > 0 ? `${count} 小题` : '整题解答';
    }
    case 'rawLatex':
      return '原始 LaTeX';
  }
}

function formatAnswerSummaryTooltip(summary: QuestionEditorSummary): string {
  const answerParts = summary.answerParts.map((part) => {
    const content = part.blocks ? stringifyRichContentBlocks(part.blocks).trim() : part.text;
    return `${part.label ?? ''}${content ?? ''}`.trim();
  });
  return [summary.answerLead, ...answerParts].filter(Boolean).join('；');
}

function collectWarnings(
  contentWarnings: Readonly<Record<string, string>>,
  keys: readonly string[],
): string[] {
  return [
    ...new Set(
      keys
        .map((key) => contentWarnings[key]?.trim())
        .filter((warning): warning is string => Boolean(warning)),
    ),
  ];
}

function joinTooltipParts(parts: readonly string[]): string {
  const normalized = parts
    .map((part) => part.trim().replace(/[；。！？;.!?]+$/u, ''))
    .filter(Boolean);

  return normalized.length > 0 ? `${normalized.join('；')}。` : '';
}

function hasRichContent(blocks: RichContentBlock[] | undefined): boolean {
  return stringifyRichContentBlocks(blocks).trim().length > 0;
}
