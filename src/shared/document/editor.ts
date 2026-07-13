import type {
  BlankSlot,
  ChoiceOption,
  ExamDocument,
  ExamQuestion,
  ExamSection,
  ExamSectionKind,
  InformationField,
  QuestionType,
  RichContentBlock,
  ScoreMark,
  ScoreMode,
  SolutionAnnotation,
  SubQuestion,
} from './model';
import {
  collectAnnotationReferenceIds,
  collectScoreReferenceIds,
  isScoreLevelOrderDescending,
  stringifyInlineRichText,
} from './teacher-content';

export type CreateId = (prefix: string) => string;

export function createDefaultSection(
  createId: CreateId,
  kind: ExamSectionKind = 'custom',
): ExamSection {
  return {
    id: createId('section'),
    title: defaultSectionTitle(kind),
    kind,
    summaryMode: 'questionCountAndPoints',
    questions: [],
  };
}

export function createDefaultQuestion(type: QuestionType, createId: CreateId): ExamQuestion {
  const question: ExamQuestion = {
    id: createId('question'),
    type,
    points: type === 'problem' ? 12 : 5,
    stem: paragraphBlocks(defaultStemText(type)),
  };

  if (type === 'singleChoice' || type === 'multipleChoice') {
    question.choices = ['A', 'B', 'C', 'D'].map((label) =>
      createChoiceOption(createId, label, `选项 ${label}`),
    );
    question.correctChoiceIds = type === 'singleChoice' ? [question.choices[0]!.id] : undefined;
  }

  if (type === 'blank') {
    const blank = createBlankSlot(createId);
    question.blanks = [blank];
    question.stem = [
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: '请填写：' },
          { type: 'blankRef', blankId: blank.id },
        ],
      },
    ];
  }

  if (type === 'problem') {
    question.subQuestionGroup = {
      exportAs: 'enumerate',
      listKind: 'enumerate',
      items: [],
    };
  }

  return question;
}

export function createChoiceOption(createId: CreateId, label: string, text = ''): ChoiceOption {
  return {
    id: createId('choice'),
    label,
    content: paragraphBlocks(text),
  };
}

export interface DuplicateChoiceOptionResult {
  question: ExamQuestion;
  choiceId: string | null;
}

export function moveChoiceOption(
  question: ExamQuestion,
  choiceId: string,
  direction: 'up' | 'down',
): ExamQuestion {
  const choices = question.choices ?? [];
  const sourceIndex = choices.findIndex((choice) => choice.id === choiceId);
  const destinationIndex = direction === 'up' ? sourceIndex - 1 : sourceIndex + 1;

  if (sourceIndex < 0 || destinationIndex < 0 || destinationIndex >= choices.length) {
    return question;
  }

  const usePositionalLabels = hasDefaultChoiceLabels(choices);
  const nextChoices = moveItem(choices, sourceIndex, destinationIndex);

  return withChoices(
    question,
    usePositionalLabels ? applyDefaultChoiceLabels(nextChoices) : nextChoices,
  );
}

export function duplicateChoiceOptionWithResult(
  question: ExamQuestion,
  choiceId: string,
  createId: CreateId,
): DuplicateChoiceOptionResult {
  const choices = question.choices ?? [];
  const sourceIndex = choices.findIndex((choice) => choice.id === choiceId);

  if (sourceIndex < 0) {
    return { question, choiceId: null };
  }

  const usePositionalLabels = hasDefaultChoiceLabels(choices);
  const duplicate: ChoiceOption = {
    ...clone(choices[sourceIndex]!),
    id: createId('choice'),
    label: nextChoiceLabel(choices),
  };
  const nextChoices = [
    ...choices.slice(0, sourceIndex + 1),
    duplicate,
    ...choices.slice(sourceIndex + 1),
  ];

  return {
    choiceId: duplicate.id,
    question: withChoices(
      question,
      usePositionalLabels ? applyDefaultChoiceLabels(nextChoices) : nextChoices,
    ),
  };
}

export function removeChoiceOption(question: ExamQuestion, choiceId: string): ExamQuestion {
  const choices = question.choices ?? [];

  if (!choices.some((choice) => choice.id === choiceId)) {
    return question;
  }

  const usePositionalLabels = hasDefaultChoiceLabels(choices);
  const nextChoices = choices.filter((choice) => choice.id !== choiceId);

  return withChoices(
    question,
    usePositionalLabels ? applyDefaultChoiceLabels(nextChoices) : nextChoices,
  );
}

export function nextChoiceLabel(choices: ChoiceOption[]): string {
  const usedLabels = new Set(choices.flatMap((choice) => [choice.id, choice.label ?? choice.id]));

  for (let index = 0; index < 26; index += 1) {
    const label = defaultChoiceLabel(index);
    if (!usedLabels.has(label)) return label;
  }

  return `X${choices.length + 1}`;
}

export function createBlankSlot(createId: CreateId): BlankSlot {
  return {
    id: createId('blank'),
    command: 'fillin',
    width: '3em',
    type: 'line',
  };
}

export function createSubQuestion(createId: CreateId): SubQuestion {
  return {
    id: createId('subquestion'),
    stem: paragraphBlocks('小题题干'),
  };
}

export interface AddSubQuestionResult {
  question: ExamQuestion;
  migratedWholeScoreMarks: boolean;
}

export interface DuplicateSubQuestionResult {
  question: ExamQuestion;
  subQuestionId: string | null;
}

export function addSubQuestionToProblem(
  question: ExamQuestion,
  subQuestion: SubQuestion,
): AddSubQuestionResult {
  const items = question.subQuestionGroup?.items ?? [];
  const shouldMigrateScoreMarks = items.length === 0 && (question.scoreMarks?.length ?? 0) > 0;
  const nextSubQuestion = shouldMigrateScoreMarks
    ? {
        ...subQuestion,
        scoreMode: question.scoreMode ?? 'additive',
        scoreMarks: question.scoreMarks,
      }
    : subQuestion;

  return {
    migratedWholeScoreMarks: shouldMigrateScoreMarks,
    question: {
      ...question,
      scoreMode: shouldMigrateScoreMarks ? undefined : question.scoreMode,
      scoreMarks: shouldMigrateScoreMarks ? [] : question.scoreMarks,
      subQuestionGroup: {
        exportAs: 'enumerate',
        listKind: 'enumerate',
        ...question.subQuestionGroup,
        items: [...items, nextSubQuestion],
      },
    },
  };
}

export function moveSubQuestion(
  question: ExamQuestion,
  subQuestionId: string,
  direction: 'up' | 'down',
): ExamQuestion {
  const items = question.subQuestionGroup?.items ?? [];
  const sourceIndex = items.findIndex((item) => item.id === subQuestionId);
  const destinationIndex = direction === 'up' ? sourceIndex - 1 : sourceIndex + 1;

  if (sourceIndex < 0 || destinationIndex < 0 || destinationIndex >= items.length) {
    return question;
  }

  return withSubQuestions(question, moveItem(items, sourceIndex, destinationIndex));
}

export function updateSubQuestion(
  question: ExamQuestion,
  subQuestionId: string,
  updater: (subQuestion: SubQuestion) => SubQuestion,
): ExamQuestion {
  const items = question.subQuestionGroup?.items ?? [];

  if (!items.some((item) => item.id === subQuestionId)) {
    return question;
  }

  return withSubQuestions(
    question,
    items.map((item) => (item.id === subQuestionId ? updater(item) : item)),
  );
}

export function duplicateSubQuestionWithResult(
  question: ExamQuestion,
  subQuestionId: string,
  createId: CreateId,
): DuplicateSubQuestionResult {
  const items = question.subQuestionGroup?.items ?? [];
  const sourceIndex = items.findIndex((item) => item.id === subQuestionId);

  if (sourceIndex < 0) {
    return { question, subQuestionId: null };
  }

  const source = items[sourceIndex]!;
  const teacherContent = duplicateTeacherContent(
    source.solution,
    source.scoreMarks,
    source.solutionAnnotations,
    createId,
  );
  const duplicate: SubQuestion = {
    ...clone(source),
    id: createId('subquestion'),
    solution: teacherContent.solution,
    scoreMarks: teacherContent.scoreMarks,
    solutionAnnotations: teacherContent.annotations,
  };

  return {
    subQuestionId: duplicate.id,
    question: withSubQuestions(question, [
      ...items.slice(0, sourceIndex + 1),
      duplicate,
      ...items.slice(sourceIndex + 1),
    ]),
  };
}

export function removeSubQuestion(question: ExamQuestion, subQuestionId: string): ExamQuestion {
  const items = question.subQuestionGroup?.items ?? [];

  if (!items.some((item) => item.id === subQuestionId)) {
    return question;
  }

  return withSubQuestions(
    question,
    items.filter((item) => item.id !== subQuestionId),
  );
}

export function createScoreMark(createId: CreateId): ScoreMark {
  return {
    id: createId('score'),
    points: 1,
  };
}

export function paragraphBlocks(text: string): RichContentBlock[] {
  return [
    {
      type: 'paragraph',
      children: [{ type: 'text', text }],
    },
  ];
}

export function createNoticeBlock(text = '新的注意事项'): RichContentBlock {
  return {
    type: 'paragraph',
    children: [{ type: 'text', text }],
  };
}

export function createInformationField(label = '姓名：'): InformationField {
  return {
    label,
    kind: 'line',
    width: '6em',
  };
}

export function addInformationField(
  fields: InformationField[],
  field = createInformationField(),
): InformationField[] {
  return [...fields, field];
}

export function removeInformationField(
  fields: InformationField[],
  index: number,
): InformationField[] {
  return fields.filter((_, currentIndex) => currentIndex !== index);
}

export function moveInformationField(
  fields: InformationField[],
  index: number,
  direction: 'up' | 'down',
): InformationField[] {
  return moveByIndex(fields, index, direction);
}

export function replaceInformationField(
  fields: InformationField[],
  index: number,
  field: InformationField,
): InformationField[] {
  return fields.map((current, currentIndex) => (currentIndex === index ? field : current));
}

export function addSection(document: ExamDocument, section: ExamSection): ExamDocument {
  return {
    ...document,
    sections: [...document.sections, section],
  };
}

export function insertSectionAt(
  document: ExamDocument,
  section: ExamSection,
  index: number,
): ExamDocument {
  const normalizedIndex = Math.max(
    0,
    Math.min(document.sections.length, Number.isFinite(index) ? Math.trunc(index) : 0),
  );

  return {
    ...document,
    sections: [
      ...document.sections.slice(0, normalizedIndex),
      section,
      ...document.sections.slice(normalizedIndex),
    ],
  };
}

export function updateSection(
  document: ExamDocument,
  sectionId: string,
  updater: (section: ExamSection) => ExamSection,
): ExamDocument {
  return {
    ...document,
    sections: document.sections.map((section) =>
      section.id === sectionId ? updater(section) : section,
    ),
  };
}

export function removeSection(document: ExamDocument, sectionId: string): ExamDocument {
  return {
    ...document,
    sections: document.sections.filter((section) => section.id !== sectionId),
  };
}

export function moveSection(
  document: ExamDocument,
  sectionId: string,
  direction: 'up' | 'down',
): ExamDocument {
  return {
    ...document,
    sections: moveById(document.sections, sectionId, direction),
  };
}

export function duplicateSection(
  document: ExamDocument,
  sectionId: string,
  createId: CreateId,
): ExamDocument {
  const index = document.sections.findIndex((section) => section.id === sectionId);

  if (index === -1) {
    return document;
  }

  const duplicate: ExamSection = {
    ...clone(document.sections[index]),
    id: createId('section'),
    title: `${document.sections[index].title} 副本`,
    questions: document.sections[index].questions.map((question) =>
      duplicateQuestionData(question, createId),
    ),
  };

  return {
    ...document,
    sections: [
      ...document.sections.slice(0, index + 1),
      duplicate,
      ...document.sections.slice(index + 1),
    ],
  };
}

export function addQuestion(
  document: ExamDocument,
  sectionId: string,
  question: ExamQuestion,
): ExamDocument {
  return updateSection(document, sectionId, (section) => ({
    ...section,
    questions: [...section.questions, question],
  }));
}

export function updateQuestion(
  document: ExamDocument,
  sectionId: string,
  questionId: string,
  updater: (question: ExamQuestion) => ExamQuestion,
): ExamDocument {
  return updateSection(document, sectionId, (section) => ({
    ...section,
    questions: section.questions.map((question) =>
      question.id === questionId ? updater(question) : question,
    ),
  }));
}

export function removeQuestion(
  document: ExamDocument,
  sectionId: string,
  questionId: string,
): ExamDocument {
  return updateSection(document, sectionId, (section) => ({
    ...section,
    questions: section.questions.filter((question) => question.id !== questionId),
  }));
}

export function resolveQuestionSelectionAfterDelete(
  section: Pick<ExamSection, 'questions'>,
  questionId: string,
): string | null {
  const index = section.questions.findIndex((question) => question.id === questionId);

  if (index === -1) {
    return null;
  }

  return section.questions[index + 1]?.id ?? section.questions[index - 1]?.id ?? null;
}

export function moveQuestion(
  document: ExamDocument,
  sectionId: string,
  questionId: string,
  direction: 'up' | 'down',
): ExamDocument {
  return updateSection(document, sectionId, (section) => ({
    ...section,
    questions: moveById(section.questions, questionId, direction),
  }));
}

export function duplicateQuestion(
  document: ExamDocument,
  sectionId: string,
  questionId: string,
  createId: CreateId,
): ExamDocument {
  return duplicateQuestionWithResult(document, sectionId, questionId, createId).document;
}

export interface DuplicateQuestionResult {
  document: ExamDocument;
  duplicatedQuestionId: string | null;
}

export function duplicateQuestionWithResult(
  document: ExamDocument,
  sectionId: string,
  questionId: string,
  createId: CreateId,
): DuplicateQuestionResult {
  let duplicatedQuestionId: string | null = null;
  const nextDocument = updateSection(document, sectionId, (section) => {
    const index = section.questions.findIndex((question) => question.id === questionId);

    if (index === -1) {
      return section;
    }

    const duplicate = duplicateQuestionData(section.questions[index], createId);
    duplicatedQuestionId = duplicate.id;

    return {
      ...section,
      questions: [
        ...section.questions.slice(0, index + 1),
        duplicate,
        ...section.questions.slice(index + 1),
      ],
    };
  });

  return { document: nextDocument, duplicatedQuestionId };
}

export function appendBlankRefToStem(question: ExamQuestion, blankId: string): ExamQuestion {
  const stem = [...question.stem];
  const lastBlock = stem[stem.length - 1];

  if (lastBlock?.type === 'paragraph') {
    stem[stem.length - 1] = {
      ...lastBlock,
      children: [...lastBlock.children, { type: 'text', text: ' ' }, { type: 'blankRef', blankId }],
    };
  } else {
    stem.push({
      type: 'paragraph',
      children: [{ type: 'blankRef', blankId }],
    });
  }

  return { ...question, stem };
}

export function removeBlankFromQuestion(question: ExamQuestion, blankId: string): ExamQuestion {
  if (!(question.blanks ?? []).some((blank) => blank.id === blankId)) {
    return question;
  }

  return {
    ...question,
    blanks: (question.blanks ?? []).filter((blank) => blank.id !== blankId),
    stem: removeBlankRefsFromBlocks(question.stem, blankId),
  };
}

export function setBlankAnswer(
  question: ExamQuestion,
  blankId: string,
  value: RichContentBlock[],
): ExamQuestion {
  return {
    ...question,
    blanks: (question.blanks ?? []).map((blank) =>
      blank.id === blankId ? { ...blank, answer: value } : blank,
    ),
  };
}

export function calculateDocumentStats(document: ExamDocument): {
  sectionCount: number;
  questionCount: number;
  totalPoints: number;
} {
  const questions = document.sections.flatMap((section) => section.questions);

  return {
    sectionCount: document.sections.length,
    questionCount: questions.length,
    totalPoints: questions.reduce((sum, question) => sum + (question.points ?? 0), 0),
  };
}

export function calculateSectionStats(section: ExamSection): {
  questionCount: number;
  totalPoints: number;
  commonPoints?: number;
} {
  const points = section.questions.map((question) => question.points ?? 0);
  const totalPoints = points.reduce((sum, point) => sum + point, 0);
  const firstPoint = points[0];
  const hasCommonPoints = points.length > 0 && points.every((point) => point === firstPoint);

  return {
    questionCount: section.questions.length,
    totalPoints,
    commonPoints: hasCommonPoints ? firstPoint : undefined,
  };
}

export function formatSectionSummary(section: ExamSection): string | undefined {
  if (!section.summaryMode || section.summaryMode === 'hidden' || section.questions.length === 0) {
    return undefined;
  }

  const { questionCount, totalPoints, commonPoints } = calculateSectionStats(section);
  if (section.summaryMode === 'questionCount') {
    return `本题共 ${questionCount} 小题。`;
  }

  if (commonPoints !== undefined) {
    return `本题共 ${questionCount} 小题，每小题 ${commonPoints} 分，共 ${totalPoints} 分。`;
  }

  return `本题共 ${questionCount} 小题，共 ${totalPoints} 分。`;
}

export function calculateTotalPointsMismatch(
  document: ExamDocument,
): { configured: number; calculated: number } | null {
  const configured = document.metadata.totalPoints;

  if (configured === undefined) {
    return null;
  }

  const calculated = calculateDocumentStats(document).totalPoints;
  return configured === calculated ? null : { configured, calculated };
}

export function getChoiceDisplayLabel(choice: ChoiceOption): string {
  return choice.label ?? choice.id;
}

export interface ChoiceLabelDraftCommitResult {
  question: ExamQuestion;
  warning?: string;
}

export function commitChoiceLabelDraft(
  question: ExamQuestion,
  choiceIndex: number,
  draftLabel: string,
): ChoiceLabelDraftCommitResult {
  const choices = question.choices ?? [];
  const choice = choices[choiceIndex];

  if (!choice) {
    return { question };
  }

  const fallbackLabel = choice.label ?? choice.id;
  const trimmedLabel = draftLabel.trim();
  const nextLabel = trimmedLabel || fallbackLabel;
  const warning =
    trimmedLabel.length > 0 && nextLabel.length > 1 ? '选项标识建议为 1 个字符。' : undefined;

  if (nextLabel === fallbackLabel) {
    return { question, warning };
  }

  const nextChoices = choices.map((item, index) =>
    index === choiceIndex ? { ...item, label: nextLabel } : item,
  );

  return {
    question: {
      ...question,
      choices: nextChoices,
    },
    warning,
  };
}

export type NumberDraftCommitMode = 'optional' | 'required';

export interface NumberDraftCommitResult {
  value: number | undefined;
  warning?: string;
}

export function commitNumberDraft(
  draftValue: string,
  currentValue: number | undefined,
  mode: NumberDraftCommitMode,
): NumberDraftCommitResult {
  const trimmedValue = draftValue.trim();

  if (trimmedValue.length === 0) {
    return {
      value: mode === 'optional' ? undefined : 0,
    };
  }

  const parsedValue = Number(trimmedValue);

  if (Number.isFinite(parsedValue) && parsedValue >= 0) {
    return { value: parsedValue };
  }

  return mode === 'optional'
    ? {
        value: currentValue,
        warning: '请输入大于或等于 0 的数字，已保留原值。',
      }
    : {
        value: 0,
        warning: '请输入大于或等于 0 的数字，已按 0 处理。',
      };
}

export function addNotice(
  notices: RichContentBlock[],
  notice = createNoticeBlock(),
): RichContentBlock[] {
  return [...notices, notice];
}

export function removeNotice(notices: RichContentBlock[], index: number): RichContentBlock[] {
  return notices.filter((_, currentIndex) => currentIndex !== index);
}

export function moveNotice(
  notices: RichContentBlock[],
  index: number,
  direction: 'up' | 'down',
): RichContentBlock[] {
  return moveByIndex(notices, index, direction);
}

export function replaceNotice(
  notices: RichContentBlock[],
  index: number,
  replacement: RichContentBlock[],
): RichContentBlock[] {
  return [...notices.slice(0, index), ...replacement, ...notices.slice(index + 1)];
}

export function commitNoticeDraft(
  notices: RichContentBlock[],
  index: number,
  blocks: RichContentBlock[],
): RichContentBlock[] {
  return blocks.length === 0 ? removeNotice(notices, index) : replaceNotice(notices, index, blocks);
}

export type ScoreReviewDiagnosticCode =
  | 'score_points_missing'
  | 'score_total_mismatch'
  | 'score_level_max_mismatch'
  | 'zero_additive_score_mark'
  | 'empty_score_note'
  | 'score_level_order'
  | 'inline_score_position_missing'
  | 'inline_annotation_position_missing'
  | 'whole_problem_score_with_subquestions'
  | 'subquestion_score_total_mismatch'
  | 'partial_subquestion_score_marks';

export interface ScoreReviewDiagnostic {
  code: ScoreReviewDiagnosticCode;
  message: string;
}

export function reviewQuestionScoreMarks(question: ExamQuestion): ScoreReviewDiagnostic[] {
  const diagnostics: ScoreReviewDiagnostic[] = [];
  const expectedPoints = question.points;
  const subQuestions = question.subQuestionGroup?.items ?? [];
  const subQuestionsWithScoreMarks = subQuestions.filter(
    (item) => (item.scoreMarks?.length ?? 0) > 0,
  );
  const hasWholeScoreMarks = (question.scoreMarks?.length ?? 0) > 0;

  diagnostics.push(
    ...reviewScoreMarkList({
      ownerLabel: question.type === 'problem' && subQuestions.length > 0 ? '整题' : '题目',
      scoreMode: question.scoreMode,
      scoreMarks: question.scoreMarks ?? [],
      solution: question.solution,
      annotations: question.solutionAnnotations ?? [],
      expectedPoints,
      requireExpectedPoints: true,
    }),
  );

  if (question.type !== 'problem' || subQuestions.length === 0) {
    return diagnostics;
  }

  if (hasWholeScoreMarks) {
    diagnostics.push({
      code: 'whole_problem_score_with_subquestions',
      message: '解答题已有小题时，建议只在小题内设置评分点或评分档。',
    });
  }

  subQuestions.forEach((item, index) => {
    diagnostics.push(
      ...reviewScoreMarkList({
        ownerLabel: `小题 ${index + 1}`,
        scoreMode: item.scoreMode,
        scoreMarks: item.scoreMarks ?? [],
        solution: item.solution,
        annotations: item.solutionAnnotations ?? [],
        expectedPoints: undefined,
        requireExpectedPoints: false,
      }),
    );
  });

  if (expectedPoints !== undefined && subQuestionsWithScoreMarks.length > 0) {
    const subQuestionScoreTotal = subQuestionsWithScoreMarks.reduce(
      (sum, item) =>
        sum + calculateScoreMarksEffectivePoints(item.scoreMarks ?? [], item.scoreMode),
      0,
    );

    if (subQuestionScoreTotal !== expectedPoints) {
      diagnostics.push({
        code: 'subquestion_score_total_mismatch',
        message: `小题评分合计 ${subQuestionScoreTotal} 分，与题目分值 ${expectedPoints} 分不一致。`,
      });
    }
  }

  if (
    subQuestions.length > 0 &&
    subQuestionsWithScoreMarks.length > 0 &&
    subQuestionsWithScoreMarks.length < subQuestions.length
  ) {
    diagnostics.push({
      code: 'partial_subquestion_score_marks',
      message: `部分小题已填写评分点或评分档，但还有 ${
        subQuestions.length - subQuestionsWithScoreMarks.length
      } 个小题未填写。`,
    });
  }

  return diagnostics;
}

interface ScoreMarkListReviewInput {
  ownerLabel: string;
  scoreMode: ScoreMode | undefined;
  scoreMarks: ScoreMark[];
  solution: RichContentBlock[] | undefined;
  annotations: SolutionAnnotation[];
  expectedPoints: number | undefined;
  requireExpectedPoints: boolean;
}

function reviewScoreMarkList(input: ScoreMarkListReviewInput): ScoreReviewDiagnostic[] {
  const { ownerLabel, scoreMarks, solution, annotations, expectedPoints, requireExpectedPoints } =
    input;
  const scoreMode = input.scoreMode ?? 'additive';
  const diagnostics: ScoreReviewDiagnostic[] = [];

  const scoreReferenceIds = new Set(collectScoreReferenceIds(solution));
  const annotationReferenceIds = new Set(collectAnnotationReferenceIds(solution));

  scoreMarks
    .filter((scoreMark) => scoreMark.placement === 'inline' && !scoreReferenceIds.has(scoreMark.id))
    .forEach((scoreMark) => {
      diagnostics.push({
        code: 'inline_score_position_missing',
        message: `${ownerLabel}原位评分项“${scoreMark.id}”的位置已丢失。`,
      });
    });

  annotations
    .filter((annotation) => !annotationReferenceIds.has(annotation.id))
    .forEach((annotation) => {
      diagnostics.push({
        code: 'inline_annotation_position_missing',
        message: `${ownerLabel}解析批注“${annotation.id}”的位置已丢失。`,
      });
    });

  if (scoreMarks.length === 0) {
    return diagnostics;
  }

  if (scoreMode === 'levels' && !isScoreLevelOrderDescending(scoreMarks)) {
    diagnostics.push({
      code: 'score_level_order',
      message: `${ownerLabel}评分档不是按得分从高到低排列。`,
    });
  }

  if (requireExpectedPoints && (expectedPoints === undefined || expectedPoints === 0)) {
    diagnostics.push({
      code: 'score_points_missing',
      message: `${ownerLabel}已填写${getScoreItemLabel(scoreMode)}，但题目分值需要确认。`,
    });
  }

  scoreMarks.forEach((scoreMark, index) => {
    if (scoreMode === 'additive' && scoreMark.points === 0) {
      diagnostics.push({
        code: 'zero_additive_score_mark',
        message: `${ownerLabel}第 ${index + 1} 个评分点为 0 分，请确认。`,
      });
    }

    if (stringifyInlineRichText(scoreMark.description).trim().length === 0) {
      diagnostics.push({
        code: 'empty_score_note',
        message: `${ownerLabel}第 ${index + 1} 个${getScoreItemLabel(scoreMode)}说明为空。`,
      });
    }
  });

  if (expectedPoints !== undefined && expectedPoints > 0) {
    const effectivePoints = calculateScoreMarksEffectivePoints(scoreMarks, scoreMode);

    if (effectivePoints !== expectedPoints) {
      diagnostics.push({
        code: scoreMode === 'additive' ? 'score_total_mismatch' : 'score_level_max_mismatch',
        message:
          scoreMode === 'additive'
            ? `${ownerLabel}评分点合计 ${effectivePoints} 分，与题目分值 ${expectedPoints} 分不一致。`
            : `${ownerLabel}最高评分档 ${effectivePoints} 分，与题目分值 ${expectedPoints} 分不一致。`,
      });
    }
  }

  return diagnostics;
}

export function sumScoreMarks(scoreMarks: ScoreMark[]): number {
  return scoreMarks.reduce((sum, scoreMark) => sum + scoreMark.points, 0);
}

export function maxScoreMarkPoints(scoreMarks: ScoreMark[]): number {
  return scoreMarks.reduce((max, scoreMark) => Math.max(max, scoreMark.points), 0);
}

export function calculateScoreMarksEffectivePoints(
  scoreMarks: ScoreMark[],
  scoreMode: ScoreMode | undefined,
): number {
  return (scoreMode ?? 'additive') === 'levels'
    ? maxScoreMarkPoints(scoreMarks)
    : sumScoreMarks(scoreMarks);
}

export function getScoreModeLabel(scoreMode: ScoreMode | undefined): string {
  return (scoreMode ?? 'additive') === 'levels' ? '档位评分' : '累加评分';
}

export function getScoreItemLabel(scoreMode: ScoreMode | undefined): string {
  return (scoreMode ?? 'additive') === 'levels' ? '评分档' : '评分点';
}

function duplicateQuestionData(question: ExamQuestion, createId: CreateId): ExamQuestion {
  const duplicate = clone(question);
  const blankIdMap = new Map<string, string>();
  const choiceIdMap = new Map<string, string>();

  duplicate.id = createId('question');

  duplicate.choices = duplicate.choices?.map((choice) => {
    const choiceId = createId('choice');
    choiceIdMap.set(choice.id, choiceId);
    return { ...choice, id: choiceId };
  });
  duplicate.correctChoiceIds = duplicate.correctChoiceIds?.map(
    (choiceId) => choiceIdMap.get(choiceId) ?? choiceId,
  );

  duplicate.blanks = duplicate.blanks?.map((blank) => {
    const blankId = createId('blank');
    blankIdMap.set(blank.id, blankId);
    return { ...blank, id: blankId };
  });

  duplicate.stem = remapBlankRefs(duplicate.stem, blankIdMap);
  duplicate.solution = duplicate.solution
    ? remapBlankRefs(duplicate.solution, blankIdMap)
    : undefined;
  const questionTeacherContent = duplicateTeacherContent(
    duplicate.solution,
    duplicate.scoreMarks,
    duplicate.solutionAnnotations,
    createId,
  );
  duplicate.solution = questionTeacherContent.solution;
  duplicate.scoreMarks = questionTeacherContent.scoreMarks;
  duplicate.solutionAnnotations = questionTeacherContent.annotations;

  if (duplicate.subQuestionGroup) {
    duplicate.subQuestionGroup = {
      ...duplicate.subQuestionGroup,
      items: duplicate.subQuestionGroup.items.map((item) => {
        const solution = item.solution ? remapBlankRefs(item.solution, blankIdMap) : undefined;
        const teacherContent = duplicateTeacherContent(
          solution,
          item.scoreMarks,
          item.solutionAnnotations,
          createId,
        );
        return {
          ...item,
          id: createId('subquestion'),
          stem: remapBlankRefs(item.stem, blankIdMap),
          solution: teacherContent.solution,
          scoreMarks: teacherContent.scoreMarks,
          solutionAnnotations: teacherContent.annotations,
        };
      }),
    };
  }

  return duplicate;
}

function withChoices(question: ExamQuestion, choices: ChoiceOption[]): ExamQuestion {
  const selectedIds = new Set(question.correctChoiceIds ?? []);
  const correctChoiceIds = choices
    .map((choice) => choice.id)
    .filter((choiceId) => selectedIds.has(choiceId));

  return {
    ...question,
    choices,
    correctChoiceIds: correctChoiceIds.length > 0 ? correctChoiceIds : undefined,
  };
}

function withSubQuestions(question: ExamQuestion, items: SubQuestion[]): ExamQuestion {
  return {
    ...question,
    subQuestionGroup: {
      exportAs: 'enumerate',
      listKind: 'enumerate',
      ...question.subQuestionGroup,
      items,
    },
  };
}

function hasDefaultChoiceLabels(choices: ChoiceOption[]): boolean {
  return choices.every((choice, index) => choice.label === defaultChoiceLabel(index));
}

function applyDefaultChoiceLabels(choices: ChoiceOption[]): ChoiceOption[] {
  return choices.map((choice, index) => ({ ...choice, label: defaultChoiceLabel(index) }));
}

function defaultChoiceLabel(index: number): string {
  return index < 26 ? String.fromCharCode(65 + index) : `X${index + 1}`;
}

function moveItem<T>(items: T[], sourceIndex: number, destinationIndex: number): T[] {
  const next = [...items];
  const [item] = next.splice(sourceIndex, 1);
  if (item === undefined) return items;
  next.splice(destinationIndex, 0, item);
  return next;
}

function removeBlankRefsFromBlocks(
  blocks: RichContentBlock[],
  blankId: string,
): RichContentBlock[] {
  return blocks.map((block) =>
    block.type === 'paragraph'
      ? {
          ...block,
          children: block.children.filter(
            (child) => !(child.type === 'blankRef' && child.blankId === blankId),
          ),
        }
      : block,
  );
}

function remapBlankRefs(
  blocks: RichContentBlock[],
  blankIdMap: Map<string, string>,
): RichContentBlock[] {
  return blocks.map((block) => {
    if (block.type !== 'paragraph') {
      return block;
    }

    return {
      ...block,
      children: block.children.map((child) =>
        child.type === 'blankRef'
          ? { ...child, blankId: blankIdMap.get(child.blankId) ?? child.blankId }
          : child,
      ),
    };
  });
}

function duplicateTeacherContent(
  solution: RichContentBlock[] | undefined,
  scoreMarks: ScoreMark[] | undefined,
  annotations: SolutionAnnotation[] | undefined,
  createId: CreateId,
): {
  solution: RichContentBlock[] | undefined;
  scoreMarks: ScoreMark[] | undefined;
  annotations: SolutionAnnotation[] | undefined;
} {
  const scoreIdMap = new Map((scoreMarks ?? []).map((item) => [item.id, createId('score')]));
  const annotationIdMap = new Map(
    (annotations ?? []).map((item) => [item.id, createId('annotation')]),
  );
  const remappedSolution = solution?.map((block) => {
    if (block.type !== 'paragraph') return block;
    return {
      ...block,
      children: block.children.map((child) => {
        if (child.type === 'scoreRef') {
          return { ...child, scoreMarkId: scoreIdMap.get(child.scoreMarkId) ?? child.scoreMarkId };
        }
        if (child.type === 'annotationRef') {
          return {
            ...child,
            annotationId: annotationIdMap.get(child.annotationId) ?? child.annotationId,
          };
        }
        return child;
      }),
    };
  });

  return {
    solution: remappedSolution,
    scoreMarks: scoreMarks?.map((item) => ({
      ...item,
      id: scoreIdMap.get(item.id)!,
      description: item.description?.map((part) => ({ ...part })),
    })),
    annotations: annotations?.map((item) => ({
      ...item,
      id: annotationIdMap.get(item.id)!,
      content: item.content.map((part) => ({ ...part })),
    })),
  };
}

function moveById<T extends { id: string }>(items: T[], id: string, direction: 'up' | 'down'): T[] {
  const index = items.findIndex((item) => item.id === id);

  if (index === -1) {
    return items;
  }

  const targetIndex = direction === 'up' ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= items.length) {
    return items;
  }

  const moved = [...items];
  const [item] = moved.splice(index, 1);
  moved.splice(targetIndex, 0, item);
  return moved;
}

function moveByIndex<T>(items: T[], index: number, direction: 'up' | 'down'): T[] {
  const targetIndex = direction === 'up' ? index - 1 : index + 1;

  if (index < 0 || index >= items.length || targetIndex < 0 || targetIndex >= items.length) {
    return items;
  }

  const moved = [...items];
  const [item] = moved.splice(index, 1);
  moved.splice(targetIndex, 0, item);
  return moved;
}

function defaultSectionTitle(kind: ExamSectionKind): string {
  switch (kind) {
    case 'singleChoice':
      return '选择题';
    case 'multipleChoice':
      return '多选题';
    case 'blank':
      return '填空题';
    case 'judgement':
      return '判断题';
    case 'problem':
      return '解答题';
    case 'custom':
      return '新建节';
  }
}

function defaultStemText(type: QuestionType): string {
  switch (type) {
    case 'singleChoice':
      return '单选题题干';
    case 'multipleChoice':
      return '多选题题干';
    case 'blank':
      return '填空题题干';
    case 'judgement':
      return '判断下列说法是否正确。';
    case 'problem':
      return '解答题题干';
    case 'rawLatex':
      return '原始 LaTeX 题目';
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
