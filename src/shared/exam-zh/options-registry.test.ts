import { describe, expect, it } from 'vitest';

import {
  examZhOptionRegistry,
  findExamZhOptionDefinition,
  validateExamZhOptions,
  type ExamZhOptionDefinition,
} from './options-registry';

describe('exam-zh option registry', () => {
  it('accepts registered options with valid values', () => {
    const result = validateExamZhOptions('fillin', 'command', {
      type: 'paren',
      width: '4em',
      'no-answer-type': 'none',
    });

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toEqual([]);
  });

  it('rejects registered options with invalid values', () => {
    const result = validateExamZhOptions('fillin', 'command', {
      type: 'unsupported',
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toMatchObject([
      {
        severity: 'error',
        code: 'invalid_value',
        namespace: 'fillin',
        key: 'type',
      },
    ]);
  });

  it('validates Phase 8.2 corrected upstream keys and rejects old audit placeholders', () => {
    expect(
      validateExamZhOptions('choices', 'environment', {
        'label-pos': 'top-left',
      }),
    ).toMatchObject({
      ok: true,
      diagnostics: [],
    });

    expect(
      validateExamZhOptions('choices', 'environment', {
        'label-position': 'top-left',
      }),
    ).toMatchObject({
      ok: true,
      diagnostics: [
        {
          severity: 'warning',
          code: 'unknown_option',
          namespace: 'choices',
          key: 'label-position',
        },
      ],
    });

    expect(
      validateExamZhOptions('paren', 'command', {
        type: 'banjiao',
      }),
    ).toMatchObject({
      ok: false,
      diagnostics: [
        {
          severity: 'error',
          code: 'invalid_value',
          namespace: 'paren',
          key: 'type',
        },
      ],
    });

    expect(
      validateExamZhOptions('solution', 'environment', {
        'show-solution': 'show-move',
      }),
    ).toMatchObject({
      ok: true,
      diagnostics: [],
    });
  });

  it('registers the complete v0.2.6 choices namespace', () => {
    const definitions = examZhOptionRegistry.filter(
      (definition) => definition.namespace === 'choices',
    );

    expect(definitions.map((definition) => definition.key).sort()).toEqual([
      'bottom-sep',
      'column-sep',
      'columns',
      'index',
      'label',
      'label-align',
      'label-pos',
      'label-sep',
      'label-width',
      'linesep',
      'max-columns',
      'top-sep',
    ]);
    expect(findExamZhOptionDefinition('choices', 'index')).toMatchObject({
      defaultValue: 1,
      status: 'advanced',
      validTargets: ['examsetup', 'environment'],
      guiEntry: expect.stringContaining('starting index'),
    });
    expect(findExamZhOptionDefinition('choices', 'label')).toMatchObject({
      defaultValue: '\\Alph*.',
      status: 'advanced',
      guiEntry: expect.stringContaining('circlednumber'),
      notes: expect.stringContaining('\\AddChoicesCounter'),
    });
    expect(findExamZhOptionDefinition('choices', 'linesep')).toMatchObject({
      defaultValue: '0pt plus .5ex',
    });
    expect(findExamZhOptionDefinition('choices', 'max-columns')?.modelPaths).not.toContain(
      'ChoiceOption.examZhOptions',
    );
    expect(findExamZhOptionDefinition('choices', 'max-columns')).toMatchObject({
      modelPaths: expect.arrayContaining([
        'setup.choices.maxColumns',
        'ExamQuestion.choicesSetup.maxColumns',
        'ExamQuestion.choicesSetup.examZhOptions',
      ]),
      exporterPaths: ['buildChoiceExamSetup', 'renderChoices'],
      status: 'advanced',
      guiEntry: expect.stringContaining('automatic choice column cap'),
    });
    expect(findExamZhOptionDefinition('choices', 'columns')).toMatchObject({
      status: 'advanced',
      guiEntry: expect.stringContaining('auto/fixed choice column'),
    });
    expect(findExamZhOptionDefinition('choices', 'label-pos')).toMatchObject({
      status: 'advanced',
      guiEntry: expect.stringContaining('label position'),
    });

    for (const key of [
      'column-sep',
      'label-align',
      'label-sep',
      'label-width',
      'top-sep',
      'bottom-sep',
      'linesep',
    ]) {
      expect(findExamZhOptionDefinition('choices', key)).toMatchObject({
        status: 'advanced',
        guiEntry: expect.any(String),
      });
    }
  });

  it('validates choices keys globally and on an individual environment', () => {
    const localOptions = {
      index: 2,
      'column-sep': '1em',
      columns: 0,
      label: '\\circlednumber*',
      'label-pos': 'left',
      'label-align': 'center',
      'label-sep': '.5em',
      'label-width': '0pt',
      'max-columns': 4,
      'top-sep': '0pt',
      'bottom-sep': '0pt',
      linesep: '0pt plus .5ex',
    };

    expect(validateExamZhOptions('choices', 'environment', localOptions)).toMatchObject({
      ok: true,
      diagnostics: [],
    });
    expect(
      validateExamZhOptions(
        'examsetup',
        'examsetup',
        Object.fromEntries(
          Object.entries(localOptions).map(([key, value]) => [`choices/${key}`, value]),
        ),
      ),
    ).toMatchObject({ ok: true, diagnostics: [] });
    expect(
      validateExamZhOptions('choices', 'environment', {
        'label-pos': 'middle',
        'label-align': 'justify',
      }),
    ).toMatchObject({
      ok: false,
      diagnostics: [
        { code: 'invalid_value', key: 'label-pos' },
        { code: 'invalid_value', key: 'label-align' },
      ],
    });
  });

  it('accepts registered options across validTargets', () => {
    expect(
      validateExamZhOptions('examsetup', 'examsetup', {
        'choices/max-columns': 3,
        'fillin/show-answer': true,
        'solution/show-solution': 'hide',
      }),
    ).toMatchObject({
      ok: true,
      diagnostics: [],
    });

    expect(
      validateExamZhOptions('choices', 'environment', {
        'max-columns': 2,
      }),
    ).toMatchObject({
      ok: true,
      diagnostics: [],
    });
  });

  it('registers the complete audited page namespace and validates GUI-managed values', () => {
    const definitions = examZhOptionRegistry.filter(
      (definition) => definition.namespace === 'page',
    );

    expect(definitions.map((definition) => definition.key).sort()).toEqual([
      'columnline-width',
      'foot-content',
      'foot-type',
      'head-content',
      'show-chapter',
      'show-columnline',
      'show-foot',
      'show-head',
      'size',
    ]);
    expect(
      validateExamZhOptions('examsetup', 'examsetup', {
        'page/size': 'a3paper',
        'page/show-foot': false,
        'page/foot-type': 'common',
        'page/foot-content': '物理试题第;页',
        'page/show-columnline': true,
      }),
    ).toMatchObject({ ok: true, diagnostics: [] });
    expect(findExamZhOptionDefinition('page', 'foot-content')).toMatchObject({
      status: 'advanced',
      exporterPaths: ['buildPageExamSetup'],
      guiEntry: expect.stringContaining('页脚内容'),
    });
    expect(findExamZhOptionDefinition('page', 'show-head')).toMatchObject({
      status: 'passthrough',
    });
  });

  it('registers label formats for both question environments', () => {
    expect(
      validateExamZhOptions('question', 'environment', {
        label: '\\circlednumber*.',
      }),
    ).toMatchObject({ ok: true, diagnostics: [] });
    expect(
      validateExamZhOptions('problem', 'environment', {
        label: '\\tikzcirclednumber*.',
      }),
    ).toMatchObject({ ok: true, diagnostics: [] });
    expect(findExamZhOptionDefinition('question', 'label')).toMatchObject({
      status: 'advanced',
      exporterPaths: ['buildQuestionEnvironmentOptions'],
      guiEntry: expect.stringContaining('Section-level'),
      notes: expect.stringContaining('\\AddQuestionCounter'),
    });
    expect(findExamZhOptionDefinition('problem', 'label')).toMatchObject({
      status: 'advanced',
      exporterPaths: ['buildQuestionEnvironmentOptions'],
      guiEntry: expect.stringContaining('Section-level'),
      notes: expect.stringContaining('\\AddQuestionCounter'),
    });
  });

  it('registers semantic paren placement and teacher answer styling', () => {
    expect(
      validateExamZhOptions('paren', 'command', {
        type: 'none',
        'text-color': 'red',
      }),
    ).toMatchObject({ ok: true, diagnostics: [] });
    expect(findExamZhOptionDefinition('paren', 'type')).toMatchObject({
      status: 'advanced',
      modelPaths: [
        'InlineContent.choiceParenRef',
        'ExamQuestion.judgement.placement',
        'setup.examZhOptions',
      ],
      exporterPaths: ['renderParen', 'renderJudgement'],
      guiEntry: expect.stringContaining('选择括号'),
    });
    expect(findExamZhOptionDefinition('paren', 'text-color')).toMatchObject({
      status: 'advanced',
      defaultValue: 'black',
      guiEntry: expect.stringContaining('Black/red'),
      notes: expect.stringContaining('parentheses remain black'),
    });
  });

  it('registers title and notice setup keys with Phase 8.4 GUI coverage metadata', () => {
    const result = validateExamZhOptions('examsetup', 'examsetup', {
      'title/title-format': '\\Large',
      'title/subject-format': '\\sffamily \\bfseries \\huge',
      'title/top-sep': '-.5em plus 0.3em minus 0.2em',
      'title/bottom-sep': '0em plus 0.3em minus 0.2em',
      'notice/label': '注意事项：',
      'notice/label-format': '\\sffamily \\bfseries',
      'notice/top-sep': '.25em plus .25em minus .1em',
      'notice/bottom-sep': '.25em plus .25em minus .1em',
    });

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toEqual([]);
    expect(findExamZhOptionDefinition('title', 'title-format')).toMatchObject({
      namespace: 'title',
      key: 'title-format',
      status: 'passthrough',
      target: 'examsetup',
      sourceFile: 'exam-zh.cls',
    });
    expect(findExamZhOptionDefinition('notice', 'label')).toMatchObject({
      namespace: 'notice',
      key: 'label',
      status: 'advanced',
      target: 'examsetup',
      sourceFile: 'exam-zh.cls',
    });
    expect(findExamZhOptionDefinition('title', 'top-sep')).toMatchObject({
      namespace: 'title',
      key: 'top-sep',
      status: 'advanced',
      target: 'examsetup',
      sourceFile: 'exam-zh.cls',
    });
  });

  it('rejects title and notice setup keys with non-string values', () => {
    const result = validateExamZhOptions('examsetup', 'examsetup', {
      'title/top-sep': 1,
      'notice/label': true,
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toMatchObject([
      {
        severity: 'error',
        code: 'invalid_value',
        namespace: 'title',
        key: 'top-sep',
      },
      {
        severity: 'error',
        code: 'invalid_value',
        namespace: 'notice',
        key: 'label',
      },
    ]);
  });

  it('treats score/show-score as non-upstream passthrough after Phase 8.2', () => {
    const result = validateExamZhOptions('examsetup', 'examsetup', {
      'score/show-score': true,
    });

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toMatchObject([
      {
        severity: 'warning',
        code: 'unknown_option',
        namespace: 'score',
        key: 'show-score',
      },
    ]);
    expect(findExamZhOptionDefinition('score', 'show-score')).toBeUndefined();
  });

  it('preserves unregistered options with a warning diagnostic', () => {
    const result = validateExamZhOptions('examsetup', 'examsetup', {
      'future/custom-option': true,
    });

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toMatchObject([
      {
        severity: 'warning',
        code: 'unknown_option',
        namespace: 'future',
        key: 'custom-option',
      },
    ]);
  });

  it('rejects options placed under the wrong target', () => {
    const result = validateExamZhOptions('documentClass', 'documentClass', {
      'question/index': 1,
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toMatchObject([
      {
        severity: 'error',
        code: 'wrong_target',
        namespace: 'question',
        key: 'index',
      },
    ]);
  });

  it('keeps existing registered options discoverable after audit metadata expansion', () => {
    expect(findExamZhOptionDefinition('fillin', 'type')).toMatchObject({
      namespace: 'fillin',
      key: 'type',
      status: 'core',
      manualRef: expect.stringContaining('3.5.11'),
      sourceFile: 'exam-zh-question.sty',
      validTargets: ['examsetup', 'command'],
      modelPaths: ['setup.fillin.type', 'BlankSlot.type', 'ExamQuestion.judgement.placement'],
      exporterPaths: ['buildFillinExamSetup', 'buildBlankOptions', 'renderJudgement'],
    });
  });

  it('registers all fillin source keys at global and command targets', () => {
    const expectedKeys = [
      'type',
      'show-answer',
      'width',
      'width-type',
      'box-color',
      'text-color',
      'no-answer-type',
      'no-answer-counter-index',
      'no-answer-counter-label',
      'paren-type',
      'depth',
    ];

    expect(
      examZhOptionRegistry
        .filter((definition) => definition.namespace === 'fillin')
        .map((definition) => definition.key),
    ).toEqual(expectedKeys);

    const options = {
      type: 'line',
      'show-answer': true,
      width: '4em',
      'width-type': 'normal',
      'box-color': 'blue',
      'text-color': 'red',
      'no-answer-type': 'counter',
      'no-answer-counter-index': 2,
      'no-answer-counter-label': '\\circlednumber*',
      'paren-type': 'quanjiao',
      depth: '.5em',
    } as const;

    expect(validateExamZhOptions('fillin', 'examsetup', options)).toEqual({
      ok: true,
      diagnostics: [],
    });
    expect(validateExamZhOptions('fillin', 'command', options)).toEqual({
      ok: true,
      diagnostics: [],
    });

    for (const key of [
      'width-type',
      'box-color',
      'text-color',
      'no-answer-type',
      'no-answer-counter-index',
      'no-answer-counter-label',
      'paren-type',
    ]) {
      expect(findExamZhOptionDefinition('fillin', key)).toMatchObject({
        status: 'advanced',
        guiEntry: expect.any(String),
      });
    }

    expect(findExamZhOptionDefinition('fillin', 'depth')).toMatchObject({
      status: 'passthrough',
    });
    expect(findExamZhOptionDefinition('fillin', 'depth')?.guiEntry).toBeUndefined();
  });

  it('rejects the broken hidden fillin value in current registry validation', () => {
    const result = validateExamZhOptions('fillin', 'command', {
      'no-answer-type': 'hidden',
    });

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toMatchObject([
      {
        severity: 'error',
        code: 'invalid_value',
        namespace: 'fillin',
        key: 'no-answer-type',
      },
    ]);
  });

  it('supports unsupported audit status without changing validation behavior', () => {
    const unsupportedDefinition: ExamZhOptionDefinition = {
      namespace: 'fillin',
      key: 'legacy-placeholder',
      valueKind: 'string',
      status: 'unsupported',
      target: 'command',
      manualRef: 'exam-zh-doc.pdf v0.2.6, audit placeholder',
      sourceFile: 'exam-zh-question.sty',
      notes: 'Used to prove Phase 8.1 can represent intentionally unsupported interfaces.',
    };

    expect(unsupportedDefinition.status).toBe('unsupported');

    const result = validateExamZhOptions('fillin', 'command', {
      width: '4em',
    });

    expect(result.ok).toBe(true);
    expect(result.diagnostics).toEqual([]);
  });

  it('uses status as the registry state field', () => {
    expect(examZhOptionRegistry.every((definition) => definition.status)).toBe(true);
    expect(
      examZhOptionRegistry.some(
        (definition) => Object.hasOwn(definition, 'guiStatus') || definition.status === undefined,
      ),
    ).toBe(false);
  });
});
