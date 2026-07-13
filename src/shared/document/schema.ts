import { z } from 'zod';

import {
  validateExamZhOptions,
  type ExamZhOptionNamespace,
  type ExamZhOptionTarget,
} from '../exam-zh/options-registry';
import { examZhOptionBagSchema } from '../exam-zh/options-schema';
import { validateFooterTemplate } from './page-options';
import {
  informationSeparatorModes,
  validateInformationSeparatorText,
  validateLatexSkip,
} from './front-matter-options';
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
  type DisplayMathBlock,
  type ExamDocument,
  type ExamMetadata,
  type ExamQuestion,
  type ExamSection,
  type ExamZhOptionBag,
  type FigureGroupBlock,
  type FrontMatter,
  type ImageBlock,
  type InlineContent,
  type InlineRichText,
  type ListBlock,
  type ParagraphBlock,
  type RawLatexBlock,
  type RichContentBlock,
  type ScoreMode,
  type SolutionAnnotation,
  type SubQuestion,
  type SubQuestionGroup,
  type TextFigureBlock,
} from './model';

export {
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
};
export type { ExamDocument, ExamMetadata } from './model';

const metadataSchema: z.ZodType<ExamMetadata> = z
  .object({
    title: z.string().min(1),
    subject: z.string().min(1),
    grade: z.string().optional(),
    semester: z.string().optional(),
    durationMinutes: z.number().int().positive().optional(),
    totalPoints: z.number().nonnegative().optional(),
    author: z.string().optional(),
    notes: z.string().optional(),
  })
  .strict();

const numberingSetupSchema = z
  .object({
    start: z.number().int().positive().optional(),
    reset: z.boolean().optional(),
    examZhOptions: examZhOptionBagSchema.optional(),
  })
  .strict();

const choicesSetupSchema = z
  .object({
    maxColumns: z.number().int().positive().optional(),
    examZhOptions: examZhOptionBagSchema.optional(),
  })
  .strict();

const pageSetupSchema = z
  .object({
    size: z.enum(['a4paper', 'a3paper']).optional(),
    showFooter: z.boolean().optional(),
    footerMode: z.enum(['subject', 'pageOnly', 'custom']).optional(),
    footerTemplate: z.string().min(1).max(200).optional(),
    a3FooterType: z.enum(['separate', 'common']).optional(),
    showColumnLine: z.boolean().optional(),
    examZhOptions: examZhOptionBagSchema.optional(),
  })
  .strict()
  .superRefine((page, ctx) => {
    if (page.footerMode === 'custom' && page.footerTemplate === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['footerTemplate'],
        message: '自定义页脚必须提供模板。',
      });
    }

    if (page.footerMode !== 'custom' && page.footerTemplate !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['footerTemplate'],
        message: '只有自定义页脚可以保存模板。',
      });
    }

    if (page.footerMode === 'custom' && page.footerTemplate !== undefined) {
      const validation = validateFooterTemplate(page.footerTemplate);

      if (!validation.valid) {
        ctx.addIssue({
          code: 'custom',
          path: ['footerTemplate'],
          message: validation.message ?? '页脚模板无效。',
        });
      }
    }
  });

const setupSchema = z
  .object({
    answerMode: z.enum(['student', 'teacher']),
    choices: choicesSetupSchema.optional(),
    fillin: z
      .object({
        type: z.enum(['line', 'paren', 'circle', 'rectangle', 'blank']).optional(),
        width: z.string().optional(),
        answerColor: z.enum(['black', 'red']).optional(),
        examZhOptions: examZhOptionBagSchema.optional(),
      })
      .strict()
      .optional(),
    judgement: z
      .object({
        answerColor: z.enum(['black', 'red']).optional(),
      })
      .strict()
      .optional(),
    page: pageSetupSchema.optional(),
    examZhOptions: examZhOptionBagSchema.optional(),
  })
  .strict();

const inlineRichTextContentSchemas = [
  z.object({ type: z.literal('text'), text: z.string() }).strict(),
  z.object({ type: z.literal('inlineMath'), latex: z.string() }).strict(),
  z.object({ type: z.literal('rawLatex'), latex: z.string() }).strict(),
] as const;

const inlineRichTextSchema: z.ZodType<InlineRichText> = z
  .array(z.discriminatedUnion('type', inlineRichTextContentSchemas))
  .min(1);

const inlineContentSchema = z.discriminatedUnion('type', [
  ...inlineRichTextContentSchemas,
  z.object({ type: z.literal('blankRef'), blankId: z.string().min(1) }).strict(),
  z.object({ type: z.literal('choiceParenRef') }).strict(),
  z.object({ type: z.literal('judgementRef') }).strict(),
  z.object({ type: z.literal('scoreRef'), scoreMarkId: z.string().min(1) }).strict(),
  z.object({ type: z.literal('annotationRef'), annotationId: z.string().min(1) }).strict(),
  z.object({ type: z.literal('stemLine') }).strict(),
]);

const paragraphBlockSchema: z.ZodType<ParagraphBlock> = z
  .object({ type: z.literal('paragraph'), children: z.array(inlineContentSchema) })
  .strict();

const displayMathBlockSchema: z.ZodType<DisplayMathBlock> = z
  .object({ type: z.literal('displayMath'), latex: z.string() })
  .strict();

const rawLatexBlockSchema: z.ZodType<RawLatexBlock> = z
  .object({ type: z.literal('rawLatex'), latex: z.string() })
  .strict();

const imageBlockSchema: z.ZodType<ImageBlock> = z
  .object({
    type: z.literal('image'),
    assetId: z.string().min(1),
    includeGraphicsOptions: examZhOptionBagSchema.optional(),
    caption: z.string().optional(),
    examZhOptions: examZhOptionBagSchema.optional(),
  })
  .strict();

const figureGroupBlockSchema: z.ZodType<FigureGroupBlock> = z.lazy(() =>
  z
    .object({
      type: z.literal('figureGroup'),
      items: z.array(
        z
          .object({
            label: z.string().optional(),
            figure: z.union([imageBlockSchema, rawLatexBlockSchema]),
          })
          .strict(),
      ),
      layout: z
        .object({
          kind: z.literal('multifigures'),
          columns: z.number().int().positive().optional(),
          figPos: z.enum(['top', 'above', 'bottom', 'below', 'left', 'right']).optional(),
        })
        .strict()
        .optional(),
      examZhOptions: examZhOptionBagSchema.optional(),
    })
    .strict(),
);

const textFigureBlockSchema: z.ZodType<TextFigureBlock> = z.lazy(() =>
  z
    .object({
      type: z.literal('textFigure'),
      text: z.array(richContentBlockSchema),
      figure: z.union([imageBlockSchema, figureGroupBlockSchema, rawLatexBlockSchema]),
      layout: z
        .object({
          kind: z.literal('textfigure'),
          figPos: z.string().optional(),
          textWidth: z.string().optional(),
          figureWidth: z.string().optional(),
          ratio: z.string().optional(),
          top: z.number().optional(),
        })
        .strict()
        .optional(),
      examZhOptions: examZhOptionBagSchema.optional(),
    })
    .strict(),
);

const listBlockSchema: z.ZodType<ListBlock> = z.lazy(() =>
  z
    .object({
      type: z.literal('list'),
      kind: z.enum(['enumerate', 'itemize', 'step', 'method', 'case']),
      items: z.array(z.array(richContentBlockSchema)),
      examZhOptions: examZhOptionBagSchema.optional(),
    })
    .strict(),
);

export const richContentBlockSchema: z.ZodType<RichContentBlock> = z.lazy(() =>
  z.union([
    paragraphBlockSchema,
    displayMathBlockSchema,
    imageBlockSchema,
    figureGroupBlockSchema,
    textFigureBlockSchema,
    listBlockSchema,
    rawLatexBlockSchema,
  ]),
);

const frontMatterSpacingSchema = z
  .object({
    top: z.string().min(1),
    bottom: z.string().min(1),
  })
  .strict()
  .superRefine((spacing, ctx) => {
    const topMessage = validateLatexSkip(spacing.top);
    const bottomMessage = validateLatexSkip(spacing.bottom);
    if (topMessage) ctx.addIssue({ code: 'custom', path: ['top'], message: topMessage });
    if (bottomMessage) ctx.addIssue({ code: 'custom', path: ['bottom'], message: bottomMessage });
  });

const frontMatterSchema: z.ZodType<FrontMatter> = z
  .object({
    secret: z.boolean().optional(),
    showTitleBlock: z.boolean().optional(),
    warning: z.string().optional(),
    informationFields: z.array(
      z.discriminatedUnion('kind', [
        z
          .object({
            label: z.string().min(1),
            kind: z.literal('line'),
            width: z.string().optional(),
          })
          .strict(),
        z
          .object({
            label: z.string().min(1),
            kind: z.literal('squares'),
            length: z.number().int().min(1).max(30),
          })
          .strict(),
        z
          .object({
            label: z.string().min(1),
            kind: z.literal('text'),
          })
          .strict(),
      ]),
    ),
    informationPlacement: z.enum(['top', 'belowSubject']).optional(),
    informationSeparator: z
      .object({
        mode: z.enum(informationSeparatorModes),
        text: z.string().optional(),
      })
      .strict()
      .superRefine((separator, ctx) => {
        if (separator.mode === 'custom') {
          const message = validateInformationSeparatorText(separator.text ?? '');
          if (message) ctx.addIssue({ code: 'custom', path: ['text'], message });
        } else if (separator.text !== undefined) {
          ctx.addIssue({
            code: 'custom',
            path: ['text'],
            message: '只有自定义分隔符可以保存文本。',
          });
        }
      })
      .optional(),
    informationSpacing: frontMatterSpacingSchema.optional(),
    warningSpacing: frontMatterSpacingSchema.optional(),
    notices: z.array(richContentBlockSchema),
    preface: z.array(richContentBlockSchema).optional(),
  })
  .strict();

const choiceOptionSchema: z.ZodType<ChoiceOption> = z
  .object({
    id: z.string().min(1),
    label: z.string().optional(),
    content: z.array(richContentBlockSchema),
  })
  .strict();

const blankSlotSchema: z.ZodType<BlankSlot> = z
  .object({
    id: z.string().min(1),
    command: z.enum(['fillin', 'fillin*']).optional(),
    answer: z.array(richContentBlockSchema).optional(),
    width: z.string().optional(),
    type: z.enum(['line', 'paren', 'circle', 'rectangle', 'blank']).optional(),
    noAnswerType: z.enum(['blacktriangle', 'counter', 'none']).optional(),
    widthType: z.enum(['fill', 'normal']).optional(),
    parenType: z.enum(['banjiao', 'quanjiao']).optional(),
    examZhOptions: examZhOptionBagSchema.optional(),
  })
  .strict();

const scoreMarkSchema = z
  .object({
    id: z.string().min(1),
    points: z.number().nonnegative(),
    description: inlineRichTextSchema.optional(),
    placement: z.enum(['summary', 'inline']).optional(),
  })
  .strict();

const solutionAnnotationSchema: z.ZodType<SolutionAnnotation> = z
  .object({
    id: z.string().min(1),
    content: inlineRichTextSchema,
  })
  .strict();

const scoreModeSchema: z.ZodType<ScoreMode> = z.enum(['additive', 'levels']);

const subQuestionSchema: z.ZodType<SubQuestion> = z
  .object({
    id: z.string().min(1),
    label: z.string().optional(),
    stem: z.array(richContentBlockSchema),
    solution: z.array(richContentBlockSchema).optional(),
    scoreMode: scoreModeSchema.optional(),
    scoreMarks: z.array(scoreMarkSchema).optional(),
    solutionAnnotations: z.array(solutionAnnotationSchema).optional(),
    examZhOptions: examZhOptionBagSchema.optional(),
  })
  .strict();

const subQuestionGroupSchema: z.ZodType<SubQuestionGroup> = z
  .object({
    items: z.array(subQuestionSchema),
    exportAs: z.enum(['enumerate', 'examZhList', 'rawLatex']).optional(),
    listKind: z.enum(['enumerate', 'itemize', 'step', 'method', 'case']).optional(),
    rawLatex: z.string().optional(),
  })
  .strict();

const examQuestionSchema: z.ZodType<ExamQuestion> = z
  .object({
    id: z.string().min(1),
    type: z.enum(['singleChoice', 'multipleChoice', 'blank', 'judgement', 'problem', 'rawLatex']),
    environment: z.enum(['question', 'problem']).optional(),
    index: z.number().int().positive().optional(),
    points: z.number().nonnegative().optional(),
    stem: z.array(richContentBlockSchema),
    choices: z.array(choiceOptionSchema).optional(),
    choicesSetup: choicesSetupSchema.optional(),
    correctChoiceIds: z.array(z.string().min(1)).optional(),
    blanks: z.array(blankSlotSchema).optional(),
    judgement: z
      .object({
        correctAnswer: z.boolean().optional(),
        answerStyle: z.enum(['text', 'symbol']).optional(),
        placement: z.enum(['lineEnd', 'inline']).optional(),
      })
      .strict()
      .optional(),
    subQuestionGroup: subQuestionGroupSchema.optional(),
    solution: z.array(richContentBlockSchema).optional(),
    scoreMode: scoreModeSchema.optional(),
    scoreMarks: z.array(scoreMarkSchema).optional(),
    solutionAnnotations: z.array(solutionAnnotationSchema).optional(),
    rawLatex: z.string().optional(),
    examZhOptions: examZhOptionBagSchema.optional(),
  })
  .strict()
  .superRefine(validateQuestionShape);

const sectionSchema: z.ZodType<ExamSection> = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    kind: z.enum(['singleChoice', 'multipleChoice', 'blank', 'judgement', 'problem', 'custom']),
    defaultPoints: z.number().nonnegative().optional(),
    summaryMode: z.enum(['hidden', 'questionCount', 'questionCountAndPoints']).optional(),
    numbering: numberingSetupSchema.optional(),
    questions: z.array(examQuestionSchema),
  })
  .strict();

const assetSchema: z.ZodType<Asset> = z
  .object({
    id: z.string().min(1),
    kind: z.literal('image'),
    sourcePath: z.string().optional(),
    exportPath: z.string().optional(),
    alt: z.string().optional(),
  })
  .strict();

export const examDocumentSchema: z.ZodType<ExamDocument> = z
  .object({
    schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
    documentId: z.string().min(1),
    metadata: metadataSchema,
    setup: setupSchema,
    frontMatter: frontMatterSchema,
    sections: z.array(sectionSchema),
    assets: z.array(assetSchema),
    examZh: z
      .object({
        documentClass: examZhOptionBagSchema.optional(),
        rawPreamble: z.array(z.string()).optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .superRefine(validateDocumentOptions);

export function parseExamDocument(input: unknown): ExamDocument {
  return examDocumentSchema.parse(input);
}

export function safeParseExamDocument(
  input: unknown,
): ReturnType<typeof examDocumentSchema.safeParse> {
  return examDocumentSchema.safeParse(input);
}

function validateQuestionShape(question: ExamQuestion, context: z.RefinementCtx): void {
  const choiceIds = question.correctChoiceIds ?? [];
  const isChoice = question.type === 'singleChoice' || question.type === 'multipleChoice';

  if (question.type === 'singleChoice' && choiceIds.length > 1) {
    context.addIssue({
      code: 'custom',
      path: ['correctChoiceIds'],
      message: 'Single-choice questions can only have one selected answer.',
    });
  }

  if (isChoice && (question.choices?.length ?? 0) === 0) {
    context.addIssue({
      code: 'custom',
      path: ['choices'],
      message: '选择题至少需要一个选项。',
    });
  }

  if (isChoice) {
    const validChoiceIds = new Set(question.choices?.map((choice) => choice.id) ?? []);

    for (const choiceId of choiceIds) {
      if (!validChoiceIds.has(choiceId)) {
        context.addIssue({
          code: 'custom',
          path: ['correctChoiceIds'],
          message: `Choice answer "${choiceId}" does not match a choice id.`,
        });
      }
    }
  }

  if (question.type === 'blank' && (question.blanks?.length ?? 0) === 0) {
    context.addIssue({
      code: 'custom',
      path: ['blanks'],
      message: '填空题至少需要一个填空项。',
    });
  }

  if (isChoice) {
    addForbiddenQuestionFields(context, question, [
      'blanks',
      'judgement',
      'subQuestionGroup',
      'rawLatex',
    ]);
  } else if (question.type === 'blank') {
    addForbiddenQuestionFields(context, question, [
      'choices',
      'choicesSetup',
      'correctChoiceIds',
      'judgement',
      'subQuestionGroup',
      'rawLatex',
    ]);
  } else if (question.type === 'judgement') {
    addForbiddenQuestionFields(context, question, [
      'choices',
      'choicesSetup',
      'correctChoiceIds',
      'blanks',
      'subQuestionGroup',
      'rawLatex',
    ]);

    if (question.environment === 'problem') {
      context.addIssue({
        code: 'custom',
        path: ['environment'],
        message: '判断题固定使用 question 环境。',
      });
    }
  } else if (question.type === 'problem') {
    addForbiddenQuestionFields(context, question, [
      'choices',
      'choicesSetup',
      'correctChoiceIds',
      'blanks',
      'judgement',
      'rawLatex',
    ]);
  } else {
    if (!question.rawLatex?.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['rawLatex'],
        message: '原始 LaTeX 题必须包含非空 rawLatex。',
      });
    }

    if (question.stem.length > 0) {
      context.addIssue({
        code: 'custom',
        path: ['stem'],
        message: '原始 LaTeX 题不能携带不会被导出的结构化题干。',
      });
    }

    addForbiddenQuestionFields(context, question, [
      'environment',
      'index',
      'points',
      'choices',
      'choicesSetup',
      'correctChoiceIds',
      'blanks',
      'judgement',
      'subQuestionGroup',
      'solution',
      'scoreMode',
      'scoreMarks',
      'solutionAnnotations',
      'examZhOptions',
    ]);
  }

  const validBlankIds = new Set(question.blanks?.map((blank) => blank.id) ?? []);

  for (const blankRefId of collectBlankRefIdsFromQuestion(question)) {
    if (!validBlankIds.has(blankRefId)) {
      context.addIssue({
        code: 'custom',
        path: ['stem'],
        message: `填空引用“${blankRefId}”没有对应的填空项。`,
      });
    }
  }

  const stemChoiceParenRefCount = collectChoiceParenRefCount(question.stem);

  if (
    question.type !== 'singleChoice' &&
    question.type !== 'multipleChoice' &&
    stemChoiceParenRefCount > 0
  ) {
    context.addIssue({
      code: 'custom',
      path: ['stem'],
      message: '选择括号占位只能用于单选题或多选题题干。',
    });
  }

  if (stemChoiceParenRefCount > 1) {
    context.addIssue({
      code: 'custom',
      path: ['stem'],
      message: '选择题只能有一个选择括号位置。',
    });
  }

  if (collectChoiceParenRefCountFromNonStemQuestionContent(question) > 0) {
    context.addIssue({
      code: 'custom',
      path: ['stem'],
      message: '选择括号占位只能用于单选题或多选题题干。',
    });
  }

  const stemJudgementRefCount = collectJudgementRefCount(question.stem);
  const judgementPlacement = question.judgement?.placement ?? 'lineEnd';

  if (question.type !== 'judgement' && stemJudgementRefCount > 0) {
    context.addIssue({
      code: 'custom',
      path: ['stem'],
      message: '判断括号占位只能用于判断题题干。',
    });
  }

  if (stemJudgementRefCount > 1) {
    context.addIssue({
      code: 'custom',
      path: ['stem'],
      message: '判断题只能有一个判断括号位置。',
    });
  }

  if (
    question.type === 'judgement' &&
    judgementPlacement === 'lineEnd' &&
    stemJudgementRefCount > 0
  ) {
    context.addIssue({
      code: 'custom',
      path: ['stem'],
      message: '行末判断括号由导出器自动追加，不能使用判断括号占位。',
    });
  }

  if (collectJudgementRefCountFromNonStemQuestionContent(question) > 0) {
    context.addIssue({
      code: 'custom',
      path: ['stem'],
      message: '判断括号占位只能用于判断题题干。',
    });
  }

  if (collectStemLineCountFromNonStemQuestionContent(question) > 0) {
    context.addIssue({
      code: 'custom',
      path: ['stem'],
      message: '题干横线占位只能用于题干类文本。',
    });
  }

  validateTeacherContentReferences(
    question.solution ?? [],
    question.scoreMarks ?? [],
    question.solutionAnnotations ?? [],
    ['solution'],
    context,
  );

  question.subQuestionGroup?.items.forEach((item, index) => {
    validateTeacherContentReferences(
      item.solution ?? [],
      item.scoreMarks ?? [],
      item.solutionAnnotations ?? [],
      ['subQuestionGroup', 'items', index, 'solution'],
      context,
    );
  });

  const forbiddenTeacherRefs = collectTeacherContentRefs([
    ...question.stem,
    ...(question.choices ?? []).flatMap((choice) => choice.content),
    ...(question.blanks ?? []).flatMap((blank) => blank.answer ?? []),
    ...(question.subQuestionGroup?.items ?? []).flatMap((item) => item.stem),
  ]);

  if (
    forbiddenTeacherRefs.scoreMarkIds.length > 0 ||
    forbiddenTeacherRefs.annotationIds.length > 0
  ) {
    context.addIssue({
      code: 'custom',
      path: ['solution'],
      message: '评分点和解析批注引用只能用于所属题目或小题的解析。',
    });
  }
}

function validateTeacherContentReferences(
  solution: RichContentBlock[],
  scoreMarks: ExamQuestion['scoreMarks'],
  annotations: ExamQuestion['solutionAnnotations'],
  path: Array<string | number>,
  context: z.RefinementCtx,
): void {
  const refs = collectTeacherContentRefs(solution);
  const scoreIds = new Set(scoreMarks?.map((item) => item.id) ?? []);
  const annotationIds = new Set(annotations?.map((item) => item.id) ?? []);

  if (scoreIds.size !== (scoreMarks?.length ?? 0)) {
    context.addIssue({
      code: 'custom',
      path: [...path, 'scoreMarks'],
      message: '评分项 ID 不能重复。',
    });
  }

  if (annotationIds.size !== (annotations?.length ?? 0)) {
    context.addIssue({
      code: 'custom',
      path: [...path, 'solutionAnnotations'],
      message: '解析批注 ID 不能重复。',
    });
  }

  validateReferenceIds(refs.scoreMarkIds, scoreIds, '评分项', [...path, 'scoreMarks'], context);
  validateReferenceIds(
    refs.annotationIds,
    annotationIds,
    '解析批注',
    [...path, 'solutionAnnotations'],
    context,
  );
}

function validateReferenceIds(
  referenceIds: string[],
  validIds: Set<string>,
  label: string,
  path: Array<string | number>,
  context: z.RefinementCtx,
): void {
  const counts = new Map<string, number>();

  for (const id of referenceIds) {
    counts.set(id, (counts.get(id) ?? 0) + 1);

    if (!validIds.has(id)) {
      context.addIssue({ code: 'custom', path, message: `${label}引用“${id}”没有对应对象。` });
    }
  }

  for (const [id, count] of counts) {
    if (count > 1) {
      context.addIssue({ code: 'custom', path, message: `${label}“${id}”只能在解析中引用一次。` });
    }
  }
}

function collectTeacherContentRefs(blocks: RichContentBlock[]): {
  scoreMarkIds: string[];
  annotationIds: string[];
} {
  const scoreMarkIds: string[] = [];
  const annotationIds: string[] = [];

  const visit = (items: RichContentBlock[]): void => {
    for (const block of items) {
      if (block.type === 'paragraph') {
        for (const child of block.children) {
          if (child.type === 'scoreRef') scoreMarkIds.push(child.scoreMarkId);
          if (child.type === 'annotationRef') annotationIds.push(child.annotationId);
        }
      } else if (block.type === 'list') {
        block.items.forEach(visit);
      } else if (block.type === 'textFigure') {
        visit(block.text);
      }
    }
  };

  visit(blocks);
  return { scoreMarkIds, annotationIds };
}

function addForbiddenQuestionFields(
  context: z.RefinementCtx,
  question: ExamQuestion,
  fields: Array<keyof ExamQuestion>,
): void {
  for (const field of fields) {
    if (question[field] !== undefined) {
      context.addIssue({
        code: 'custom',
        path: [field],
        message: `题型“${question.type}”不允许字段“${field}”。`,
      });
    }
  }
}

function collectChoiceParenRefCount(blocks: RichContentBlock[]): number {
  return blocks.reduce((count, block) => count + collectChoiceParenRefCountFromBlock(block), 0);
}

function collectChoiceParenRefCountFromBlock(block: RichContentBlock): number {
  switch (block.type) {
    case 'paragraph':
      return block.children.filter((child) => child.type === 'choiceParenRef').length;
    case 'list':
      return block.items.reduce((count, item) => count + collectChoiceParenRefCount(item), 0);
    case 'textFigure':
      return collectChoiceParenRefCount(block.text);
    case 'figureGroup':
    case 'image':
    case 'displayMath':
    case 'rawLatex':
      return 0;
  }
}

function collectChoiceParenRefCountFromNonStemQuestionContent(question: ExamQuestion): number {
  return [
    ...(question.choices ?? []).flatMap((choice) => choice.content),
    ...(question.solution ?? []),
    ...(question.subQuestionGroup?.items ?? []).flatMap((subQuestion) => [
      ...subQuestion.stem,
      ...(subQuestion.solution ?? []),
    ]),
  ].reduce((count, block) => count + collectChoiceParenRefCountFromBlock(block), 0);
}

function collectJudgementRefCount(blocks: RichContentBlock[]): number {
  return blocks.reduce((count, block) => count + collectJudgementRefCountFromBlock(block), 0);
}

function collectJudgementRefCountFromBlock(block: RichContentBlock): number {
  switch (block.type) {
    case 'paragraph':
      return block.children.filter((child) => child.type === 'judgementRef').length;
    case 'list':
      return block.items.reduce((count, item) => count + collectJudgementRefCount(item), 0);
    case 'textFigure':
      return collectJudgementRefCount(block.text);
    case 'figureGroup':
    case 'image':
    case 'displayMath':
    case 'rawLatex':
      return 0;
  }
}

function collectJudgementRefCountFromNonStemQuestionContent(question: ExamQuestion): number {
  return [
    ...(question.choices ?? []).flatMap((choice) => choice.content),
    ...(question.solution ?? []),
    ...(question.subQuestionGroup?.items ?? []).flatMap((subQuestion) => [
      ...subQuestion.stem,
      ...(subQuestion.solution ?? []),
    ]),
  ].reduce((count, block) => count + collectJudgementRefCountFromBlock(block), 0);
}

function collectStemLineCountFromNonStemQuestionContent(question: ExamQuestion): number {
  return [
    ...(question.choices ?? []).flatMap((choice) => choice.content),
    ...(question.solution ?? []),
    ...(question.subQuestionGroup?.items ?? []).flatMap((subQuestion) => [
      ...(subQuestion.solution ?? []),
    ]),
  ].reduce((count, block) => count + collectStemLineCountFromBlock(block), 0);
}

function collectStemLineCountFromBlock(block: RichContentBlock): number {
  switch (block.type) {
    case 'paragraph':
      return block.children.filter((child) => child.type === 'stemLine').length;
    case 'list':
      return block.items.reduce((count, item) => count + collectStemLineCount(item), 0);
    case 'textFigure':
      return collectStemLineCount(block.text);
    case 'figureGroup':
    case 'image':
    case 'displayMath':
    case 'rawLatex':
      return 0;
  }
}

function collectStemLineCount(blocks: RichContentBlock[]): number {
  return blocks.reduce((count, block) => count + collectStemLineCountFromBlock(block), 0);
}

function collectBlankRefIdsFromQuestion(question: ExamQuestion): string[] {
  return [
    ...collectBlankRefIds(question.stem),
    ...(question.choices ?? []).flatMap((choice) => collectBlankRefIds(choice.content)),
    ...collectBlankRefIds(question.solution ?? []),
    ...(question.subQuestionGroup?.items ?? []).flatMap((subQuestion) => [
      ...collectBlankRefIds(subQuestion.stem),
      ...collectBlankRefIds(subQuestion.solution ?? []),
    ]),
  ];
}

function collectBlankRefIds(blocks: RichContentBlock[]): string[] {
  return blocks.flatMap(collectBlankRefIdsFromBlock);
}

function collectBlankRefIdsFromBlock(block: RichContentBlock): string[] {
  switch (block.type) {
    case 'paragraph':
      return block.children.flatMap(collectBlankRefIdsFromInlineContent);
    case 'list':
      return block.items.flatMap((item) => collectBlankRefIds(item));
    case 'textFigure':
      return collectBlankRefIds(block.text);
    case 'figureGroup':
    case 'image':
    case 'displayMath':
    case 'rawLatex':
      return [];
  }
}

function collectBlankRefIdsFromInlineContent(content: InlineContent): string[] {
  return content.type === 'blankRef' ? [content.blankId] : [];
}

function validateDocumentOptions(document: ExamDocument, context: z.RefinementCtx): void {
  const frontMatterBlocks = [
    ...document.frontMatter.notices,
    ...(document.frontMatter.preface ?? []),
  ];

  if (
    collectChoiceParenRefCount(frontMatterBlocks) > 0 ||
    collectStemLineCount(frontMatterBlocks) > 0 ||
    collectTeacherContentRefs(frontMatterBlocks).scoreMarkIds.length > 0 ||
    collectTeacherContentRefs(frontMatterBlocks).annotationIds.length > 0
  ) {
    context.addIssue({
      code: 'custom',
      path: ['frontMatter'],
      message: '试卷片段占位只能用于题目内容。',
    });
  }

  addOptionIssues(
    context,
    ['examZh', 'documentClass'],
    'documentClass',
    'documentClass',
    document.examZh?.documentClass,
  );
  addOptionIssues(
    context,
    ['setup', 'examZhOptions'],
    'examsetup',
    'examsetup',
    document.setup.examZhOptions,
  );
  addOptionIssues(
    context,
    ['setup', 'fillin', 'examZhOptions'],
    'fillin',
    'examsetup',
    document.setup.fillin?.examZhOptions,
  );

  document.sections.forEach((section, sectionIndex) => {
    section.questions.forEach((question, questionIndex) => {
      const questionNamespace =
        question.environment ?? (question.type === 'problem' ? 'problem' : 'question');

      addOptionIssues(
        context,
        ['sections', sectionIndex, 'questions', questionIndex, 'examZhOptions'],
        questionNamespace,
        'environment',
        question.examZhOptions,
      );

      question.blanks?.forEach((blank, blankIndex) => {
        addOptionIssues(
          context,
          [
            'sections',
            sectionIndex,
            'questions',
            questionIndex,
            'blanks',
            blankIndex,
            'examZhOptions',
          ],
          'fillin',
          'command',
          blank.examZhOptions,
        );
      });

      question.stem.forEach((block, blockIndex) =>
        addRichContentOptionIssues(context, block, [
          'sections',
          sectionIndex,
          'questions',
          questionIndex,
          'stem',
          blockIndex,
        ]),
      );
    });
  });
}

function addRichContentOptionIssues(
  context: z.RefinementCtx,
  block: RichContentBlock,
  path: Array<string | number>,
): void {
  if (block.type === 'list') {
    addOptionIssues(
      context,
      [...path, 'examZhOptions'],
      'list',
      'environment',
      block.examZhOptions,
    );
    block.items.forEach((item, itemIndex) =>
      item.forEach((child, childIndex) =>
        addRichContentOptionIssues(context, child, [...path, 'items', itemIndex, childIndex]),
      ),
    );
  }

  if (block.type === 'image') {
    addOptionIssues(
      context,
      [...path, 'examZhOptions'],
      'textfigure',
      'command',
      block.examZhOptions,
    );
  }

  if (block.type === 'figureGroup') {
    addOptionIssues(
      context,
      [...path, 'examZhOptions'],
      'multifigures',
      'environment',
      block.examZhOptions,
    );
  }

  if (block.type === 'textFigure') {
    addOptionIssues(
      context,
      [...path, 'examZhOptions'],
      'textfigure',
      'command',
      block.examZhOptions,
    );
    block.text.forEach((child, childIndex) =>
      addRichContentOptionIssues(context, child, [...path, 'text', childIndex]),
    );
  }
}

function addOptionIssues(
  context: z.RefinementCtx,
  path: Array<string | number>,
  namespace: ExamZhOptionNamespace,
  target: ExamZhOptionTarget,
  options: ExamZhOptionBag | undefined,
): void {
  const result = validateExamZhOptions(namespace, target, options);

  for (const diagnostic of result.diagnostics) {
    if (diagnostic.severity === 'error') {
      context.addIssue({
        code: 'custom',
        path,
        message: diagnostic.message,
      });
    }
  }
}
