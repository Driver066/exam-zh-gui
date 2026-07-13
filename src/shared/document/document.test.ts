import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { createEmptyExamDocument } from './factory';
import { ExamDocumentMigrationError } from './migrations';
import { deserializeExamDocument, serializeExamDocument } from './serialization';
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
  parseExamDocument,
  safeParseExamDocument,
  type ExamDocument,
} from './schema';

const fixturesDirectory = new URL('../../../fixtures/documents/', import.meta.url);

describe('exam document model', () => {
  it('creates an empty current-version document', () => {
    const document = createEmptyExamDocument('doc-test');

    expect(document).toMatchObject({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      documentId: 'doc-test',
      metadata: {
        title: '未命名试卷',
        subject: '数学',
      },
      setup: {
        answerMode: 'student',
      },
      frontMatter: {
        informationFields: [],
        notices: [],
      },
      sections: [],
      assets: [],
    });
  });

  it('validates a current .examzh.json document', () => {
    const document = createEmptyExamDocument('doc-valid');

    expect(() => parseExamDocument(document)).not.toThrow();
    expect(safeParseExamDocument(document).success).toBe(true);
  });

  it('rejects unknown current-schema fields instead of stripping them', () => {
    const document = createEmptyExamDocument('doc-strict-current') as unknown as Record<
      string,
      unknown
    >;
    document.metadata = {
      ...(document.metadata as Record<string, unknown>),
      legacyDisplayTitle: '不应静默保留',
    };

    expect(safeParseExamDocument(document).success).toBe(false);
  });

  it('rejects legacy answer containers in current documents', () => {
    const document = createEmptyExamDocument('doc-no-legacy-answer') as unknown as Record<
      string,
      unknown
    >;
    document.sections = [
      {
        id: 'section-choice',
        title: '选择题',
        kind: 'singleChoice',
        questions: [
          {
            id: 'q-choice',
            type: 'singleChoice',
            stem: [],
            choices: [{ id: 'choice-a', content: [] }],
            answer: { choiceKeys: ['choice-a'] },
          },
        ],
      },
    ];

    expect(safeParseExamDocument(document).success).toBe(false);
  });

  it('enforces type-specific question fields at runtime', () => {
    const invalidQuestions = [
      { id: 'choice-without-options', type: 'singleChoice', stem: [] },
      { id: 'blank-without-slots', type: 'blank', stem: [] },
      {
        id: 'problem-with-choices',
        type: 'problem',
        stem: [],
        choices: [{ id: 'choice-a', content: [] }],
      },
      {
        id: 'raw-with-structured-stem',
        type: 'rawLatex',
        stem: [{ type: 'paragraph', children: [{ type: 'text', text: '被忽略的题干' }] }],
        rawLatex: '\\customquestion',
      },
      { id: 'raw-without-source', type: 'rawLatex', stem: [], rawLatex: '' },
    ];

    for (const question of invalidQuestions) {
      const document = createEmptyExamDocument(`doc-${question.id}`) as unknown as Record<
        string,
        unknown
      >;
      document.sections = [
        {
          id: 'section-invalid-shape',
          title: '题型约束',
          kind: 'custom',
          questions: [question],
        },
      ];

      expect(safeParseExamDocument(document).success, question.id).toBe(false);
    }
  });

  it('rejects hidden no-answer fillin options in the current schema', () => {
    const document = createEmptyExamDocument('doc-hidden-no-answer') as unknown as Record<
      string,
      unknown
    >;
    document.sections = [
      {
        id: 'section-blank',
        title: '填空题',
        kind: 'blank',
        questions: [
          {
            id: 'q-hidden-no-answer',
            type: 'blank',
            stem: [{ type: 'paragraph', children: [{ type: 'text', text: '填空。' }] }],
            blanks: [{ id: 'blank-hidden', noAnswerType: 'hidden' }],
          },
        ],
      },
    ];

    expect(safeParseExamDocument(document).success).toBe(false);
  });

  it('validates scoped setup fillin options against the registry', () => {
    const document = createEmptyExamDocument('doc-invalid-setup-fillin');
    document.setup.fillin = {
      examZhOptions: { type: 'unsupported' },
    };

    expect(safeParseExamDocument(document).success).toBe(false);
  });

  it('migrates Phase 6 hidden fillin values to none across semantic and option paths', () => {
    const document = {
      ...createEmptyExamDocument('doc-phase6-hidden-fillin'),
      schemaVersion: PHASE6_SCHEMA_VERSION,
      setup: {
        answerMode: 'student',
        fillin: {
          type: 'line',
          examZhOptions: {
            'no-answer-type': 'hidden',
            'text-color': 'red',
          },
        },
        examZhOptions: {
          'fillin/no-answer-type': 'hidden',
          fillin: {
            'no-answer-type': 'hidden',
            depth: '.5em',
          },
          'draft/show-draft': 'manual',
        },
      },
      examZh: {
        documentClass: {},
        preambleSetup: {
          'fillin/no-answer-type': 'hidden',
          fillin: {
            'no-answer-type': 'hidden',
            'box-color': 'blue',
          },
        },
        rawPreamble: [],
      },
      sections: [
        {
          id: 'section-blank',
          title: '填空题',
          kind: 'blank',
          questions: [
            {
              id: 'q-hidden-no-answer',
              type: 'blank',
              stem: [{ type: 'paragraph', children: [{ type: 'blankRef', blankId: 'blank-1' }] }],
              blanks: [
                {
                  id: 'blank-1',
                  noAnswerType: 'hidden',
                  answer: [{ type: 'paragraph', children: [{ type: 'text', text: '答案' }] }],
                  examZhOptions: {
                    'no-answer-type': 'hidden',
                    'custom-key': 'preserved',
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    const migrated = deserializeExamDocument(JSON.stringify(document));
    const blank = migrated.sections[0]?.questions[0]?.blanks?.[0];

    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.setup.fillin?.examZhOptions).toEqual({
      'no-answer-type': 'none',
    });
    expect(migrated.setup.fillin?.answerColor).toBe('red');
    expect(migrated.setup.examZhOptions).toEqual({
      'fillin/no-answer-type': 'none',
      'fillin/box-color': 'blue',
      'fillin/depth': '.5em',
      'draft/show-draft': 'manual',
    });
    expect(blank).toMatchObject({
      id: 'blank-1',
      noAnswerType: 'none',
      examZhOptions: { 'no-answer-type': 'none', 'custom-key': 'preserved' },
      answer: [{ type: 'paragraph', children: [{ type: 'text', text: '答案' }] }],
    });
  });

  it('accepts front matter information placement without a schema bump', () => {
    const document = createEmptyExamDocument('doc-information-placement');
    document.frontMatter.informationPlacement = 'belowSubject';
    document.frontMatter.informationFields = [{ label: '姓名：', kind: 'line', width: '6em' }];

    expect(document.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(safeParseExamDocument(document).success).toBe(true);
    expect(deserializeExamDocument(serializeExamDocument(document))).toEqual(document);
  });

  it('accepts front matter title visibility and warning without a schema bump', () => {
    const document = createEmptyExamDocument('doc-front-matter-title-warning');
    document.frontMatter.showTitleBlock = false;
    document.frontMatter.warning = '请勿提前翻阅试卷。';

    expect(document.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(safeParseExamDocument(document).success).toBe(true);
    expect(deserializeExamDocument(serializeExamDocument(document))).toEqual(document);
  });

  it('round trips section numbering settings without a schema bump', () => {
    const document = createEmptyExamDocument('doc-section-numbering');
    document.sections = [
      {
        id: 'section-numbering',
        title: '选择题',
        kind: 'singleChoice',
        numbering: {
          reset: true,
          start: 5,
          examZhOptions: { label: '\\Alph*.' },
        },
        questions: [],
      },
    ];

    expect(document.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(safeParseExamDocument(document).success).toBe(true);
    expect(deserializeExamDocument(serializeExamDocument(document))).toEqual(document);
  });

  it('rejects unsupported schema versions', () => {
    const document = {
      ...createEmptyExamDocument('doc-invalid'),
      schemaVersion: '99.0.0',
    };

    expect(safeParseExamDocument(document).success).toBe(false);
    expect(() => deserializeExamDocument(JSON.stringify(document))).toThrow(
      'Unsupported exam document schema version: 99.0.0',
    );
  });

  it('migrates a Phase 1 minimum document to the current version', () => {
    const legacyDocument = {
      schemaVersion: PHASE1_SCHEMA_VERSION,
      documentId: 'legacy-doc',
      metadata: {
        title: '旧版试卷',
        subject: '数学',
      },
      setup: {
        answerMode: 'teacher',
      },
      frontMatter: {
        informationFields: [],
        notices: [],
        preface: [],
      },
      sections: [
        {
          id: 'legacy-section',
          title: '旧版节',
          kind: 'custom',
          questions: [],
        },
      ],
      assets: [
        {
          id: 'legacy-asset',
          kind: 'image',
          sourcePath: 'assets/legacy.png',
        },
      ],
    };

    const migrated = deserializeExamDocument(JSON.stringify(legacyDocument));

    expect(migrated).toMatchObject({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      documentId: 'legacy-doc',
      metadata: {
        title: '旧版试卷',
        subject: '数学',
      },
      setup: {
        answerMode: 'teacher',
      },
      sections: [
        {
          id: 'legacy-section',
          title: '旧版节',
        },
      ],
      assets: [
        {
          id: 'legacy-asset',
          kind: 'image',
          sourcePath: 'assets/legacy.png',
        },
      ],
    });
  });

  it('keeps migration entrypoints for every historical schema version', () => {
    const versions = [
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
    ];

    for (const schemaVersion of versions) {
      const migrated = deserializeExamDocument(
        JSON.stringify({
          schemaVersion,
          documentId: `legacy-${schemaVersion}`,
          metadata: { title: '旧版试卷', subject: '数学' },
          setup: { answerMode: 'student' },
          frontMatter: { informationFields: [], notices: [] },
          sections: [],
          assets: [],
        }),
      );

      expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    }
  });

  it('migrates a strict Phase 8 document without rewriting its data', () => {
    const phase8Document = {
      ...createEmptyExamDocument('phase8-doc'),
      schemaVersion: PHASE8_SCHEMA_VERSION,
      setup: {
        answerMode: 'teacher' as const,
        examZhOptions: { 'paren/text-color': 'red' },
      },
      sections: [
        {
          id: 'section-choice',
          title: '选择题',
          kind: 'singleChoice' as const,
          questions: [
            {
              id: 'choice-question',
              type: 'singleChoice' as const,
              stem: [],
              choices: [{ id: 'choice-a', content: [] }],
              correctChoiceIds: ['choice-a'],
            },
          ],
        },
      ],
    };

    const migrated = deserializeExamDocument(JSON.stringify(phase8Document));

    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.sections[0]?.questions[0]?.correctChoiceIds).toEqual(['choice-a']);
    expect(migrated.setup.examZhOptions).toEqual({ 'paren/text-color': 'red' });
  });

  it('migrates Phase 12 information squares and semantic fillin answer color', () => {
    const phase12Document = {
      ...createEmptyExamDocument('phase12-display-doc'),
      schemaVersion: PHASE12_SCHEMA_VERSION,
      setup: {
        answerMode: 'student',
        fillin: {
          examZhOptions: {
            'text-color': 'red',
            'box-color': 'blue',
          },
        },
      },
      frontMatter: {
        informationFields: [
          { label: '考号：', kind: 'squares', length: 8, width: '2em' },
          { label: '座号：', kind: 'squares', width: '7em' },
          { label: '编号：', kind: 'squares', width: 'auto' },
        ],
        notices: [],
      },
      sections: [
        {
          id: 'legacy-section',
          title: '选择题',
          kind: 'singleChoice',
          questions: [],
        },
      ],
    };

    const migrated = deserializeExamDocument(JSON.stringify(phase12Document));

    expect(migrated.frontMatter.informationFields).toEqual([
      { label: '考号：', kind: 'squares', length: 8 },
      { label: '座号：', kind: 'squares', length: 5 },
      { label: '编号：', kind: 'squares', length: 4 },
    ]);
    expect(migrated.setup.fillin).toEqual({
      answerColor: 'red',
      examZhOptions: { 'box-color': 'blue' },
    });
    expect(migrated.sections[0]?.summaryMode).toBeUndefined();
  });

  it('requires current information square fields to use a bounded integer count', () => {
    const document = createEmptyExamDocument('current-square-shape');
    document.frontMatter.informationFields = [{ label: '考号：', kind: 'squares', length: 8 }];
    expect(safeParseExamDocument(document).success).toBe(true);

    const legacyWidth = structuredClone(document) as unknown as Record<string, unknown>;
    legacyWidth.frontMatter = {
      informationFields: [{ label: '考号：', kind: 'squares', width: '8em' }],
      notices: [],
    };
    expect(safeParseExamDocument(legacyWidth).success).toBe(false);

    const outOfRange = structuredClone(document);
    outOfRange.frontMatter.informationFields = [{ label: '考号：', kind: 'squares', length: 31 }];
    expect(safeParseExamDocument(outOfRange).success).toBe(false);
  });

  it('migrates Phase 9 page passthrough options into the scoped page bag', () => {
    const phase9Document = {
      ...createEmptyExamDocument('phase9-page-doc'),
      schemaVersion: PHASE9_SCHEMA_VERSION,
      setup: {
        answerMode: 'student' as const,
        examZhOptions: {
          page: { 'show-foot': false, 'head-content': '页眉' },
          'page/show-foot': true,
          'page/size': 'a3paper',
          'draft/show-draft': 'manual',
        },
      },
    };

    const migrated = deserializeExamDocument(JSON.stringify(phase9Document));

    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.setup.page?.examZhOptions).toEqual({
      'show-foot': true,
      'head-content': '页眉',
      size: 'a3paper',
    });
    expect(migrated.setup.examZhOptions).toEqual({ 'draft/show-draft': 'manual' });
  });

  it('migrates Phase 11 score notes and inline score commands into Schema 0.12', () => {
    const phase11Document = {
      ...createEmptyExamDocument('phase11-teacher-content'),
      schemaVersion: PHASE11_SCHEMA_VERSION,
      sections: [
        {
          id: 'section-problem',
          title: '解答题',
          kind: 'problem',
          questions: [
            {
              id: 'question-score-migration',
              type: 'problem',
              stem: [],
              points: 4,
              solution: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      text: '完成化简 \\score{2}，并注明 \\score{符号方向}。',
                    },
                  ],
                },
              ],
              scoreMode: 'additive',
              scoreMarks: [
                { id: 'legacy-score-2', points: 2, note: '完成关键化简' },
                { id: 'legacy-score-summary', points: 2, note: '写出最终结论' },
              ],
              subQuestionGroup: { items: [] },
            },
          ],
        },
      ],
    };

    const migrated = deserializeExamDocument(JSON.stringify(phase11Document));
    const question = migrated.sections[0]?.questions[0];

    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(question?.scoreMarks).toEqual([
      {
        id: 'legacy-score-2',
        points: 2,
        description: [{ type: 'text', text: '完成关键化简' }],
        placement: 'inline',
      },
      {
        id: 'legacy-score-summary',
        points: 2,
        description: [{ type: 'text', text: '写出最终结论' }],
      },
    ]);
    expect(question?.solutionAnnotations).toEqual([
      {
        id: 'question-score-migration-annotation-inline-1',
        content: [{ type: 'text', text: '符号方向' }],
      },
    ]);
    expect(question?.solution?.[0]).toEqual({
      type: 'paragraph',
      children: [
        { type: 'text', text: '完成化简 ' },
        { type: 'scoreRef', scoreMarkId: 'legacy-score-2' },
        { type: 'text', text: '，并注明 ' },
        {
          type: 'annotationRef',
          annotationId: 'question-score-migration-annotation-inline-1',
        },
        { type: 'text', text: '。' },
      ],
    });
  });

  it('validates local teacher-content references and permits unplaced rows', () => {
    const document = createEmptyExamDocument('teacher-content-references');
    document.sections = [
      {
        id: 'section-problem',
        title: '解答题',
        kind: 'problem',
        questions: [
          {
            id: 'question-problem',
            type: 'problem',
            stem: [],
            solution: [
              {
                type: 'paragraph',
                children: [
                  { type: 'text', text: '步骤' },
                  { type: 'scoreRef', scoreMarkId: 'score-inline' },
                  { type: 'annotationRef', annotationId: 'annotation-inline' },
                ],
              },
            ],
            scoreMode: 'additive',
            scoreMarks: [
              { id: 'score-inline', points: 2, placement: 'inline' },
              { id: 'score-unplaced', points: 2, placement: 'inline' },
            ],
            solutionAnnotations: [
              { id: 'annotation-inline', content: [{ type: 'text', text: '关键点' }] },
              { id: 'annotation-unplaced', content: [{ type: 'text', text: '待恢复' }] },
            ],
            subQuestionGroup: { items: [] },
          },
        ],
      },
    ];

    expect(safeParseExamDocument(document).success).toBe(true);

    const unresolved = structuredClone(document);
    const unresolvedQuestion = unresolved.sections[0]!.questions[0]!;
    unresolvedQuestion.solution = [
      {
        type: 'paragraph',
        children: [{ type: 'scoreRef', scoreMarkId: 'missing-score' }],
      },
    ];
    expect(safeParseExamDocument(unresolved).success).toBe(false);

    const duplicate = structuredClone(document);
    const duplicateQuestion = duplicate.sections[0]!.questions[0]!;
    duplicateQuestion.solution = [
      {
        type: 'paragraph',
        children: [
          { type: 'scoreRef', scoreMarkId: 'score-inline' },
          { type: 'scoreRef', scoreMarkId: 'score-inline' },
        ],
      },
    ];
    expect(safeParseExamDocument(duplicate).success).toBe(false);

    const forbidden = structuredClone(document);
    forbidden.sections[0]!.questions[0]!.stem = [
      {
        type: 'paragraph',
        children: [{ type: 'annotationRef', annotationId: 'annotation-inline' }],
      },
    ];
    expect(safeParseExamDocument(forbidden).success).toBe(false);
  });

  it('validates semantic page setup and custom footer templates', () => {
    const document = createEmptyExamDocument('page-schema');
    document.setup.page = {
      size: 'a3paper',
      showFooter: true,
      footerMode: 'custom',
      footerTemplate: '{{科目}}第{{页码}}页，共{{总页数}}页',
      a3FooterType: 'common',
      showColumnLine: true,
    };
    expect(safeParseExamDocument(document).success).toBe(true);

    document.setup.page.footerTemplate = '{{总页数}}{{页码}}';
    expect(safeParseExamDocument(document).success).toBe(false);
  });

  it('migrates a Phase 2 document to the current version without dropping setup fields', () => {
    const phase2Document = {
      ...createEmptyExamDocument('phase2-doc'),
      schemaVersion: PHASE2_SCHEMA_VERSION,
      setup: {
        answerMode: 'teacher',
        fillin: {
          type: 'line',
          width: '4em',
        },
      },
    };

    const migrated = deserializeExamDocument(JSON.stringify(phase2Document));

    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.setup).toMatchObject({
      answerMode: 'teacher',
      fillin: {
        type: 'line',
        width: '4em',
      },
    });
  });

  it('migrates legacy choice answers into the normalized field', () => {
    const phase3Document = {
      ...createEmptyExamDocument('phase3-doc'),
      schemaVersion: PHASE3_SCHEMA_VERSION,
      sections: [
        {
          id: 'section-choice',
          title: '选择题',
          kind: 'singleChoice',
          questions: [
            {
              id: 'q-choice',
              type: 'singleChoice',
              stem: [{ type: 'paragraph', children: [{ type: 'text', text: '旧选择题' }] }],
              choices: [{ id: 'A', content: [] }],
              answer: { choiceKeys: ['A'] },
            },
          ],
        },
      ],
    };

    const migrated = deserializeExamDocument(JSON.stringify(phase3Document));

    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.sections[0]?.questions[0]?.stem).toEqual(
      phase3Document.sections[0].questions[0].stem,
    );
    expect(migrated.sections[0]?.questions[0]?.correctChoiceIds).toEqual(['A']);
  });

  it('uses slot answers first, falls back to legacy blank answers, and preserves answer text', () => {
    const legacyDocument = {
      ...createEmptyExamDocument('phase7-answer-normalization'),
      schemaVersion: PHASE7_SCHEMA_VERSION,
      sections: [
        {
          id: 'section-answers',
          title: '填空与解答',
          kind: 'custom',
          questions: [
            {
              id: 'q-blank-answer',
              type: 'blank',
              stem: [],
              blanks: [
                {
                  id: 'blank-direct',
                  answer: [{ type: 'paragraph', children: [{ type: 'text', text: '直接答案' }] }],
                },
                { id: 'blank-fallback' },
              ],
              answer: {
                blanks: [
                  {
                    blankId: 'blank-direct',
                    value: [{ type: 'paragraph', children: [{ type: 'text', text: '旧镜像' }] }],
                  },
                  {
                    blankId: 'blank-fallback',
                    value: [{ type: 'paragraph', children: [{ type: 'text', text: '回填答案' }] }],
                  },
                ],
                text: [{ type: 'paragraph', children: [{ type: 'text', text: '旧题目答案说明' }] }],
              },
              solution: [{ type: 'paragraph', children: [{ type: 'text', text: '原解析' }] }],
            },
            {
              id: 'q-problem-answer',
              type: 'problem',
              stem: [],
              subQuestionGroup: {
                items: [
                  {
                    id: 'sub-1',
                    stem: [],
                    solution: [
                      { type: 'paragraph', children: [{ type: 'text', text: '小题解析' }] },
                    ],
                    answer: {
                      text: [
                        { type: 'paragraph', children: [{ type: 'text', text: '旧小题答案说明' }] },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const migrated = deserializeExamDocument(JSON.stringify(legacyDocument));
    const [blankQuestion, problemQuestion] = migrated.sections[0]!.questions;

    expect(blankQuestion!.blanks?.map((blank) => blank.answer?.[0])).toEqual([
      { type: 'paragraph', children: [{ type: 'text', text: '直接答案' }] },
      { type: 'paragraph', children: [{ type: 'text', text: '回填答案' }] },
    ]);
    expect(
      blankQuestion!.solution?.map((block) => block.type === 'paragraph' && block.children[0]),
    ).toEqual([
      { type: 'text', text: '原解析' },
      { type: 'text', text: '旧题目答案说明' },
    ]);
    expect(problemQuestion!.subQuestionGroup?.items[0]?.solution).toHaveLength(2);
  });

  it('merges legacy preamble setup into canonical flat global options and drops dead fields', () => {
    const legacyDocument = {
      ...createEmptyExamDocument('phase7-global-options'),
      schemaVersion: PHASE7_SCHEMA_VERSION,
      setup: {
        answerMode: 'student',
        page: { size: 'a4paper', examZhOptions: { showFoot: true } },
        font: { textFont: 'legacy-font' },
        question: { defaultPoints: 5 },
        sealline: { enabled: true },
        examZhOptions: {
          choices: { columns: 2, label: '\\roman*.' },
          'choices/columns': 3,
          'page/show-foot': false,
        },
      },
      examZh: {
        preambleSetup: {
          choices: { columns: 1, 'label-pos': 'bottom' },
          'draft/show-draft': 'manual',
        },
      },
      sections: [
        {
          id: 'section-dead-options',
          title: '选择题',
          kind: 'singleChoice',
          examZhOptions: { ignored: true },
          questions: [
            {
              id: 'q-choice-dead-options',
              type: 'singleChoice',
              stem: [],
              choicesSetup: {
                examZhOptions: {
                  choices: { label: '\\roman*.' },
                  'choices/label': '\\Alph*.',
                  'label-pos': 'bottom',
                },
              },
              choices: [{ id: 'A', content: [], examZhOptions: { ignored: true } }],
            },
          ],
        },
      ],
    };

    const migrated = deserializeExamDocument(JSON.stringify(legacyDocument));

    expect(migrated.setup).toEqual({
      answerMode: 'student',
      examZhOptions: {
        'choices/columns': 3,
        'choices/label': '\\roman*.',
        'choices/label-pos': 'bottom',
        'draft/show-draft': 'manual',
      },
      page: { examZhOptions: { 'show-foot': false } },
    });
    expect(migrated.examZh).toBeUndefined();
    expect(migrated.sections[0]).not.toHaveProperty('examZhOptions');
    expect(migrated.sections[0]!.questions[0]!.choices![0]).not.toHaveProperty('examZhOptions');
    expect(migrated.sections[0]!.questions[0]!.choicesSetup?.examZhOptions).toEqual({
      label: '\\Alph*.',
      'label-pos': 'bottom',
    });
  });

  it('migrates Phase 4 score marks to additive score mode', () => {
    const phase4Document = {
      ...createEmptyExamDocument('phase4-doc'),
      schemaVersion: PHASE4_SCHEMA_VERSION,
      sections: [
        {
          id: 'section-problem',
          title: '解答题',
          kind: 'problem',
          questions: [
            {
              id: 'q-problem',
              type: 'problem',
              stem: [{ type: 'paragraph', children: [{ type: 'text', text: '旧解答题' }] }],
              points: 10,
              scoreMarks: [{ id: 'score-total', points: 10, note: '过程完整' }],
              subQuestionGroup: {
                exportAs: 'enumerate',
                listKind: 'enumerate',
                items: [
                  {
                    id: 'sub-1',
                    stem: [],
                    scoreMarks: [{ id: 'score-sub', points: 10, note: '小题完整' }],
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const migrated = deserializeExamDocument(JSON.stringify(phase4Document));
    const migratedQuestion = migrated.sections[0]?.questions[0];
    const migratedSubQuestion = migratedQuestion?.subQuestionGroup?.items[0];

    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migratedQuestion?.scoreMode).toBeUndefined();
    expect(migratedQuestion?.scoreMarks).toBeUndefined();
    expect(migratedSubQuestion?.scoreMode).toBe('additive');
    expect(migratedSubQuestion?.scoreMarks?.map((mark) => mark.id)).toEqual([
      'score-total',
      'score-sub',
    ]);
  });

  it('fails migration when whole-question and first-subquestion score modes conflict', () => {
    const legacyDocument = {
      ...createEmptyExamDocument('phase7-score-conflict'),
      schemaVersion: PHASE7_SCHEMA_VERSION,
      sections: [
        {
          id: 'section-problem',
          title: '解答题',
          kind: 'problem',
          questions: [
            {
              id: 'q-score-conflict',
              type: 'problem',
              stem: [],
              scoreMode: 'levels',
              scoreMarks: [{ id: 'whole-level', points: 10 }],
              subQuestionGroup: {
                items: [
                  {
                    id: 'sub-score-conflict',
                    stem: [],
                    scoreMode: 'additive',
                    scoreMarks: [{ id: 'sub-mark', points: 5 }],
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    expect(() => deserializeExamDocument(JSON.stringify(legacyDocument))).toThrow(
      ExamDocumentMigrationError,
    );
    expect(() => deserializeExamDocument(JSON.stringify(legacyDocument))).toThrow(
      'q-score-conflict',
    );
  });

  it('migrates Phase 5 string blank answers to rich content', () => {
    const phase5Document = {
      ...createEmptyExamDocument('phase5-doc'),
      schemaVersion: PHASE5_SCHEMA_VERSION,
      sections: [
        {
          id: 'section-blank',
          title: '填空题',
          kind: 'blank',
          questions: [
            {
              id: 'q-blank',
              type: 'blank',
              stem: [],
              blanks: [
                {
                  id: 'blank-1',
                  command: 'fillin',
                  answer: '$f(0)=1$',
                },
                {
                  id: 'blank-2',
                  command: 'fillin',
                  answer: '',
                },
              ],
              answer: {
                blanks: [
                  { blankId: 'blank-1', value: '$f(0)=1$' },
                  { blankId: 'blank-2', value: '' },
                ],
              },
            },
          ],
        },
      ],
    };

    const migrated = deserializeExamDocument(JSON.stringify(phase5Document));
    const migratedQuestion = migrated.sections[0]?.questions[0];

    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migratedQuestion?.blanks?.[0]?.answer).toEqual([
      {
        type: 'paragraph',
        children: [{ type: 'inlineMath', latex: 'f(0)=1' }],
      },
    ]);
    expect(migratedQuestion?.blanks?.[1]?.answer).toEqual([]);
  });

  it('rejects string blank answers in the current schema', () => {
    const document = createEmptyExamDocument('doc-string-blank-answer');
    const invalidDocument = {
      ...document,
      sections: [
        {
          id: 'section-blank',
          title: '填空题',
          kind: 'blank',
          questions: [
            {
              id: 'q-blank',
              type: 'blank',
              stem: [],
              blanks: [{ id: 'blank-1', command: 'fillin', answer: '1' }],
            },
          ],
        },
      ],
    };

    expect(safeParseExamDocument(invalidDocument).success).toBe(false);
  });

  it('round trips through JSON serialization', () => {
    const document = createEmptyExamDocument('doc-round-trip');
    const serialized = serializeExamDocument(document);

    expect(deserializeExamDocument(serialized)).toEqual(document);
  });

  it('serializes current documents into a sparse canonical form idempotently', () => {
    const document = createEmptyExamDocument('doc-canonical-serialization');
    document.frontMatter.preface = [];
    document.examZh = { documentClass: {}, rawPreamble: [] };
    document.setup.choices = { examZhOptions: {} };
    document.setup.page = {
      size: 'a4paper',
      showFooter: true,
      footerMode: 'subject',
      a3FooterType: 'separate',
      showColumnLine: false,
      examZhOptions: {},
    };
    document.sections = [
      {
        id: 'section-canonical',
        title: '选择题',
        kind: 'singleChoice',
        questions: [
          {
            id: 'q-canonical',
            type: 'singleChoice',
            environment: 'question',
            stem: [],
            choices: [{ id: 'choice-a', label: 'A', content: [] }],
            correctChoiceIds: [],
            choicesSetup: { examZhOptions: {} },
            solution: [],
            scoreMode: 'additive',
            scoreMarks: [],
            examZhOptions: {},
          },
        ],
      },
    ];

    const serialized = serializeExamDocument(document);
    const parsedJson = JSON.parse(serialized) as Record<string, unknown>;
    const question = (parsedJson.sections as Array<Record<string, unknown>>)[0]!.questions as Array<
      Record<string, unknown>
    >;

    expect(parsedJson).not.toHaveProperty('examZh');
    expect(parsedJson.frontMatter as Record<string, unknown>).not.toHaveProperty('preface');
    expect(parsedJson.setup as Record<string, unknown>).not.toHaveProperty('choices');
    expect(parsedJson.setup as Record<string, unknown>).not.toHaveProperty('page');
    expect(question[0]).not.toHaveProperty('environment');
    expect(question[0]).not.toHaveProperty('correctChoiceIds');
    expect(question[0]).not.toHaveProperty('scoreMode');
    expect(question[0]).not.toHaveProperty('scoreMarks');
    expect(serializeExamDocument(deserializeExamDocument(serialized))).toBe(serialized);
  });

  it('canonicalizes global and scoped option bags while serializing current documents', () => {
    const document = createEmptyExamDocument('doc-canonical-options');
    document.setup.examZhOptions = {
      choices: { columns: 2, label: '\\roman*.' },
      'choices/columns': 3,
    };
    document.sections = [
      {
        id: 'section-options',
        title: '选择题',
        kind: 'singleChoice',
        questions: [
          {
            id: 'q-options',
            type: 'singleChoice',
            stem: [],
            choices: [{ id: 'choice-a', content: [] }],
            choicesSetup: {
              examZhOptions: {
                choices: { label: '\\roman*.' },
                'choices/label': '\\Alph*.',
                'label-pos': 'bottom',
              },
            },
          },
        ],
      },
    ];

    const serialized = JSON.parse(serializeExamDocument(document)) as ExamDocument;

    expect(serialized.setup.examZhOptions).toEqual({
      'choices/columns': 3,
      'choices/label': '\\roman*.',
    });
    expect(serialized.sections[0]!.questions[0]!.choicesSetup?.examZhOptions).toEqual({
      label: '\\Alph*.',
      'label-pos': 'bottom',
    });
  });

  it('validates choice, blank, subquestion, score, and solution structures', () => {
    const document = deserializeExamDocument(
      readFileSync(new URL('problem-with-subquestions.examzh.json', fixturesDirectory), 'utf8'),
    );

    expect(document.sections[0]?.questions[0]?.subQuestionGroup?.items).toHaveLength(2);
    expect(parseExamDocument(document)).toEqual(document);
  });

  it('round trips global and per-question choices setup without a schema bump', () => {
    const document = createEmptyExamDocument('doc-choices-setup');
    document.setup.choices = {
      maxColumns: 4,
      examZhOptions: { 'label-pos': 'auto' },
    };
    document.sections = [
      {
        id: 'section-choice-setup',
        title: '选择题',
        kind: 'singleChoice',
        questions: [
          {
            id: 'question-choice-setup',
            type: 'singleChoice',
            stem: [],
            choices: [{ id: 'A', label: '甲', content: [] }],
            choicesSetup: {
              maxColumns: 2,
              examZhOptions: { index: 2, label: '\\arabic*)' },
            },
            correctChoiceIds: ['A'],
          },
        ],
      },
    ];

    const serialized = serializeExamDocument(document);
    const parsed = deserializeExamDocument(serialized);

    expect(parsed).toEqual(document);
    expect(parsed.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('rejects invalid choice answers', () => {
    const document = createEmptyExamDocument('doc-invalid-choice');
    document.sections = [
      {
        id: 'section-choice',
        title: '选择题',
        kind: 'singleChoice',
        questions: [
          {
            id: 'q-choice',
            type: 'singleChoice',
            stem: [],
            choices: [{ id: 'A', content: [] }],
            correctChoiceIds: ['B'],
          },
        ],
      },
    ];

    expect(safeParseExamDocument(document).success).toBe(false);
  });

  it('rejects invalid blank settings', () => {
    const document = createEmptyExamDocument('doc-invalid-blank');

    const invalidDocument = {
      ...document,
      sections: [
        {
          id: 'section-blank',
          title: '填空题',
          kind: 'blank',
          questions: [
            {
              id: 'q-blank',
              type: 'blank',
              stem: [],
              blanks: [
                {
                  id: 'blank-1',
                  command: 'fill',
                  type: 'line',
                },
              ],
            },
          ],
        },
      ],
    };

    expect(safeParseExamDocument(invalidDocument).success).toBe(false);
  });

  it('rejects blank references that do not match a blank slot', () => {
    const document = createEmptyExamDocument('doc-invalid-blank-ref');
    document.sections = [
      {
        id: 'section-blank',
        title: '填空题',
        kind: 'blank',
        questions: [
          {
            id: 'q-blank',
            type: 'blank',
            stem: [
              {
                type: 'paragraph',
                children: [{ type: 'blankRef', blankId: 'missing-blank' }],
              },
            ],
            blanks: [
              {
                id: 'blank-1',
                command: 'fillin',
                answer: [{ type: 'paragraph', children: [{ type: 'text', text: '1' }] }],
              },
            ],
          },
        ],
      },
    ];

    expect(safeParseExamDocument(document).success).toBe(false);
  });

  it('allows choice parentheses and stem lines in choice stems', () => {
    const document = createEmptyExamDocument('doc-choice-paren-ref');
    document.sections = [
      {
        id: 'section-choice',
        title: '选择题',
        kind: 'singleChoice',
        questions: [
          {
            id: 'q-choice',
            type: 'singleChoice',
            stem: [
              {
                type: 'paragraph',
                children: [
                  { type: 'text', text: '这里 ' },
                  { type: 'stemLine' },
                  { type: 'text', text: ' 选择 ' },
                  { type: 'choiceParenRef' },
                ],
              },
            ],
            choices: [{ id: 'A', content: [] }],
            correctChoiceIds: ['A'],
          },
        ],
      },
    ];

    expect(safeParseExamDocument(document).success).toBe(true);
  });

  it('rejects choice parentheses outside choice stems', () => {
    const document = createEmptyExamDocument('doc-invalid-choice-paren-ref');
    document.sections = [
      {
        id: 'section-blank',
        title: '填空题',
        kind: 'blank',
        questions: [
          {
            id: 'q-blank',
            type: 'blank',
            stem: [{ type: 'paragraph', children: [{ type: 'choiceParenRef' }] }],
            blanks: [],
          },
        ],
      },
    ];

    expect(safeParseExamDocument(document).success).toBe(false);
  });

  it('rejects duplicate choice parentheses in one choice stem', () => {
    const document = createEmptyExamDocument('doc-duplicate-choice-paren-ref');
    document.sections = [
      {
        id: 'section-choice',
        title: '选择题',
        kind: 'singleChoice',
        questions: [
          {
            id: 'q-choice',
            type: 'singleChoice',
            stem: [
              {
                type: 'paragraph',
                children: [{ type: 'choiceParenRef' }, { type: 'choiceParenRef' }],
              },
            ],
            choices: [{ id: 'A', content: [] }],
            correctChoiceIds: ['A'],
          },
        ],
      },
    ];

    expect(safeParseExamDocument(document).success).toBe(false);
  });

  it('validates judgement semantics and preserves false answers through serialization', () => {
    const document = createEmptyExamDocument('doc-judgement');
    document.setup.judgement = { answerColor: 'red' };
    document.sections = [
      {
        id: 'section-judgement',
        title: '判断题',
        kind: 'judgement',
        questions: [
          {
            id: 'q-judgement',
            type: 'judgement',
            stem: [
              {
                type: 'paragraph',
                children: [{ type: 'text', text: '命题 ' }, { type: 'judgementRef' }],
              },
            ],
            judgement: {
              correctAnswer: false,
              answerStyle: 'symbol',
              placement: 'inline',
            },
          },
        ],
      },
    ];

    const serialized = serializeExamDocument(document);
    const parsed = deserializeExamDocument(serialized);

    expect(parsed.sections[0]?.questions[0]?.judgement?.correctAnswer).toBe(false);
    expect(parsed.setup.judgement).toEqual({ answerColor: 'red' });
    expect(serialized).toContain('"type": "judgementRef"');
  });

  it('rejects invalid judgement fields, environments, and placeholders', () => {
    const invalidJudgements = [
      {
        id: 'judgement-with-choices',
        type: 'judgement',
        stem: [],
        choices: [{ id: 'choice-a', content: [] }],
      },
      {
        id: 'judgement-problem-environment',
        type: 'judgement',
        environment: 'problem',
        stem: [],
      },
      {
        id: 'judgement-line-end-ref',
        type: 'judgement',
        stem: [{ type: 'paragraph', children: [{ type: 'judgementRef' }] }],
      },
      {
        id: 'judgement-duplicate-ref',
        type: 'judgement',
        stem: [
          {
            type: 'paragraph',
            children: [{ type: 'judgementRef' }, { type: 'judgementRef' }],
          },
        ],
        judgement: { placement: 'inline' },
      },
    ];

    for (const question of invalidJudgements) {
      const document = createEmptyExamDocument(`doc-${question.id}`) as unknown as Record<
        string,
        unknown
      >;
      document.sections = [
        {
          id: 'section-judgement',
          title: '判断题',
          kind: 'judgement',
          questions: [question],
        },
      ];
      expect(safeParseExamDocument(document).success).toBe(false);
    }
  });

  it('omits default judgement setup values during serialization', () => {
    const document = createEmptyExamDocument('doc-default-judgement');
    document.setup.judgement = { answerColor: 'black' };
    const serialized = serializeExamDocument(document);

    expect(serialized).not.toContain('"judgement"');
  });

  it('preserves raw LaTeX blocks through round trip', () => {
    const document = deserializeExamDocument(
      readFileSync(new URL('rich-content.examzh.json', fixturesDirectory), 'utf8'),
    );
    const serialized = serializeExamDocument(document);

    expect(serialized).toContain('% raw latex placeholder');
    expect(deserializeExamDocument(serialized)).toEqual(document);
  });

  it('validates every fixture document', () => {
    const fixtureNames = readdirSync(fixturesDirectory).filter((name) =>
      name.endsWith('.examzh.json'),
    );

    expect(fixtureNames.length).toBeGreaterThan(0);

    for (const fixtureName of fixtureNames) {
      const document = deserializeExamDocument(
        readFileSync(new URL(fixtureName, fixturesDirectory), 'utf8'),
      );

      expect(parseExamDocument(document)).toEqual(document);
      expect(deserializeExamDocument(serializeExamDocument(document))).toEqual(document);
    }
  });
});
