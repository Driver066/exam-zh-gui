import {
  CURRENT_SCHEMA_VERSION,
  PHASE1_SCHEMA_VERSION,
  PHASE2_SCHEMA_VERSION,
  PHASE3_SCHEMA_VERSION,
  PHASE4_SCHEMA_VERSION,
  PHASE5_SCHEMA_VERSION,
  PHASE6_SCHEMA_VERSION,
  PHASE7_SCHEMA_VERSION,
  PHASE8_SCHEMA_VERSION,
  PHASE9_SCHEMA_VERSION,
  PHASE10_SCHEMA_VERSION,
  PHASE11_SCHEMA_VERSION,
  PHASE12_SCHEMA_VERSION,
  type Asset,
  type BlankSlot,
  type ChoiceOption,
  type ExamDocument,
  type ExamQuestion,
  type ExamSection,
  type ExamZhOptionBag,
  type FillinSetup,
  type FrontMatter,
  type InlineContent,
  type InlineRichText,
  type RichContentBlock,
  type ScoreMark,
  type ScoreMode,
  type SolutionAnnotation,
  type SubQuestion,
  type SubQuestionGroup,
} from './model';
import { createRawLatexQuestion } from './defaults';
import { parseRichContentInput } from './rich-content';
import { parseInlineRichText, reconcileTeacherSolutionBlocks } from './teacher-content';

const LEGACY_SCHEMA_VERSIONS = new Set<string>([
  PHASE1_SCHEMA_VERSION,
  PHASE2_SCHEMA_VERSION,
  PHASE3_SCHEMA_VERSION,
  PHASE4_SCHEMA_VERSION,
  PHASE5_SCHEMA_VERSION,
  PHASE6_SCHEMA_VERSION,
  PHASE7_SCHEMA_VERSION,
  PHASE8_SCHEMA_VERSION,
  PHASE9_SCHEMA_VERSION,
  PHASE10_SCHEMA_VERSION,
  PHASE11_SCHEMA_VERSION,
  PHASE12_SCHEMA_VERSION,
]);

export class UnsupportedExamDocumentVersionError extends Error {
  constructor(version: string) {
    super(`Unsupported exam document schema version: ${version}`);
    this.name = 'UnsupportedExamDocumentVersionError';
  }
}

export class ExamDocumentMigrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExamDocumentMigrationError';
  }
}

export function migrateExamDocument(input: unknown): unknown {
  if (!isRecord(input)) {
    throw new Error('Exam document must be a JSON object.');
  }

  const schemaVersion = input.schemaVersion;

  if (schemaVersion === CURRENT_SCHEMA_VERSION) {
    return input;
  }

  if (schemaVersion === PHASE12_SCHEMA_VERSION) {
    return migratePhase13Model(input);
  }

  if (
    schemaVersion === PHASE8_SCHEMA_VERSION ||
    schemaVersion === PHASE9_SCHEMA_VERSION ||
    schemaVersion === PHASE10_SCHEMA_VERSION ||
    schemaVersion === PHASE11_SCHEMA_VERSION
  ) {
    return migratePhase13Model(migrateScoringModel(migratePageSetup(input)));
  }

  if (typeof schemaVersion === 'string' && LEGACY_SCHEMA_VERSIONS.has(schemaVersion)) {
    return migrateKnownDocument(input);
  }

  if (typeof schemaVersion === 'string') {
    throw new UnsupportedExamDocumentVersionError(schemaVersion);
  }

  throw new Error('Exam document is missing schemaVersion.');
}

function migrateKnownDocument(input: Record<string, unknown>): ExamDocument {
  const setupSource = isRecord(input.setup) ? input.setup : {};
  const examZhSource = isRecord(input.examZh) ? input.examZh : {};
  const preambleOptions = normalizeGlobalOptionBag(examZhSource.preambleSetup);
  const setupOptions = normalizeGlobalOptionBag(setupSource.examZhOptions);
  const examZhOptions = mergeOptionBags(preambleOptions, setupOptions);
  migrateHiddenFillinValue(examZhOptions);
  const extractedPageOptions = extractPageOptions(examZhOptions);

  return compactDocument({
    schemaVersion: CURRENT_SCHEMA_VERSION,
    documentId: readString(input.documentId, 'legacy-document'),
    metadata: migrateMetadata(input.metadata),
    setup: migrateSetup(setupSource, extractedPageOptions.remaining, extractedPageOptions.scoped),
    frontMatter: migrateFrontMatter(input.frontMatter),
    sections: migrateSections(input.sections),
    assets: migrateAssets(input.assets),
    examZh: migrateExamZh(examZhSource),
  });
}

function migrateMetadata(input: unknown): ExamDocument['metadata'] {
  const source = isRecord(input) ? input : {};

  return compactObject({
    title: readString(source.title, '未命名试卷'),
    subject: readString(source.subject, '数学'),
    grade: readOptionalString(source.grade),
    semester: readOptionalString(source.semester),
    durationMinutes: readOptionalPositiveInteger(source.durationMinutes),
    totalPoints: readOptionalNonnegativeNumber(source.totalPoints),
    author: readOptionalString(source.author),
    notes: readOptionalString(source.notes),
  });
}

function migrateSetup(
  source: Record<string, unknown>,
  examZhOptions: ExamZhOptionBag | undefined,
  pageExamZhOptions?: ExamZhOptionBag,
): ExamDocument['setup'] {
  const choicesSource = isRecord(source.choices) ? source.choices : undefined;
  const fillinSource = isRecord(source.fillin) ? source.fillin : undefined;
  const choices = choicesSource
    ? compactObject({
        maxColumns: readOptionalPositiveInteger(choicesSource.maxColumns),
        examZhOptions: normalizeScopedOptionBag(choicesSource.examZhOptions, 'choices'),
      })
    : undefined;
  const fillin = fillinSource
    ? migrateFillinSetup({
        type: readBlankSlotType(fillinSource.type),
        width: readOptionalString(fillinSource.width),
        examZhOptions: normalizeScopedOptionBag(fillinSource.examZhOptions, 'fillin'),
      })
    : undefined;

  if (fillin?.examZhOptions) {
    migrateHiddenFillinValue(fillin.examZhOptions, true);
  }

  return compactObject({
    answerMode: source.answerMode === 'teacher' ? 'teacher' : 'student',
    choices: isNonEmptyObject(choices) ? choices : undefined,
    fillin: isNonEmptyObject(fillin) ? fillin : undefined,
    page: pageExamZhOptions ? { examZhOptions: pageExamZhOptions } : undefined,
    examZhOptions,
  });
}

function migratePhase13Model(input: Record<string, unknown>): Record<string, unknown> {
  const setupSource = isRecord(input.setup) ? input.setup : {};
  const fillinSource = isRecord(setupSource.fillin) ? setupSource.fillin : undefined;
  const frontMatterSource = isRecord(input.frontMatter) ? input.frontMatter : {};

  return {
    ...input,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    setup: compactObject({
      ...setupSource,
      fillin: fillinSource ? migrateFillinSetup(fillinSource) : undefined,
    }),
    frontMatter: {
      ...frontMatterSource,
      informationFields: Array.isArray(frontMatterSource.informationFields)
        ? frontMatterSource.informationFields.flatMap((field) => migrateInformationField(field))
        : [],
    },
  };
}

function migrateFillinSetup(source: Record<string, unknown>): FillinSetup {
  const options = normalizeScopedOptionBag(source.examZhOptions, 'fillin');
  const nextOptions = options ? { ...options } : undefined;
  let answerColor: FillinSetup['answerColor'] = source.answerColor === 'red' ? 'red' : undefined;

  if (nextOptions?.['text-color'] === 'red') {
    answerColor = 'red';
    delete nextOptions['text-color'];
  } else if (nextOptions?.['text-color'] === 'black') {
    delete nextOptions['text-color'];
  }

  return compactObject({
    type: readBlankSlotType(source.type),
    width: readOptionalString(source.width),
    answerColor,
    examZhOptions: nextOptions && Object.keys(nextOptions).length > 0 ? nextOptions : undefined,
  });
}

function migratePageSetup(input: Record<string, unknown>): Record<string, unknown> {
  const setupSource = isRecord(input.setup) ? input.setup : {};
  const globalOptions = normalizeGlobalOptionBag(setupSource.examZhOptions);
  const extracted = extractPageOptions(globalOptions);
  const existingPage = isRecord(setupSource.page) ? setupSource.page : undefined;
  const existingScoped = normalizeScopedOptionBag(existingPage?.examZhOptions, 'page');
  const pageExamZhOptions = mergeOptionBags(existingScoped, extracted.scoped);
  const page = existingPage
    ? compactObject({ ...existingPage, examZhOptions: pageExamZhOptions })
    : pageExamZhOptions
      ? { examZhOptions: pageExamZhOptions }
      : undefined;

  return {
    ...input,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    setup: compactObject({
      ...setupSource,
      page: page && isNonEmptyObject(page) ? page : undefined,
      examZhOptions: extracted.remaining,
    }),
  };
}

function migrateScoringModel(input: Record<string, unknown>): Record<string, unknown> {
  return {
    ...input,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    sections: Array.isArray(input.sections)
      ? input.sections.map((section) => {
          if (!isRecord(section)) return section;
          return {
            ...section,
            questions: Array.isArray(section.questions)
              ? section.questions.map((question) => migrateCurrentQuestionScoring(question))
              : section.questions,
          };
        })
      : input.sections,
  };
}

function migrateCurrentQuestionScoring(input: unknown): unknown {
  if (!isRecord(input)) return input;

  const id = readString(input.id, 'legacy-question');
  const scoreMarks = migrateScoreMarks(input.scoreMarks);
  const solution = migrateRichContentBlocks(input.solution);
  const teacherContent = migrateTeacherContent(id, solution, scoreMarks, input.solutionAnnotations);
  const subQuestionGroup = isRecord(input.subQuestionGroup)
    ? {
        ...input.subQuestionGroup,
        items: Array.isArray(input.subQuestionGroup.items)
          ? input.subQuestionGroup.items.map((item, index) => {
              if (!isRecord(item)) return item;
              const subId = readString(item.id, `${id}-subquestion-${index + 1}`);
              const subTeacherContent = migrateTeacherContent(
                subId,
                migrateRichContentBlocks(item.solution),
                migrateScoreMarks(item.scoreMarks),
                item.solutionAnnotations,
              );
              const next: Record<string, unknown> = {
                ...item,
                solution: omitEmptyArray(subTeacherContent.solution),
                scoreMarks: omitEmptyArray(subTeacherContent.scoreMarks),
                solutionAnnotations: omitEmptyArray(subTeacherContent.annotations),
              };
              delete next.scoreMode;
              if (subTeacherContent.scoreMarks.length > 0) {
                next.scoreMode = migrateScoreMode(item.scoreMode, subTeacherContent.scoreMarks);
              }
              return next;
            })
          : input.subQuestionGroup.items,
      }
    : input.subQuestionGroup;
  const next: Record<string, unknown> = {
    ...input,
    solution: omitEmptyArray(teacherContent.solution),
    scoreMarks: omitEmptyArray(teacherContent.scoreMarks),
    solutionAnnotations: omitEmptyArray(teacherContent.annotations),
    subQuestionGroup,
  };
  delete next.scoreMode;
  if (teacherContent.scoreMarks.length > 0) {
    next.scoreMode = migrateScoreMode(input.scoreMode, teacherContent.scoreMarks);
  }
  return next;
}

function migrateTeacherContent(
  ownerId: string,
  solution: RichContentBlock[] | undefined,
  scoreMarks: ScoreMark[],
  annotationInput: unknown,
): { solution: RichContentBlock[]; scoreMarks: ScoreMark[]; annotations: SolutionAnnotation[] } {
  const annotations = migrateSolutionAnnotations(annotationInput);
  const existingIds = new Set([
    ...scoreMarks.map((item) => item.id),
    ...annotations.map((item) => item.id),
  ]);
  let sequence = 0;
  const result = reconcileTeacherSolutionBlocks({
    blocks: solution ?? [],
    solution: solution ?? [],
    scoreMarks,
    annotations,
    createId(prefix) {
      let id = `${ownerId}-${prefix}-inline-${++sequence}`;
      while (existingIds.has(id)) id = `${ownerId}-${prefix}-inline-${++sequence}`;
      existingIds.add(id);
      return id;
    },
  });
  return {
    solution: result.solution,
    scoreMarks: result.scoreMarks,
    annotations: result.annotations,
  };
}

function migrateSolutionAnnotations(input: unknown): SolutionAnnotation[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((item, index) => {
    if (!isRecord(item)) return [];
    const content = migrateInlineRichText(item.content);
    return content ? [{ id: readString(item.id, `legacy-annotation-${index + 1}`), content }] : [];
  });
}

function extractPageOptions(options: ExamZhOptionBag | undefined): {
  remaining?: ExamZhOptionBag;
  scoped?: ExamZhOptionBag;
} {
  if (!options) {
    return {};
  }

  const remaining: ExamZhOptionBag = {};
  const scoped: ExamZhOptionBag = {};

  for (const [key, value] of Object.entries(options)) {
    if (key.startsWith('page/')) {
      scoped[key.slice('page/'.length)] = value;
    } else {
      remaining[key] = value;
    }
  }

  return {
    remaining: Object.keys(remaining).length > 0 ? remaining : undefined,
    scoped: Object.keys(scoped).length > 0 ? scoped : undefined,
  };
}

function migrateFrontMatter(input: unknown): FrontMatter {
  const source = isRecord(input) ? input : {};

  return compactObject({
    secret: typeof source.secret === 'boolean' ? source.secret : undefined,
    showTitleBlock: typeof source.showTitleBlock === 'boolean' ? source.showTitleBlock : undefined,
    warning: readOptionalString(source.warning),
    informationFields: Array.isArray(source.informationFields)
      ? source.informationFields.flatMap((field) => migrateInformationField(field))
      : [],
    informationPlacement: readInformationPlacement(source.informationPlacement),
    notices: migrateRichContentBlocks(source.notices),
    preface: Array.isArray(source.preface)
      ? omitEmptyArray(migrateRichContentBlocks(source.preface))
      : undefined,
  });
}

function migrateInformationField(input: unknown): FrontMatter['informationFields'] {
  if (
    !isRecord(input) ||
    typeof input.label !== 'string' ||
    (input.kind !== 'line' && input.kind !== 'squares' && input.kind !== 'text')
  ) {
    return [];
  }

  if (input.kind === 'text') {
    return [{ label: input.label, kind: 'text' }];
  }

  if (input.kind === 'squares') {
    return [
      {
        label: input.label,
        kind: 'squares',
        length: migrateInformationSquareCount(input.length, input.width),
      },
    ];
  }

  return [
    compactObject({
      label: input.label,
      kind: 'line',
      width: readOptionalString(input.width),
    }),
  ];
}

function migrateInformationSquareCount(length: unknown, width: unknown): number {
  const explicitLength = readOptionalPositiveInteger(length);
  if (explicitLength !== undefined) {
    return Math.min(30, explicitLength);
  }

  if (typeof width === 'string') {
    const match = /^\s*(\d+(?:\.\d+)?)em\s*$/.exec(width);
    if (match) {
      return Math.min(30, Math.max(1, Math.round(Number(match[1]) / 1.4)));
    }
  }

  return 4;
}

function migrateSections(input: unknown): ExamSection[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((section, sectionIndex) => migrateSection(section, sectionIndex));
}

function migrateSection(input: unknown, sectionIndex: number): ExamSection {
  const source = isRecord(input) ? input : {};

  return compactObject({
    id: readString(source.id, `legacy-section-${sectionIndex + 1}`),
    title: readString(source.title, `Legacy Section ${sectionIndex + 1}`),
    kind: readSectionKind(source.kind),
    defaultPoints: readOptionalNonnegativeNumber(source.defaultPoints),
    numbering: migrateNumbering(source.numbering),
    questions: Array.isArray(source.questions)
      ? source.questions.map((question, questionIndex) =>
          migrateQuestion(question, sectionIndex, questionIndex),
        )
      : [],
  });
}

function migrateNumbering(input: unknown): ExamSection['numbering'] {
  if (!isRecord(input)) {
    return undefined;
  }

  const numbering = compactObject({
    start: readOptionalPositiveInteger(input.start),
    reset: typeof input.reset === 'boolean' ? input.reset : undefined,
    examZhOptions: normalizeScopedOptionBag(input.examZhOptions, ['question', 'problem']),
  });
  return isNonEmptyObject(numbering) ? numbering : undefined;
}

function migrateQuestion(
  input: unknown,
  sectionIndex: number,
  questionIndex: number,
): ExamQuestion {
  if (!isRecord(input) || !looksLikeStructuredQuestion(input)) {
    return createRawLatexQuestion(
      `legacy-question-${sectionIndex + 1}-${questionIndex + 1}`,
      JSON.stringify(input, null, 2) || '% Empty legacy question',
    );
  }

  const id = readString(input.id, `legacy-question-${sectionIndex + 1}-${questionIndex + 1}`);
  const type = readQuestionType(input.type);

  if (type === 'rawLatex') {
    return createRawLatexQuestion(
      id,
      readString(input.rawLatex, `% Empty legacy raw LaTeX question ${id}`),
    );
  }

  const answerSource = isRecord(input.answer) ? input.answer : {};
  const legacyAnswerText = migrateRichContentBlocks(answerSource.text);
  const scoreMarks = migrateScoreMarks(input.scoreMarks);
  const solution = omitEmptyArray([
    ...migrateRichContentBlocks(input.solution),
    ...legacyAnswerText,
  ]);
  const teacherContent = migrateTeacherContent(id, solution, scoreMarks, input.solutionAnnotations);
  const base = compactObject({
    id,
    type,
    environment: readEnvironment(input.environment, type),
    index: readOptionalPositiveInteger(input.index),
    points: readOptionalNonnegativeNumber(input.points),
    stem: migrateRichContentBlocks(input.stem),
    solution: omitEmptyArray(teacherContent.solution),
    scoreMode: migrateScoreMode(input.scoreMode, teacherContent.scoreMarks),
    scoreMarks: omitEmptyArray(teacherContent.scoreMarks),
    solutionAnnotations: omitEmptyArray(teacherContent.annotations),
    examZhOptions: normalizeScopedOptionBag(
      input.examZhOptions,
      type === 'problem' ? 'problem' : 'question',
    ),
  });

  if (type === 'singleChoice' || type === 'multipleChoice') {
    const choices = migrateChoices(input.choices, id);
    const legacyChoiceIds = Array.isArray(answerSource.choiceKeys)
      ? answerSource.choiceKeys.filter(isString)
      : [];
    const correctChoiceIds = normalizeChoiceAnswerIds(legacyChoiceIds, choices);

    return compactObject({
      ...base,
      choices,
      choicesSetup: migrateChoicesSetup(input.choicesSetup),
      correctChoiceIds: omitEmptyArray(correctChoiceIds),
    }) as ExamQuestion;
  }

  if (type === 'blank') {
    return compactObject({
      ...base,
      blanks: migrateBlankSlots(input.blanks, answerSource.blanks),
    }) as ExamQuestion;
  }

  const subQuestionGroup = migrateSubQuestionGroup(input.subQuestionGroup, id);
  const migrated = compactObject({ ...base, subQuestionGroup }) as ExamQuestion;
  return migrateWholeQuestionScores(migrated);
}

function migrateChoices(input: unknown, questionId: string): ChoiceOption[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.flatMap((choice, index) => {
    if (!isRecord(choice)) {
      return [];
    }

    return [
      compactObject({
        id: readString(choice.id, `${questionId}-choice-${index + 1}`),
        label: readOptionalString(choice.label),
        content: migrateRichContentBlocks(choice.content),
      }),
    ];
  });
}

function migrateChoicesSetup(input: unknown): ExamQuestion['choicesSetup'] {
  if (!isRecord(input)) {
    return undefined;
  }

  const choicesSetup = compactObject({
    maxColumns: readOptionalPositiveInteger(input.maxColumns),
    examZhOptions: normalizeScopedOptionBag(input.examZhOptions, 'choices'),
  });
  return isNonEmptyObject(choicesSetup) ? choicesSetup : undefined;
}

function normalizeChoiceAnswerIds(answerIds: string[], choices: ChoiceOption[]): string[] {
  const ids = new Set(choices.map((choice) => choice.id));
  const labelToId = new Map(
    choices.flatMap((choice) => (choice.label ? [[choice.label, choice.id] as const] : [])),
  );
  return [
    ...new Set(
      answerIds.map((answerId) =>
        ids.has(answerId) ? answerId : (labelToId.get(answerId) ?? answerId),
      ),
    ),
  ];
}

function migrateBlankSlots(input: unknown, legacyAnswersInput: unknown): BlankSlot[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const legacyAnswers = readLegacyBlankAnswers(legacyAnswersInput);

  return input.flatMap((blank, index) => {
    if (!isRecord(blank)) {
      return [];
    }

    const id = readString(blank.id, `legacy-blank-${index + 1}`);
    const directAnswer = migrateRichAnswerValue(blank.answer);
    const fallbackAnswer = legacyAnswers.get(id);
    const examZhOptions = normalizeScopedOptionBag(blank.examZhOptions, 'fillin');

    if (examZhOptions) {
      migrateHiddenFillinValue(examZhOptions, true);
    }

    return [
      compactObject({
        id,
        command:
          blank.command === 'fillin*'
            ? 'fillin*'
            : blank.command === 'fillin'
              ? 'fillin'
              : undefined,
        answer: directAnswer ?? fallbackAnswer,
        width: readOptionalString(blank.width),
        type: readBlankSlotType(blank.type),
        noAnswerType:
          blank.noAnswerType === 'hidden' ? 'none' : readNoAnswerType(blank.noAnswerType),
        widthType:
          blank.widthType === 'fill' || blank.widthType === 'normal' ? blank.widthType : undefined,
        parenType:
          blank.parenType === 'banjiao' || blank.parenType === 'quanjiao'
            ? blank.parenType
            : undefined,
        examZhOptions,
      }),
    ];
  });
}

function readLegacyBlankAnswers(input: unknown): Map<string, RichContentBlock[]> {
  const answers = new Map<string, RichContentBlock[]>();

  if (!Array.isArray(input)) {
    return answers;
  }

  for (const answer of input) {
    if (!isRecord(answer) || typeof answer.blankId !== 'string') {
      continue;
    }

    const value = migrateRichAnswerValue(answer.value);
    if (value) {
      answers.set(answer.blankId, value);
    }
  }

  return answers;
}

function migrateRichAnswerValue(input: unknown): RichContentBlock[] | undefined {
  if (Array.isArray(input)) {
    return migrateRichContentBlocks(input);
  }

  if (typeof input === 'string') {
    return parseRichContentInput(input, { context: 'blankAnswer' }).blocks;
  }

  return undefined;
}

function migrateSubQuestionGroup(input: unknown, questionId: string): SubQuestionGroup | undefined {
  if (!isRecord(input)) {
    return undefined;
  }

  const items = Array.isArray(input.items)
    ? input.items.flatMap((item, index) => migrateSubQuestion(item, questionId, index))
    : [];
  const group = compactObject({
    items,
    exportAs: readSubQuestionExportAs(input.exportAs),
    listKind: readListKind(input.listKind),
    rawLatex: readOptionalString(input.rawLatex),
  });
  return group;
}

function migrateSubQuestion(input: unknown, questionId: string, index: number): SubQuestion[] {
  if (!isRecord(input)) {
    return [];
  }

  const answerSource = isRecord(input.answer) ? input.answer : {};
  const scoreMarks = migrateScoreMarks(input.scoreMarks);
  const id = readString(input.id, `${questionId}-subquestion-${index + 1}`);
  const solution = omitEmptyArray([
    ...migrateRichContentBlocks(input.solution),
    ...migrateRichContentBlocks(answerSource.text),
  ]);
  const teacherContent = migrateTeacherContent(id, solution, scoreMarks, input.solutionAnnotations);
  return [
    compactObject({
      id,
      label: readOptionalString(input.label),
      stem: migrateRichContentBlocks(input.stem),
      solution: omitEmptyArray(teacherContent.solution),
      scoreMode: migrateScoreMode(input.scoreMode, teacherContent.scoreMarks),
      scoreMarks: omitEmptyArray(teacherContent.scoreMarks),
      solutionAnnotations: omitEmptyArray(teacherContent.annotations),
      examZhOptions: normalizeScopedOptionBag(input.examZhOptions, 'list'),
    }),
  ];
}

function migrateWholeQuestionScores(question: ExamQuestion): ExamQuestion {
  const firstSubQuestion = question.subQuestionGroup?.items[0];
  const wholeMarks = question.scoreMarks ?? [];

  if (!firstSubQuestion || wholeMarks.length === 0) {
    return question;
  }

  const subMarks = firstSubQuestion.scoreMarks ?? [];
  const wholeMode = question.scoreMode;
  const subMode = firstSubQuestion.scoreMode;

  if (subMarks.length > 0 && wholeMode && subMode && wholeMode !== subMode) {
    throw new ExamDocumentMigrationError(
      `Cannot migrate question "${question.id}": whole-question and first-subquestion score modes conflict.`,
    );
  }

  const scoreMode =
    subMarks.length > 0
      ? (subMode ?? wholeMode ?? 'additive')
      : (wholeMode ?? subMode ?? 'additive');
  const items = question.subQuestionGroup!.items.map((item, index) =>
    index === 0
      ? compactObject({ ...item, scoreMode, scoreMarks: [...wholeMarks, ...subMarks] })
      : item,
  );
  const next = { ...question, subQuestionGroup: { ...question.subQuestionGroup!, items } };
  delete next.scoreMode;
  delete next.scoreMarks;
  return next;
}

function migrateScoreMarks(input: unknown): ScoreMark[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.flatMap((mark, index) => {
    if (!isRecord(mark) || typeof mark.points !== 'number' || mark.points < 0) {
      return [];
    }

    return [
      compactObject({
        id: readString(mark.id, `legacy-score-${index + 1}`),
        points: mark.points,
        description: migrateInlineRichText(mark.description, mark.note),
        placement: mark.placement === 'inline' ? ('inline' as const) : undefined,
      }),
    ];
  });
}

function migrateInlineRichText(input: unknown, fallback?: unknown): ScoreMark['description'] {
  if (Array.isArray(input)) {
    const content: InlineRichText = [];
    input.forEach((item) => {
      if (!isRecord(item)) return;
      if (item.type === 'text' && typeof item.text === 'string') {
        content.push({ type: 'text', text: item.text });
        return;
      }
      if (item.type === 'inlineMath' && typeof item.latex === 'string') {
        content.push({ type: 'inlineMath', latex: item.latex });
        return;
      }
      if (item.type === 'rawLatex' && typeof item.latex === 'string') {
        content.push({ type: 'rawLatex', latex: item.latex });
      }
    });
    return content.length > 0 ? content : undefined;
  }

  const legacyText = readOptionalString(fallback);
  if (!legacyText) return undefined;
  const content = parseInlineRichText(legacyText);
  return content.length > 0 ? content : undefined;
}

function migrateScoreMode(input: unknown, scoreMarks: ScoreMark[]): ScoreMode | undefined {
  if (scoreMarks.length === 0) {
    return undefined;
  }

  if (input === 'additive' || input === 'levels') {
    return input;
  }
  return 'additive';
}

function migrateAssets(input: unknown): Asset[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.flatMap((asset) => {
    if (!isRecord(asset) || typeof asset.id !== 'string' || asset.kind !== 'image') {
      return [];
    }

    return [
      compactObject({
        id: asset.id,
        kind: 'image' as const,
        sourcePath: readOptionalString(asset.sourcePath),
        exportPath: readOptionalString(asset.exportPath),
        alt: readOptionalString(asset.alt),
      }),
    ];
  });
}

function migrateExamZh(source: Record<string, unknown>): ExamDocument['examZh'] {
  const examZh = compactObject({
    documentClass: normalizeLocalOptionBag(source.documentClass),
    rawPreamble: Array.isArray(source.rawPreamble)
      ? omitEmptyArray(source.rawPreamble.filter(isString))
      : undefined,
  });
  return isNonEmptyObject(examZh) ? examZh : undefined;
}

function migrateRichContentBlocks(input: unknown): RichContentBlock[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.flatMap((block, blockIndex) => migrateRichContentBlock(block, blockIndex));
}

function migrateRichContentBlock(input: unknown, blockIndex: number): RichContentBlock[] {
  if (!isRecord(input)) {
    return [legacyRawBlock(input, blockIndex)];
  }

  switch (input.type) {
    case 'paragraph':
      return [
        {
          type: 'paragraph',
          children: Array.isArray(input.children)
            ? input.children.flatMap(migrateInlineContent)
            : [],
        },
      ];
    case 'displayMath':
      return [{ type: 'displayMath', latex: readString(input.latex, '') }];
    case 'rawLatex':
      return [{ type: 'rawLatex', latex: readString(input.latex, '') }];
    case 'image':
      return [
        compactObject({
          type: 'image' as const,
          assetId: readString(input.assetId, `legacy-asset-${blockIndex + 1}`),
          includeGraphicsOptions: normalizeLocalOptionBag(input.includeGraphicsOptions),
          caption: readOptionalString(input.caption),
          examZhOptions: normalizeScopedOptionBag(input.examZhOptions, 'textfigure'),
        }),
      ];
    case 'figureGroup':
      return [migrateFigureGroup(input)];
    case 'textFigure':
      return [migrateTextFigure(input, blockIndex)];
    case 'list':
      return [
        compactObject({
          type: 'list' as const,
          kind: readListKind(input.kind) ?? 'enumerate',
          items: Array.isArray(input.items)
            ? input.items.map((item) => migrateRichContentBlocks(item))
            : [],
          examZhOptions: normalizeScopedOptionBag(input.examZhOptions, 'list'),
        }),
      ];
    default:
      return [legacyRawBlock(input, blockIndex)];
  }
}

function migrateInlineContent(input: unknown): InlineContent[] {
  if (!isRecord(input)) {
    return [];
  }

  switch (input.type) {
    case 'text':
      return typeof input.text === 'string' ? [{ type: 'text', text: input.text }] : [];
    case 'inlineMath':
      return typeof input.latex === 'string' ? [{ type: 'inlineMath', latex: input.latex }] : [];
    case 'rawLatex':
      return typeof input.latex === 'string' ? [{ type: 'rawLatex', latex: input.latex }] : [];
    case 'blankRef':
      return typeof input.blankId === 'string'
        ? [{ type: 'blankRef', blankId: input.blankId }]
        : [];
    case 'choiceParenRef':
      return [{ type: 'choiceParenRef' }];
    case 'judgementRef':
      return [{ type: 'judgementRef' }];
    case 'stemLine':
      return [{ type: 'stemLine' }];
    default:
      return [];
  }
}

function migrateFigureGroup(input: Record<string, unknown>): RichContentBlock {
  const layoutSource = isRecord(input.layout) ? input.layout : {};
  return compactObject({
    type: 'figureGroup' as const,
    items: Array.isArray(input.items)
      ? input.items.flatMap((item, index) => {
          if (!isRecord(item) || !isRecord(item.figure)) {
            return [];
          }
          const figure = migrateRichContentBlock(item.figure, index)[0];
          if (!figure || (figure.type !== 'image' && figure.type !== 'rawLatex')) {
            return [];
          }
          return [compactObject({ label: readOptionalString(item.label), figure })];
        })
      : [],
    layout:
      input.layout && layoutSource.kind === 'multifigures'
        ? compactObject({
            kind: 'multifigures' as const,
            columns: readOptionalPositiveInteger(layoutSource.columns),
            figPos: readFigurePosition(layoutSource.figPos),
          })
        : undefined,
    examZhOptions: normalizeScopedOptionBag(input.examZhOptions, 'multifigures'),
  });
}

function migrateTextFigure(input: Record<string, unknown>, blockIndex: number): RichContentBlock {
  const figureSource = isRecord(input.figure) ? input.figure : { type: 'rawLatex', latex: '' };
  const figure = migrateRichContentBlock(figureSource, blockIndex)[0];
  const safeFigure =
    figure &&
    (figure.type === 'image' || figure.type === 'figureGroup' || figure.type === 'rawLatex')
      ? figure
      : ({ type: 'rawLatex', latex: '' } as const);
  const layoutSource = isRecord(input.layout) ? input.layout : {};

  return compactObject({
    type: 'textFigure' as const,
    text: migrateRichContentBlocks(input.text),
    figure: safeFigure,
    layout:
      input.layout && layoutSource.kind === 'textfigure'
        ? compactObject({
            kind: 'textfigure' as const,
            figPos: readOptionalString(layoutSource.figPos),
            textWidth: readOptionalString(layoutSource.textWidth),
            figureWidth: readOptionalString(layoutSource.figureWidth),
            ratio: readOptionalString(layoutSource.ratio),
            top: typeof layoutSource.top === 'number' ? layoutSource.top : undefined,
          })
        : undefined,
    examZhOptions: normalizeScopedOptionBag(input.examZhOptions, 'textfigure'),
  });
}

function legacyRawBlock(input: unknown, blockIndex: number): RichContentBlock {
  return {
    type: 'rawLatex',
    latex: `% legacy rich content block ${blockIndex + 1}\n${JSON.stringify(input, null, 2)}`,
  };
}

function normalizeGlobalOptionBag(input: unknown): ExamZhOptionBag | undefined {
  if (!isOptionBag(input)) {
    return undefined;
  }

  const nested: ExamZhOptionBag = {};
  const direct: ExamZhOptionBag = {};

  for (const [key, value] of Object.entries(input)) {
    if (isOptionBagValue(value) && !key.includes('/')) {
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        nested[`${key}/${nestedKey}`] = nestedValue;
      }
    } else {
      direct[key] = value;
    }
  }

  const normalized = { ...nested, ...direct };
  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeScopedOptionBag(
  input: unknown,
  namespace: string | string[],
): ExamZhOptionBag | undefined {
  if (!isOptionBag(input)) {
    return undefined;
  }

  const namespaces = Array.isArray(namespace) ? namespace : [namespace];
  const nested: ExamZhOptionBag = {};
  const prefixed: ExamZhOptionBag = {};
  const local: ExamZhOptionBag = {};

  for (const candidate of namespaces) {
    const value = input[candidate];
    if (isOptionBagValue(value)) {
      Object.assign(nested, value);
    }
  }

  for (const [key, value] of Object.entries(input)) {
    const prefix = namespaces.find((candidate) => key.startsWith(`${candidate}/`));
    if (prefix) {
      prefixed[key.slice(prefix.length + 1)] = value;
    } else if (!namespaces.includes(key) || !isOptionBagValue(value)) {
      local[key] = value;
    }
  }

  const normalized = { ...nested, ...prefixed, ...local };
  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeLocalOptionBag(input: unknown): ExamZhOptionBag | undefined {
  if (!isOptionBag(input)) {
    return undefined;
  }
  return Object.keys(input).length > 0 ? { ...input } : undefined;
}

function migrateHiddenFillinValue(options: ExamZhOptionBag | undefined, scoped = false): void {
  if (!options) {
    return;
  }

  const key = scoped ? 'no-answer-type' : 'fillin/no-answer-type';
  if (options[key] === 'hidden') {
    options[key] = 'none';
  }
}

function compactDocument(document: ExamDocument): ExamDocument {
  return compactObject(document);
}

function compactObject<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}

function omitEmptyArray<T>(value: T[]): T[] | undefined {
  return value.length > 0 ? value : undefined;
}

function isNonEmptyObject(value: object | undefined): boolean {
  return value !== undefined && Object.keys(value).length > 0;
}

function mergeOptionBags(
  lower: ExamZhOptionBag | undefined,
  higher: ExamZhOptionBag | undefined,
): ExamZhOptionBag | undefined {
  const merged = { ...(lower ?? {}), ...(higher ?? {}) };
  return Object.keys(merged).length > 0 ? merged : undefined;
}

function looksLikeStructuredQuestion(input: Record<string, unknown>): boolean {
  return (
    typeof input.type === 'string' &&
    ['singleChoice', 'multipleChoice', 'blank', 'problem', 'rawLatex'].includes(input.type)
  );
}

function readQuestionType(input: unknown): ExamQuestion['type'] {
  return input === 'singleChoice' ||
    input === 'multipleChoice' ||
    input === 'blank' ||
    input === 'problem' ||
    input === 'rawLatex'
    ? input
    : 'rawLatex';
}

function readEnvironment(
  input: unknown,
  type: Exclude<ExamQuestion['type'], 'rawLatex'>,
): ExamQuestion['environment'] | undefined {
  if (input === 'question' || input === 'problem') {
    return input === (type === 'problem' ? 'problem' : 'question') ? undefined : input;
  }
  return undefined;
}

function readSectionKind(input: unknown): ExamSection['kind'] {
  return input === 'singleChoice' ||
    input === 'multipleChoice' ||
    input === 'blank' ||
    input === 'problem' ||
    input === 'custom'
    ? input
    : 'custom';
}

function readBlankSlotType(input: unknown): BlankSlot['type'] {
  return input === 'line' ||
    input === 'paren' ||
    input === 'circle' ||
    input === 'rectangle' ||
    input === 'blank'
    ? input
    : undefined;
}

function readNoAnswerType(input: unknown): BlankSlot['noAnswerType'] {
  return input === 'blacktriangle' || input === 'counter' || input === 'none' ? input : undefined;
}

function readInformationPlacement(input: unknown): FrontMatter['informationPlacement'] {
  return input === 'top' || input === 'belowSubject' ? input : undefined;
}

function readListKind(input: unknown): SubQuestionGroup['listKind'] {
  return input === 'enumerate' ||
    input === 'itemize' ||
    input === 'step' ||
    input === 'method' ||
    input === 'case'
    ? input
    : undefined;
}

function readSubQuestionExportAs(input: unknown): SubQuestionGroup['exportAs'] {
  return input === 'enumerate' || input === 'examZhList' || input === 'rawLatex'
    ? input
    : undefined;
}

function readFigurePosition(
  input: unknown,
): 'top' | 'above' | 'bottom' | 'below' | 'left' | 'right' | undefined {
  return input === 'top' ||
    input === 'above' ||
    input === 'bottom' ||
    input === 'below' ||
    input === 'left' ||
    input === 'right'
    ? input
    : undefined;
}

function readString(input: unknown, fallback: string): string {
  return typeof input === 'string' && input.length > 0 ? input : fallback;
}

function readOptionalString(input: unknown): string | undefined {
  return typeof input === 'string' ? input : undefined;
}

function readOptionalPositiveInteger(input: unknown): number | undefined {
  return typeof input === 'number' && Number.isInteger(input) && input > 0 ? input : undefined;
}

function readOptionalNonnegativeNumber(input: unknown): number | undefined {
  return typeof input === 'number' && input >= 0 ? input : undefined;
}

function isOptionBag(input: unknown): input is ExamZhOptionBag {
  return isRecord(input);
}

function isOptionBagValue(input: unknown): input is ExamZhOptionBag {
  return isRecord(input);
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function isString(input: unknown): input is string {
  return typeof input === 'string';
}
