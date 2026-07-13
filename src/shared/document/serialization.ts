import { parseExamDocument, type ExamDocument } from './schema';
import { migrateExamDocument } from './migrations';
import type {
  ExamQuestion,
  ExamSection,
  ExamZhOptionBag,
  RichContentBlock,
  SubQuestion,
} from './model';
import { normalizeFrontMatterSpacing, normalizeInformationSeparator } from './front-matter-options';

export function deserializeExamDocument(contents: string): ExamDocument {
  return parseExamDocument(migrateExamDocument(JSON.parse(contents)));
}

export function serializeExamDocument(document: ExamDocument): string {
  return `${JSON.stringify(normalizeExamDocument(parseExamDocument(document)), null, 2)}\n`;
}

export function normalizeExamDocument(document: ExamDocument): ExamDocument {
  const setup = { ...document.setup };
  const globalOptions = normalizeGlobalOptions(setup.examZhOptions);
  const extractedPageOptions = extractNamespaceOptions(globalOptions, 'page');
  setup.examZhOptions = extractedPageOptions.remaining;

  if (setup.choices) {
    const choices = {
      ...setup.choices,
      examZhOptions: normalizeScopedOptions(setup.choices.examZhOptions, ['choices']),
    };
    setup.choices = hasDefinedValues(choices) ? choices : undefined;
  }

  if (setup.fillin) {
    const fillin = {
      ...setup.fillin,
      answerColor: setup.fillin.answerColor === 'red' ? ('red' as const) : undefined,
      examZhOptions: normalizeScopedOptions(setup.fillin.examZhOptions, ['fillin']),
    };
    setup.fillin = hasDefinedValues(fillin) ? fillin : undefined;
  }

  if (setup.judgement) {
    const judgement = {
      answerColor: setup.judgement.answerColor === 'red' ? ('red' as const) : undefined,
    };
    setup.judgement = hasDefinedValues(judgement) ? judgement : undefined;
  }

  const pageExamZhOptions = normalizeScopedOptions(setup.page?.examZhOptions, ['page']);
  const mergedPageExamZhOptions = mergeOptions(pageExamZhOptions, extractedPageOptions.scoped);
  const page = setup.page
    ? {
        size: setup.page.size === 'a3paper' ? ('a3paper' as const) : undefined,
        showFooter: setup.page.showFooter === false ? false : undefined,
        footerMode:
          setup.page.footerMode === 'pageOnly' || setup.page.footerMode === 'custom'
            ? setup.page.footerMode
            : undefined,
        footerTemplate: setup.page.footerMode === 'custom' ? setup.page.footerTemplate : undefined,
        a3FooterType: setup.page.a3FooterType === 'common' ? ('common' as const) : undefined,
        showColumnLine: setup.page.showColumnLine === true ? true : undefined,
        examZhOptions: mergedPageExamZhOptions,
      }
    : mergedPageExamZhOptions
      ? { examZhOptions: mergedPageExamZhOptions }
      : undefined;
  setup.page = page && hasDefinedValues(page) ? page : undefined;

  const preface = document.frontMatter.preface?.map(normalizeRichContentBlock);
  const examZh = document.examZh
    ? {
        documentClass: nonEmptyOptions(document.examZh.documentClass),
        rawPreamble:
          document.examZh.rawPreamble && document.examZh.rawPreamble.length > 0
            ? document.examZh.rawPreamble
            : undefined,
      }
    : undefined;
  const normalized: ExamDocument = {
    ...document,
    setup,
    frontMatter: {
      ...document.frontMatter,
      informationFields: document.frontMatter.informationFields.map((field) => {
        if (field.kind === 'squares') {
          return { label: field.label, kind: field.kind, length: field.length };
        }
        if (field.kind === 'line') {
          return { label: field.label, kind: field.kind, width: field.width };
        }
        return { label: field.label, kind: field.kind };
      }),
      informationSeparator: normalizeInformationSeparator(
        document.frontMatter.informationSeparator,
      ),
      informationSpacing: normalizeFrontMatterSpacing(document.frontMatter.informationSpacing),
      warningSpacing: normalizeFrontMatterSpacing(document.frontMatter.warningSpacing),
      notices: document.frontMatter.notices.map(normalizeRichContentBlock),
      preface: preface && preface.length > 0 ? preface : undefined,
    },
    sections: document.sections.map(normalizeSection),
    examZh: examZh && hasDefinedValues(examZh) ? examZh : undefined,
  };

  return parseExamDocument(normalized);
}

function normalizeSection(section: ExamSection): ExamSection {
  const numbering = section.numbering
    ? {
        ...section.numbering,
        examZhOptions: normalizeScopedOptions(section.numbering.examZhOptions, [
          'question',
          'problem',
        ]),
      }
    : undefined;
  return {
    ...section,
    summaryMode: section.summaryMode === 'hidden' ? undefined : section.summaryMode,
    numbering: numbering && hasDefinedValues(numbering) ? numbering : undefined,
    questions: section.questions.map(normalizeQuestion),
  };
}

function normalizeQuestion(question: ExamQuestion): ExamQuestion {
  if (question.type === 'rawLatex') {
    return question;
  }

  const expectedEnvironment = question.type === 'problem' ? 'problem' : 'question';
  const scoreMarks = normalizeScoreMarks(question.scoreMarks);
  const solutionAnnotations = normalizeSolutionAnnotations(question.solutionAnnotations);
  const choicesSetup = question.choicesSetup
    ? {
        ...question.choicesSetup,
        examZhOptions: normalizeScopedOptions(question.choicesSetup.examZhOptions, ['choices']),
      }
    : undefined;
  const normalized: ExamQuestion = {
    ...question,
    environment: question.environment === expectedEnvironment ? undefined : question.environment,
    choices: question.choices?.map((choice) => ({
      ...choice,
      content: choice.content.map(normalizeRichContentBlock),
    })),
    choicesSetup: choicesSetup && hasDefinedValues(choicesSetup) ? choicesSetup : undefined,
    correctChoiceIds:
      question.correctChoiceIds && question.correctChoiceIds.length > 0
        ? question.correctChoiceIds
        : undefined,
    judgement:
      question.type === 'judgement' && question.judgement
        ? compactJudgementQuestionSetup(question.judgement)
        : question.judgement,
    blanks: question.blanks?.map((blank) => ({
      ...blank,
      answer:
        blank.answer && blank.answer.length > 0
          ? blank.answer.map(normalizeRichContentBlock)
          : undefined,
      examZhOptions: normalizeScopedOptions(blank.examZhOptions, ['fillin']),
    })),
    subQuestionGroup: question.subQuestionGroup
      ? {
          ...question.subQuestionGroup,
          items: question.subQuestionGroup.items.map(normalizeSubQuestion),
        }
      : undefined,
    stem: question.stem.map(normalizeRichContentBlock),
    solution:
      question.solution && question.solution.length > 0
        ? question.solution.map(normalizeRichContentBlock)
        : undefined,
    scoreMode: scoreMarks && scoreMarks.length > 0 ? question.scoreMode : undefined,
    scoreMarks: scoreMarks && scoreMarks.length > 0 ? scoreMarks : undefined,
    solutionAnnotations:
      solutionAnnotations && solutionAnnotations.length > 0 ? solutionAnnotations : undefined,
    examZhOptions: normalizeScopedOptions(question.examZhOptions, [
      question.environment ?? (question.type === 'problem' ? 'problem' : 'question'),
    ]),
  };
  return normalized;
}

function compactJudgementQuestionSetup(
  judgement: NonNullable<ExamQuestion['judgement']>,
): ExamQuestion['judgement'] {
  const normalized = {
    correctAnswer: judgement.correctAnswer,
    answerStyle: judgement.answerStyle === 'symbol' ? ('symbol' as const) : undefined,
    placement: judgement.placement === 'inline' ? ('inline' as const) : undefined,
  };
  return hasDefinedValues(normalized) ? normalized : undefined;
}

function normalizeSubQuestion(subQuestion: SubQuestion): SubQuestion {
  const scoreMarks = normalizeScoreMarks(subQuestion.scoreMarks);
  const solutionAnnotations = normalizeSolutionAnnotations(subQuestion.solutionAnnotations);
  return {
    ...subQuestion,
    stem: subQuestion.stem.map(normalizeRichContentBlock),
    solution:
      subQuestion.solution && subQuestion.solution.length > 0
        ? subQuestion.solution.map(normalizeRichContentBlock)
        : undefined,
    scoreMode: scoreMarks && scoreMarks.length > 0 ? subQuestion.scoreMode : undefined,
    scoreMarks: scoreMarks && scoreMarks.length > 0 ? scoreMarks : undefined,
    solutionAnnotations:
      solutionAnnotations && solutionAnnotations.length > 0 ? solutionAnnotations : undefined,
    examZhOptions: normalizeScopedOptions(subQuestion.examZhOptions, ['list']),
  };
}

function normalizeScoreMarks(scoreMarks: ExamQuestion['scoreMarks']): ExamQuestion['scoreMarks'] {
  return scoreMarks?.map((mark) => ({
    ...mark,
    description:
      mark.description && mark.description.length > 0
        ? mark.description.map((item) => ({ ...item }))
        : undefined,
    placement: mark.placement === 'inline' ? 'inline' : undefined,
  }));
}

function normalizeSolutionAnnotations(
  annotations: ExamQuestion['solutionAnnotations'],
): ExamQuestion['solutionAnnotations'] {
  return annotations
    ?.filter((annotation) => annotation.content.length > 0)
    .map((annotation) => ({
      ...annotation,
      content: annotation.content.map((item) => ({ ...item })),
    }));
}

function normalizeRichContentBlock(block: RichContentBlock): RichContentBlock {
  switch (block.type) {
    case 'list':
      return {
        ...block,
        items: block.items.map((item) => item.map(normalizeRichContentBlock)),
        examZhOptions: normalizeScopedOptions(block.examZhOptions, ['list']),
      };
    case 'image':
      return {
        ...block,
        includeGraphicsOptions: nonEmptyOptions(block.includeGraphicsOptions),
        examZhOptions: normalizeScopedOptions(block.examZhOptions, ['textfigure']),
      };
    case 'figureGroup':
      return {
        ...block,
        items: block.items.map((item) => ({
          ...item,
          figure: normalizeRichContentBlock(item.figure) as typeof item.figure,
        })),
        examZhOptions: normalizeScopedOptions(block.examZhOptions, ['multifigures']),
      };
    case 'textFigure':
      return {
        ...block,
        text: block.text.map(normalizeRichContentBlock),
        figure: normalizeRichContentBlock(block.figure) as typeof block.figure,
        examZhOptions: normalizeScopedOptions(block.examZhOptions, ['textfigure']),
      };
    case 'paragraph':
    case 'displayMath':
    case 'rawLatex':
      return block;
  }
}

function nonEmptyOptions(options: ExamZhOptionBag | undefined): ExamZhOptionBag | undefined {
  return options && Object.keys(options).length > 0 ? options : undefined;
}

function normalizeGlobalOptions(options: ExamZhOptionBag | undefined): ExamZhOptionBag | undefined {
  if (!options) {
    return undefined;
  }

  const nested: ExamZhOptionBag = {};
  const direct: ExamZhOptionBag = {};

  for (const [key, value] of Object.entries(options)) {
    if (isOptionBag(value) && !key.includes('/')) {
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        nested[`${key}/${nestedKey}`] = nestedValue;
      }
    } else {
      direct[key] = value;
    }
  }

  return nonEmptyOptions({ ...nested, ...direct });
}

function normalizeScopedOptions(
  options: ExamZhOptionBag | undefined,
  namespaces: string[],
): ExamZhOptionBag | undefined {
  if (!options) {
    return undefined;
  }

  const nested: ExamZhOptionBag = {};
  const prefixed: ExamZhOptionBag = {};
  const local: ExamZhOptionBag = {};

  for (const namespace of namespaces) {
    const value = options[namespace];
    if (isOptionBag(value)) {
      Object.assign(nested, value);
    }
  }

  for (const [key, value] of Object.entries(options)) {
    const namespace = namespaces.find((candidate) => key.startsWith(`${candidate}/`));
    if (namespace) {
      prefixed[key.slice(namespace.length + 1)] = value;
    } else if (!namespaces.includes(key) || !isOptionBag(value)) {
      local[key] = value;
    }
  }

  return nonEmptyOptions({ ...nested, ...prefixed, ...local });
}

function extractNamespaceOptions(
  options: ExamZhOptionBag | undefined,
  namespace: string,
): { remaining?: ExamZhOptionBag; scoped?: ExamZhOptionBag } {
  if (!options) {
    return {};
  }

  const remaining: ExamZhOptionBag = {};
  const scoped: ExamZhOptionBag = {};

  for (const [key, value] of Object.entries(options)) {
    if (key.startsWith(`${namespace}/`)) {
      scoped[key.slice(namespace.length + 1)] = value;
    } else {
      remaining[key] = value;
    }
  }

  return {
    remaining: nonEmptyOptions(remaining),
    scoped: nonEmptyOptions(scoped),
  };
}

function mergeOptions(
  lower: ExamZhOptionBag | undefined,
  higher: ExamZhOptionBag | undefined,
): ExamZhOptionBag | undefined {
  return nonEmptyOptions({ ...(lower ?? {}), ...(higher ?? {}) });
}

function isOptionBag(value: unknown): value is ExamZhOptionBag {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasDefinedValues(value: object): boolean {
  return Object.values(value).some((item) => item !== undefined);
}
