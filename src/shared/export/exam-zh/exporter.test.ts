import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { createEmptyExamDocument } from '../../document';
import { deserializeExamDocument } from '../../document/serialization';
import type { ExamDocument, ExamQuestion } from '../../document/model';
import { exportExamDocumentToTex } from './index';

const exportFixturesDirectory = new URL('../../../../fixtures/export/', import.meta.url);
const documentFixturesDirectory = new URL('../../../../fixtures/documents/', import.meta.url);
const fixedExportOptions = {
  generatedAt: '2026-01-01T00:00:00.000Z',
  sourceFilePath: 'fixtures/export/compile-smoke.examzh.json',
};

describe('exam-zh exporter', () => {
  it('exports the compile-smoke fixture exactly', () => {
    const document = readExamDocumentFixture(exportFixturesDirectory, 'compile-smoke.examzh.json');
    const expectedTex = readFileSync(new URL('compile-smoke.tex', exportFixturesDirectory), 'utf8');
    const result = exportExamDocumentToTex(document, fixedExportOptions);

    expect(result.tex).toBe(expectedTex);
    expect(result.diagnostics).toEqual([]);
  });

  it('exports the basic document skeleton', () => {
    const document = createEmptyExamDocument('doc-empty-export');
    const result = exportExamDocumentToTex(document, {
      includeAppMetadata: false,
      generatedAt: fixedExportOptions.generatedAt,
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.tex).toContain('\\documentclass{exam-zh}');
    expect(result.tex).not.toContain('Created with exam-zh GUI');
    expect(result.tex).not.toContain('https://github.com/Driver066/exam-zh-gui');
    expect(result.tex).toContain('\\title{未命名试卷}');
    expect(result.tex).toContain('\\subject{数学}');
    expect(result.tex).toContain('\\begin{document}');
    expect(result.tex).toContain('\\maketitle');
    expect(result.tex).toContain('\\end{document}');
    expect(result.tex.endsWith('\n')).toBe(true);
  });

  it('exports semantic page size, footer modes, and A3 options', () => {
    const document = createEmptyExamDocument('doc-page-setup');
    document.metadata.subject = '物理';

    const subjectFooter = exportExamDocumentToTex(document, { includeAppMetadata: false });
    expect(subjectFooter.diagnostics).toEqual([]);
    expect(subjectFooter.tex).toContain('page/foot-content = {物理试题第;页（共~;页）}');

    document.setup.page = {
      size: 'a3paper',
      footerMode: 'pageOnly',
      a3FooterType: 'common',
      showColumnLine: true,
    };
    const a3Result = exportExamDocumentToTex(document, { includeAppMetadata: false });
    expect(a3Result.diagnostics).toEqual([]);
    expect(a3Result.tex).toContain('page/size = a3paper');
    expect(a3Result.tex).toContain('page/foot-type = common');
    expect(a3Result.tex).toContain('page/show-columnline = true');
    expect(a3Result.tex).toContain('page/foot-content = {第;页（共~;页）}');

    document.setup.page = {
      footerMode: 'custom',
      footerTemplate: '{{科目}}卷 & 第{{页码}}页，共{{总页数}}页',
    };
    const customResult = exportExamDocumentToTex(document, { includeAppMetadata: false });
    expect(customResult.diagnostics).toEqual([]);
    expect(customResult.tex).toContain('page/foot-content = {物理卷 \\& 第;页，共;页}');

    document.setup.page = { showFooter: false };
    const hiddenResult = exportExamDocumentToTex(document, { includeAppMetadata: false });
    expect(hiddenResult.diagnostics).toEqual([]);
    expect(hiddenResult.tex).toContain('page/show-foot = false');
    expect(hiddenResult.tex).not.toContain('page/foot-content');
  });

  it('lets scoped and global page passthrough override semantic page settings', () => {
    const document = createEmptyExamDocument('doc-page-precedence');
    document.setup.page = {
      size: 'a3paper',
      examZhOptions: { size: 'a4paper', 'show-head': true },
    };
    document.setup.examZhOptions = { 'page/size': 'a3paper' };

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.diagnostics).toEqual([]);
    expect(result.tex).toContain('page/size = a3paper');
    expect(result.tex).toContain('page/show-head = true');
  });

  it('exports both question environments with a custom question counter registration', () => {
    const document = createEmptyExamDocument('doc-question-counter');
    document.examZh = {
      ...document.examZh,
      rawPreamble: [
        '\\ExplSyntaxOn',
        '\\cs_new:Npn \\examzh_test_counter:n #1 { \\int_eval:n { #1 + 1 } }',
        '\\AddQuestionCounter{\\examzhtest}{\\examzh_test_counter:n}',
        '\\ExplSyntaxOff',
      ],
    };
    document.sections = [
      {
        id: 'section-question-environments',
        title: '题干环境',
        kind: 'custom',
        questions: [
          {
            id: 'question-environment',
            type: 'problem',
            environment: 'question',
            stem: [{ type: 'paragraph', children: [{ type: 'text', text: '短题干。' }] }],
            examZhOptions: { label: '\\examzhtest*.' },
          },
          {
            id: 'problem-environment',
            type: 'problem',
            environment: 'problem',
            stem: [{ type: 'paragraph', children: [{ type: 'text', text: '解答题题干。' }] }],
            examZhOptions: { label: '\\examzhtest*.' },
          },
        ],
      },
    ];

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });
    const counterRegistration = '\\AddQuestionCounter{\\examzhtest}{\\examzh_test_counter:n}';

    expect(result.diagnostics).toEqual([]);
    expect(result.tex).toContain(counterRegistration);
    expect(result.tex.indexOf(counterRegistration)).toBeLessThan(result.tex.indexOf('\\title{'));
    expect(result.tex).toContain('\\begin{question}[label = \\examzhtest*.]');
    expect(result.tex).toContain('\\end{question}');
    expect(result.tex).toContain('\\begin{problem}[label = \\examzhtest*.]');
    expect(result.tex).toContain('\\end{problem}');
  });

  it('exports section numbering defaults on the first structured question and mixed environments', () => {
    const document = createEmptyExamDocument('doc-section-numbering');
    document.sections = [
      {
        id: 'section-numbering',
        title: '混合题型',
        kind: 'custom',
        numbering: {
          reset: true,
          start: 5,
          examZhOptions: { label: '\\Alph*.' },
        },
        questions: [
          {
            id: 'raw-before-numbering',
            type: 'rawLatex',
            rawLatex: '\\customquestion',
            stem: [],
          },
          {
            id: 'numbered-question',
            type: 'problem',
            environment: 'question',
            stem: [{ type: 'paragraph', children: [{ type: 'text', text: '填空题。' }] }],
          },
          {
            id: 'numbered-problem',
            type: 'problem',
            environment: 'problem',
            index: 9,
            stem: [{ type: 'paragraph', children: [{ type: 'text', text: '解答题。' }] }],
            examZhOptions: { label: '\\Roman*.' },
          },
          {
            id: 'continued-question',
            type: 'problem',
            environment: 'question',
            stem: [{ type: 'paragraph', children: [{ type: 'text', text: '继续编号。' }] }],
          },
        ],
      },
    ];

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.diagnostics).toEqual([]);
    expect(result.tex).toContain('\\customquestion');
    expect(result.tex).toContain('\\begin{question}[index = 5, label = \\Alph*.]');
    expect(result.tex).toContain('\\begin{problem}[index = 9, label = \\Roman*.]');
    expect(result.tex).toContain('\\begin{question}[label = \\Alph*.]');
  });

  it('exports the teacher choice answer color without changing the default', () => {
    const defaultDocument = createEmptyExamDocument('doc-default-answer-color');
    const redDocument = createEmptyExamDocument('doc-red-answer-color');
    redDocument.setup.answerMode = 'teacher';
    redDocument.setup.examZhOptions = { 'paren/text-color': 'red' };

    const defaultResult = exportExamDocumentToTex(defaultDocument, {
      includeAppMetadata: false,
    });
    const redResult = exportExamDocumentToTex(redDocument, { includeAppMetadata: false });

    expect(defaultResult.tex).not.toContain('paren/text-color');
    expect(redResult.diagnostics).toEqual([]);
    expect(redResult.tex).toContain('paren/text-color = red');
    expect(redResult.tex).toContain('paren/show-answer = true');
  });

  it('exports semantic front matter commands for existing header fields', () => {
    const document = createEmptyExamDocument('doc-front-matter-export');
    document.frontMatter.secret = true;
    document.frontMatter.informationFields = [
      { label: '姓名：', kind: 'line', width: '5em' },
      { label: '座号：', kind: 'squares', length: 3 },
      { label: '考场：', kind: 'text' },
    ];
    document.frontMatter.notices = [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: '答题前请检查试卷页数。' }],
      },
      {
        type: 'paragraph',
        children: [{ type: 'text', text: '请在规定区域内作答。' }],
      },
    ];

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.diagnostics).toEqual([]);
    expect(result.tex).toContain(
      '\\information{姓名：\\underline{\\hspace{5em}},座号：\\examsquare{3},考场：}',
    );
    expect(result.tex).toContain('\\secret');
    expect(result.tex).toContain('\\begin{notice}');
    expect(result.tex).toContain('\\item 答题前请检查试卷页数。');
    expect(result.tex).toContain('\\item 请在规定区域内作答。');
    expect(result.tex).toContain('\\end{notice}');
    expect(result.tex.indexOf('\\information')).toBeLessThan(result.tex.indexOf('\\secret'));
    expect(result.tex.indexOf('\\secret')).toBeLessThan(result.tex.indexOf('\\maketitle'));
    expect(result.tex.indexOf('\\maketitle')).toBeLessThan(result.tex.indexOf('\\begin{notice}'));
  });

  it('exports configurable section summaries without changing section titles in JSON', () => {
    const document = createEmptyExamDocument('doc-section-summary');
    document.sections = [
      {
        id: 'section-uniform',
        title: '选择题',
        kind: 'singleChoice',
        summaryMode: 'questionCountAndPoints',
        questions: [
          createMinimalChoiceQuestion('summary-q1', 5),
          createMinimalChoiceQuestion('summary-q2', 5),
        ],
      },
      {
        id: 'section-mixed',
        title: '解答题',
        kind: 'problem',
        summaryMode: 'questionCountAndPoints',
        questions: [
          createMinimalProblemQuestion('summary-q3', 6),
          createMinimalProblemQuestion('summary-q4', 8),
        ],
      },
      {
        id: 'section-count',
        title: '填空题',
        kind: 'blank',
        summaryMode: 'questionCount',
        questions: [createMinimalBlankQuestion('summary-q5', 5)],
      },
      {
        id: 'section-empty',
        title: '备用题',
        kind: 'custom',
        summaryMode: 'questionCountAndPoints',
        questions: [],
      },
    ];

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.tex).toContain('\\section{选择题：本题共 2 小题，每小题 5 分，共 10 分。}');
    expect(result.tex).toContain('\\section{解答题：本题共 2 小题，共 14 分。}');
    expect(result.tex).toContain('\\section{填空题：本题共 1 小题。}');
    expect(result.tex).toContain('\\section{备用题}');
    expect(document.sections[0]?.title).toBe('选择题');
  });

  it('applies semantic fillin answer color only to teacher exports', () => {
    const student = createEmptyExamDocument('doc-student-fillin-color');
    student.setup.fillin = { answerColor: 'red' };
    const teacher = structuredClone(student);
    teacher.setup.answerMode = 'teacher';

    const studentResult = exportExamDocumentToTex(student, { includeAppMetadata: false });
    const teacherResult = exportExamDocumentToTex(teacher, { includeAppMetadata: false });

    expect(studentResult.tex).not.toContain('fillin/text-color');
    expect(teacherResult.tex).toContain('fillin/text-color = red');

    student.setup.fillin.examZhOptions = { 'text-color': 'blue' };
    const rawOverride = exportExamDocumentToTex(student, { includeAppMetadata: false });
    expect(rawOverride.tex).toContain('fillin/text-color = blue');
  });

  it('can place personal information below the title block', () => {
    const document = createEmptyExamDocument('doc-front-matter-below-subject');
    document.frontMatter.secret = true;
    document.frontMatter.informationPlacement = 'belowSubject';
    document.frontMatter.informationFields = [{ label: '姓名：', kind: 'line', width: '6em' }];
    document.frontMatter.notices = [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: '答题前请检查个人信息。' }],
      },
    ];

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.diagnostics).toEqual([]);
    expect(result.tex).toContain('\\information{姓名：\\underline{\\hspace{6em}}}');
    expect(result.tex.indexOf('\\secret')).toBeLessThan(result.tex.indexOf('\\maketitle'));
    expect(result.tex.indexOf('\\maketitle')).toBeLessThan(result.tex.indexOf('\\information'));
    expect(result.tex.indexOf('\\information')).toBeLessThan(result.tex.indexOf('\\begin{notice}'));
  });

  it('exports warning after the title block and before notices', () => {
    const document = createEmptyExamDocument('doc-front-matter-warning');
    document.frontMatter.secret = true;
    document.frontMatter.warning = '请勿提前翻阅试卷。';
    document.frontMatter.notices = [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: '答题前请检查试卷页数。' }],
      },
    ];

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.diagnostics).toEqual([]);
    expect(result.tex).toContain('\\noindent\\warning{请勿提前翻阅试卷。}');
    expect(result.tex.indexOf('\\secret')).toBeLessThan(result.tex.indexOf('\\maketitle'));
    expect(result.tex.indexOf('\\maketitle')).toBeLessThan(result.tex.indexOf('\\warning'));
    expect(result.tex.indexOf('\\warning')).toBeLessThan(result.tex.indexOf('\\begin{notice}'));
  });

  it('preserves upstream information defaults and supports explicit separators', () => {
    const document = createEmptyExamDocument('doc-information-separator');
    document.frontMatter.informationFields = [
      { label: '姓名：', kind: 'line', width: '6em' },
      { label: '班级：', kind: 'line', width: '6em' },
    ];
    const defaultResult = exportExamDocumentToTex(document, { includeAppMetadata: false });
    expect(defaultResult.tex).toContain(
      '\\information{姓名：\\underline{\\hspace{6em}},班级：\\underline{\\hspace{6em}}}',
    );

    document.frontMatter.informationSeparator = { mode: 'comma' };
    const commaResult = exportExamDocumentToTex(document, { includeAppMetadata: false });
    expect(commaResult.tex).toContain('\\information[\\quad ，\\quad]{');

    document.frontMatter.informationSeparator = { mode: 'custom', text: '／' };
    const customResult = exportExamDocumentToTex(document, { includeAppMetadata: false });
    expect(customResult.tex).toContain('\\information[{\\quad ／\\quad}]{');

    document.frontMatter.informationSeparator = { mode: 'none' };
    const noneResult = exportExamDocumentToTex(document, { includeAppMetadata: false });
    expect(noneResult.tex).toContain('\\information[]{');
  });

  it('uses stable centered information rendering for non-default spacing', () => {
    const document = createEmptyExamDocument('doc-information-spacing');
    document.frontMatter.informationFields = [
      { label: '姓名：', kind: 'line', width: '6em' },
      { label: '班级：', kind: 'line', width: '6em' },
    ];
    document.frontMatter.informationSeparator = { mode: 'middleDot' };
    document.frontMatter.informationSpacing = { top: '.25em', bottom: '.5em' };
    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.tex).not.toContain('\\information[');
    expect(result.tex).toContain('\\par\\addvspace{.25em}');
    expect(result.tex).toContain(
      '\\noindent\\makebox[\\linewidth][c]{姓名：\\underline{\\hspace{6em}}\\quad ·\\quad班级：\\underline{\\hspace{6em}}}',
    );
    expect(result.tex).toContain('\\par\\addvspace{.5em}');
  });

  it('wraps warnings with semantic spacing without changing the upstream command', () => {
    const document = createEmptyExamDocument('doc-warning-spacing');
    document.frontMatter.warning = '本试卷为功能示例';
    document.frontMatter.warningSpacing = { top: '.5em', bottom: '.75em' };
    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.tex).toContain(
      '\\par\\addvspace{.5em}\n\\noindent\\warning{本试卷为功能示例}\n\\par\\addvspace{.75em}',
    );
  });

  it('skips maketitle when the title block is hidden while preserving preamble title data', () => {
    const document = createEmptyExamDocument('doc-front-matter-hidden-title');
    document.metadata.title = '隐藏标题区试卷';
    document.metadata.subject = '数学';
    document.frontMatter.showTitleBlock = false;
    document.frontMatter.secret = true;
    document.frontMatter.informationPlacement = 'belowSubject';
    document.frontMatter.informationFields = [{ label: '姓名：', kind: 'line', width: '6em' }];
    document.frontMatter.warning = '闭卷考试。';
    document.frontMatter.notices = [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: '请在答题区域内作答。' }],
      },
    ];

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.diagnostics).toEqual([]);
    expect(result.tex).toContain('\\title{隐藏标题区试卷}');
    expect(result.tex).toContain('\\subject{数学}');
    expect(result.tex).not.toContain('\\maketitle');
    expect(result.tex).toContain('\\information{姓名：\\underline{\\hspace{6em}}}');
    expect(result.tex).toContain('\\noindent\\warning{闭卷考试。}');
    expect(result.tex.indexOf('\\information')).toBeLessThan(result.tex.indexOf('\\secret'));
    expect(result.tex.indexOf('\\secret')).toBeLessThan(result.tex.indexOf('\\warning'));
    expect(result.tex.indexOf('\\warning')).toBeLessThan(result.tex.indexOf('\\begin{notice}'));
  });

  it('keeps standard exports free of Tectonic compatibility shims', () => {
    const document = createEmptyExamDocument('doc-standard-target');
    const result = exportExamDocumentToTex(document, {
      includeAppMetadata: false,
      compilerTarget: 'standard',
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.tex).toContain('\\documentclass{exam-zh}');
    expect(result.tex).not.toContain('fontset=fandol');
    expect(result.tex).not.toContain('\\IfBlankTF');
  });

  it('adds Fandol and a compatibility shim for Tectonic exports', () => {
    const document = createEmptyExamDocument('doc-tectonic-target');
    document.examZh = {
      ...document.examZh,
      documentClass: {
        twoside: true,
      },
    };

    const result = exportExamDocumentToTex(document, {
      includeAppMetadata: false,
      compilerTarget: 'tectonic',
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.tex).toContain('\\documentclass[fontset=fandol, twoside=true]{exam-zh}');
    expect(result.tex).toContain(
      '\\cs_if_exist:NF \\IfBlankTF { \\cs_new_eq:NN \\IfBlankTF \\tl_if_blank:nTF }',
    );
  });

  it('preserves explicit document fontsets for Tectonic exports', () => {
    const document = createEmptyExamDocument('doc-tectonic-explicit-fontset');
    document.examZh = {
      ...document.examZh,
      documentClass: {
        fontset: 'mac',
      },
    };

    const result = exportExamDocumentToTex(document, {
      includeAppMetadata: false,
      compilerTarget: 'tectonic',
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.tex).toContain('\\documentclass[fontset=mac]{exam-zh}');
    expect(result.tex).not.toContain('fontset=fandol, fontset=mac');
  });

  it('escapes text without escaping math or raw LaTeX', () => {
    const document = createEmptyExamDocument('doc-escape');
    document.metadata.title = '符号 $ % & _ # { } ~ ^ \\';
    document.sections = [
      {
        id: 'section-escape',
        title: '转义',
        kind: 'custom',
        questions: [
          {
            id: 'q-escape',
            type: 'problem',
            stem: [
              {
                type: 'paragraph',
                children: [
                  { type: 'text', text: '文本 $ % & _ # { } ~ ^ \\' },
                  { type: 'inlineMath', latex: 'x_1^2' },
                  { type: 'rawLatex', latex: '\\quad \\LaTeXRaw' },
                ],
              },
              {
                type: 'rawLatex',
                latex: '% raw latex placeholder',
              },
            ],
          },
        ],
      },
    ];

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.tex).toContain(
      '\\title{符号 \\$ \\% \\& \\_ \\# \\{ \\} \\textasciitilde{} \\textasciicircum{} \\textbackslash{}}',
    );
    expect(result.tex).toContain(
      '文本 \\$ \\% \\& \\_ \\# \\{ \\} \\textasciitilde{} \\textasciicircum{} \\textbackslash{}$x_1^2$\\quad \\LaTeXRaw',
    );
    expect(result.tex).toContain('% raw latex placeholder');
  });

  it('normalizes single newlines while preserving paragraph boundaries', () => {
    const document = createEmptyExamDocument('doc-paragraphs');
    document.sections = [
      {
        id: 'section-paragraphs',
        title: '段落',
        kind: 'problem',
        questions: [
          {
            id: 'q-paragraphs',
            type: 'problem',
            stem: [
              {
                type: 'paragraph',
                children: [{ type: 'text', text: '第一行\n第二行' }],
              },
              {
                type: 'paragraph',
                children: [{ type: 'text', text: '第二段' }],
              },
            ],
          },
        ],
      },
    ];

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.diagnostics).toEqual([]);
    expect(result.tex).toContain('第一行 第二行\n\n第二段');
    expect(result.tex).not.toContain('第一行\n第二行');
    expect(result.tex).not.toContain('第一行\\\\第二行');
    expect(result.tex).not.toContain('第一行\\newline 第二行');
  });

  it('exports choices, fillin commands, solutions, and scores', () => {
    const choiceDocument = readExamDocumentFixture(
      documentFixturesDirectory,
      'choice-question.examzh.json',
    );
    const blankDocument = readExamDocumentFixture(
      documentFixturesDirectory,
      'blank-question.examzh.json',
    );
    const problemDocument = readExamDocumentFixture(
      documentFixturesDirectory,
      'problem-with-subquestions.examzh.json',
    );

    const choiceTex = exportExamDocumentToTex(choiceDocument, {
      includeAppMetadata: false,
    }).tex;
    const blankTex = exportExamDocumentToTex(blankDocument, {
      includeAppMetadata: false,
    }).tex;
    const problemTex = exportExamDocumentToTex(problemDocument, {
      includeAppMetadata: false,
    }).tex;

    expect(choiceTex).toContain('\\paren[A]');
    expect(choiceTex).toContain('\\paren[AB]');
    expect(choiceTex).toContain('\\begin{choices}');
    expect(blankTex).toContain('\\fillin[type = line, width = 3em][2]');
    expect(blankTex).toContain('\\fillin*[paren-type = quanjiao, type = paren, width = 4em][4]');
    expect(problemTex).toContain('\\begin{problem}[points = 12]');
    expect(problemTex).toContain('\\begin{enumerate}');
    expect(problemTex).toContain('\\begin{solution}');
    expect(problemTex).toContain('\\textbf{评分点：}\n\n列出条件 \\score{4}');
    expect(problemTex).toContain(
      '\\textbf{小题解析：} 使用数学归纳法。\n\n\\textbf{评分点：}\n\n完成归纳证明 \\score{8}',
    );
    expect(problemTex.slice(0, problemTex.indexOf('\\begin{solution}'))).not.toContain(
      '使用数学归纳法。',
    );
  });

  it('moves subquestion teacher content into the problem solution environment', () => {
    const document = createEmptyExamDocument('doc-subquestion-solution');
    document.setup.answerMode = 'teacher';
    document.sections = [
      {
        id: 'section-problem',
        title: '解答题',
        kind: 'problem',
        questions: [
          {
            id: 'q-subquestion-solution',
            type: 'problem',
            points: 10,
            stem: [{ type: 'paragraph', children: [{ type: 'text', text: '已知条件。' }] }],
            solution: [{ type: 'paragraph', children: [{ type: 'text', text: '整题说明。' }] }],
            scoreMode: 'levels',
            scoreMarks: [
              {
                id: 'score-total',
                points: 10,
                description: [{ type: 'text', text: '完整答案' }],
              },
            ],
            subQuestionGroup: {
              exportAs: 'enumerate',
              listKind: 'enumerate',
              items: [
                {
                  id: 'sub-1',
                  stem: [{ type: 'paragraph', children: [{ type: 'text', text: '第一问。' }] }],
                },
                {
                  id: 'sub-2',
                  stem: [{ type: 'paragraph', children: [{ type: 'text', text: '第二问。' }] }],
                  solution: [
                    { type: 'paragraph', children: [{ type: 'text', text: '第二问解法。' }] },
                  ],
                  scoreMarks: [
                    {
                      id: 'score-sub-2',
                      points: 4,
                      description: [{ type: 'text', text: '步骤正确' }],
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ];

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });
    const problemBody = result.tex.slice(
      result.tex.indexOf('\\begin{problem}'),
      result.tex.indexOf('\\begin{solution}'),
    );
    const solutionBody = result.tex.slice(result.tex.indexOf('\\begin{solution}'));

    expect(result.diagnostics).toEqual([]);
    expect(problemBody).toContain('第一问。');
    expect(problemBody).toContain('第二问。');
    expect(problemBody).not.toContain('第二问解法。');
    expect(problemBody).not.toContain('\\score{4}');
    expect(solutionBody).toContain('整题说明。');
    expect(solutionBody).toContain('\\textbf{评分档：}\n\n完整答案 \\score{10}');
    expect(solutionBody).toContain('\\item[(2)] \\textbf{小题解析：} 第二问解法。');
    expect(solutionBody).toContain('\\textbf{评分点：}\n\n步骤正确 \\score{4}');
  });

  it('exports inline scores and annotations at their solution positions without duplication', () => {
    const document = createEmptyExamDocument('doc-inline-teacher-content');
    document.setup.answerMode = 'teacher';
    document.sections = [
      {
        id: 'section-problem',
        title: '解答题',
        kind: 'problem',
        questions: [
          {
            id: 'question-inline-score',
            type: 'problem',
            points: 6,
            stem: [{ type: 'paragraph', children: [{ type: 'text', text: '完成证明。' }] }],
            solution: [
              {
                type: 'paragraph',
                children: [
                  { type: 'text', text: '完成化简' },
                  { type: 'scoreRef', scoreMarkId: 'score-inline' },
                  { type: 'text', text: '，注意' },
                  { type: 'annotationRef', annotationId: 'annotation-inline' },
                  { type: 'text', text: '。' },
                ],
              },
            ],
            scoreMode: 'additive',
            scoreMarks: [
              {
                id: 'score-inline',
                points: 2,
                description: [{ type: 'text', text: '关键化简' }],
                placement: 'inline',
              },
              {
                id: 'score-summary',
                points: 4,
                description: [{ type: 'text', text: '结论完整' }],
              },
            ],
            solutionAnnotations: [
              {
                id: 'annotation-inline',
                content: [
                  { type: 'text', text: '符号方向 ' },
                  { type: 'inlineMath', latex: 'x>0' },
                ],
              },
            ],
            subQuestionGroup: { items: [] },
          },
        ],
      },
    ];

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.diagnostics).toEqual([]);
    expect(result.tex).toContain('完成化简\\score{2}，注意');
    expect(result.tex).toContain(
      '{\\examsetup{solution/score-pre-content = {}, solution/score-post-content = {}}\\score{符号方向 $x>0$}}',
    );
    expect(result.tex).toContain('\\textbf{评分点：}\n\n结论完整 \\score{4}');
    expect(result.tex.match(/\\score\{2\}/gu)).toHaveLength(1);
    expect(result.tex).not.toContain('符号方向 $x>0$分');
  });

  it('falls back unplaced inline teacher content to the solution tail with warnings', () => {
    const document = createEmptyExamDocument('doc-unplaced-teacher-content');
    document.setup.answerMode = 'teacher';
    document.sections = [
      {
        id: 'section-problem',
        title: '解答题',
        kind: 'problem',
        questions: [
          {
            id: 'question-unplaced-score',
            type: 'problem',
            stem: [],
            solution: [{ type: 'paragraph', children: [{ type: 'text', text: '位置已删除。' }] }],
            scoreMode: 'additive',
            scoreMarks: [{ id: 'score-unplaced', points: 3, placement: 'inline' }],
            solutionAnnotations: [
              {
                id: 'annotation-unplaced',
                content: [{ type: 'text', text: '待重新插入' }],
              },
            ],
            subQuestionGroup: { items: [] },
          },
        ],
      },
    ];

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.tex).toContain('\\textbf{评分点：}\n\n\\score{3}');
    expect(result.tex).toContain('\\score{待重新插入}');
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'inline_score_position_missing' }),
        expect.objectContaining({ code: 'inline_annotation_position_missing' }),
      ]),
    );
  });

  it('orders multiple-choice answers by choice order', () => {
    const document = createEmptyExamDocument('doc-choice-order');
    document.setup.answerMode = 'teacher';
    document.sections = [
      {
        id: 'section-choice-order',
        title: '多选题',
        kind: 'multipleChoice',
        questions: [
          {
            id: 'q-choice-order',
            type: 'multipleChoice',
            stem: [{ type: 'paragraph', children: [{ type: 'text', text: '答案顺序' }] }],
            choices: [
              { id: 'A', content: [] },
              { id: 'B', content: [] },
              { id: 'C', content: [] },
            ],
            correctChoiceIds: ['C', 'A'],
          },
        ],
      },
    ];

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.tex).toContain('\\paren[AC]');
  });

  it('follows answerMode when exporting answers and solutions', () => {
    const document = readExamDocumentFixture(documentFixturesDirectory, 'editor-mvp.examzh.json');
    document.setup.answerMode = 'student';

    const studentResult = exportExamDocumentToTex(document, { includeAppMetadata: false });
    const studentTex = studentResult.tex;

    expect(studentResult.diagnostics).toEqual([]);
    expect(studentTex).toContain('paren/show-answer = false');
    expect(studentTex).toContain('fillin/show-answer = false');
    expect(studentTex).toContain('solution/show-solution = hide');
    expect(studentTex).toContain('\\paren');
    expect(studentTex).not.toContain('\\paren[A]');
    expect(studentTex).not.toContain('\\begin{solution}');
    expect(studentTex).not.toContain('\\score{');
    expect(studentTex).not.toContain('\\fillin[type = line, width = 4em][3]');

    document.setup.answerMode = 'teacher';

    const teacherResult = exportExamDocumentToTex(document, { includeAppMetadata: false });
    const teacherTex = teacherResult.tex;

    expect(teacherResult.diagnostics).toEqual([]);
    expect(teacherTex).toContain('paren/show-answer = true');
    expect(teacherTex).toContain('fillin/show-answer = true');
    expect(teacherTex).toContain('solution/show-solution = show-stay');
    expect(teacherTex).toContain('\\begin{solution}');
    expect(teacherTex).toContain('\\score{');
    expect(teacherTex).toContain('\\fillin[type = line, width = 4em][3]');
  });

  it('exports setup choice maxColumns while preserving explicit examZhOptions precedence', () => {
    const document = createEmptyExamDocument('doc-choice-max-columns');
    document.setup.choices = { maxColumns: 3 };

    const semanticResult = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(semanticResult.diagnostics).toEqual([]);
    expect(semanticResult.tex).toContain('choices/max-columns = 3');

    document.setup.choices.examZhOptions = {
      'label-pos': 'left',
      'max-columns': 4,
    };

    const nestedResult = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(nestedResult.diagnostics).toEqual([]);
    expect(nestedResult.tex).toContain('choices/label-pos = left');
    expect(nestedResult.tex).toContain('choices/max-columns = 4');
    expect(nestedResult.tex).not.toContain('choices/max-columns = 3');

    document.setup.examZhOptions = { 'choices/max-columns': 2 };

    const explicitResult = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(explicitResult.diagnostics).toEqual([]);
    expect(explicitResult.tex).toContain('choices/max-columns = 2');
    expect(explicitResult.tex).not.toContain('choices/max-columns = 3');
  });

  it('exports per-question choices environment options with explicit precedence', () => {
    const document = createEmptyExamDocument('doc-choice-environment-options');
    document.sections = [
      {
        id: 'section-choice-options',
        title: '选择题',
        kind: 'singleChoice',
        questions: [
          {
            id: 'question-choice-options',
            type: 'singleChoice',
            stem: [],
            choices: [
              { id: 'A', content: [] },
              { id: 'B', content: [] },
            ],
            choicesSetup: {
              maxColumns: 2,
              examZhOptions: {
                columns: 1,
                'label-pos': 'left',
                'max-columns': 4,
              },
            },
          },
        ],
      },
    ];

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.diagnostics).toEqual([]);
    expect(result.tex).toContain(
      '\\begin{choices}[columns = 1, label-pos = left, max-columns = 4]',
    );
  });

  it('keeps custom choice display labels aligned with teacher answers', () => {
    const document = createEmptyExamDocument('doc-custom-choice-labels');
    document.setup.answerMode = 'teacher';
    document.sections = [
      {
        id: 'section-custom-choice-labels',
        title: '选择题',
        kind: 'singleChoice',
        questions: [
          {
            id: 'question-custom-choice-labels',
            type: 'singleChoice',
            stem: [],
            choices: [
              { id: 'choice-a', label: '甲', content: [] },
              { id: 'choice-b', label: '乙', content: [] },
            ],
            correctChoiceIds: ['choice-a'],
          },
        ],
      },
    ];

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.diagnostics).toEqual([]);
    expect(result.tex).toContain('\\paren[甲]');
    expect(result.tex).toContain('\\begin{choices}[label = {}, label-sep = 0pt]');
    expect(result.tex).toContain('\\item 甲.\\enspace');
    expect(result.tex).toContain('\\item 乙.\\enspace');
  });

  it('uses built-in choices counters for teacher answer labels', () => {
    const document = createEmptyExamDocument('doc-choice-counter-labels');
    document.setup.answerMode = 'teacher';
    document.sections = [
      {
        id: 'section-choice-counter-labels',
        title: '选择题',
        kind: 'singleChoice',
        questions: [
          {
            id: 'question-choice-counter-labels',
            type: 'singleChoice',
            stem: [],
            choices: [
              { id: 'A', content: [] },
              { id: 'B', content: [] },
            ],
            choicesSetup: { examZhOptions: { index: 2, label: '\\arabic*)' } },
            correctChoiceIds: ['B'],
          },
        ],
      },
    ];

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.diagnostics).toEqual([]);
    expect(result.tex).toContain('\\paren[3]');
    expect(result.tex).toContain('\\begin{choices}[index = 2, label = \\arabic*)]');

    delete document.sections[0]!.questions[0]!.choicesSetup!.examZhOptions!.label;

    const defaultLabelResult = exportExamDocumentToTex(document, {
      includeAppMetadata: false,
    });

    expect(defaultLabelResult.diagnostics).toEqual([]);
    expect(defaultLabelResult.tex).toContain('\\paren[C]');
    expect(defaultLabelResult.tex).toContain('\\begin{choices}[index = 2]');
  });

  it('exports GUI-managed global and per-question choice layout presets', () => {
    const document = createEmptyExamDocument('doc-choice-layout-gui');
    document.setup.answerMode = 'teacher';
    document.setup.choices = {
      maxColumns: 2,
      examZhOptions: {
        label: '\\circlednumber*',
        'label-pos': 'bottom',
      },
    };
    document.sections = [
      {
        id: 'section-choice-layout-gui',
        title: '选择题',
        kind: 'singleChoice',
        questions: [
          {
            id: 'question-choice-layout-gui',
            type: 'singleChoice',
            stem: [],
            choices: [
              { id: 'A', label: 'A', content: [] },
              { id: 'B', label: 'B', content: [] },
            ],
            choicesSetup: {
              examZhOptions: {
                columns: 3,
                label: '\\Roman*.',
                'label-pos': 'left',
              },
            },
            correctChoiceIds: ['B'],
          },
        ],
      },
    ];

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.diagnostics).toEqual([]);
    expect(result.tex).toContain('choices/max-columns = 2');
    expect(result.tex).toContain('choices/label = \\circlednumber*');
    expect(result.tex).toContain('choices/label-pos = bottom');
    expect(result.tex).toContain(
      '\\begin{choices}[columns = 3, label = \\Roman*., label-pos = left]',
    );
    expect(result.tex).toContain('\\paren[II]');
  });

  it('exports advanced choice spacing, label allocation, and per-question index', () => {
    const document = createEmptyExamDocument('doc-choice-layout-advanced');
    document.setup.answerMode = 'teacher';
    document.setup.choices = {
      examZhOptions: {
        'column-sep': '.5em',
        'label-sep': '.25em',
        'label-width': '1.5em',
        'label-align': 'center',
        'top-sep': '.25em',
        'bottom-sep': '.25em',
        linesep: '.25em plus .15em',
      },
    };
    document.sections = [
      {
        id: 'section-choice-layout-advanced',
        title: '选择题',
        kind: 'singleChoice',
        questions: [
          {
            id: 'question-choice-layout-advanced',
            type: 'singleChoice',
            stem: [],
            choices: [
              { id: 'A', label: 'A', content: [] },
              { id: 'B', label: 'B', content: [] },
            ],
            choicesSetup: {
              examZhOptions: {
                index: 3,
                label: '\\circlednumber*',
                'column-sep': '1.75em',
                'label-sep': '.8em',
                'label-width': '2em',
                'label-align': 'right',
                'top-sep': '.5em',
                'bottom-sep': '.5em',
                linesep: '.5em plus .25em',
              },
            },
            correctChoiceIds: ['A'],
          },
        ],
      },
    ];

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.diagnostics).toEqual([]);
    for (const option of [
      'choices/column-sep = .5em',
      'choices/label-sep = .25em',
      'choices/label-width = 1.5em',
      'choices/label-align = center',
      'choices/top-sep = .25em',
      'choices/bottom-sep = .25em',
      'choices/linesep = .25em plus .15em',
    ]) {
      expect(result.tex).toContain(option);
    }

    const localOptions = result.tex.match(/\\begin\{choices\}\[([^\]]+)\]/u)?.[1];
    expect(localOptions).toBeDefined();
    for (const option of [
      'index = 3',
      'label = \\circlednumber*',
      'column-sep = 1.75em',
      'label-sep = .8em',
      'label-width = 2em',
      'label-align = right',
      'top-sep = .5em',
      'bottom-sep = .5em',
      'linesep = .5em plus .25em',
    ]) {
      expect(localOptions).toContain(option);
    }
    expect(result.tex).toContain('\\paren[③]');
  });

  it('preserves inactive advanced label settings beside custom item labels', () => {
    const document = createEmptyExamDocument('doc-choice-layout-custom-label-advanced');
    document.setup.answerMode = 'teacher';
    document.sections = [
      {
        id: 'section-choice-layout-custom-label-advanced',
        title: '选择题',
        kind: 'singleChoice',
        questions: [
          {
            id: 'question-choice-layout-custom-label-advanced',
            type: 'singleChoice',
            stem: [],
            choices: [
              { id: 'A', label: '甲', content: [] },
              { id: 'B', label: '乙', content: [] },
            ],
            choicesSetup: {
              examZhOptions: {
                index: 3,
                'label-width': '2em',
                'label-align': 'right',
              },
            },
            correctChoiceIds: ['A'],
          },
        ],
      },
    ];

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.diagnostics).toEqual([]);
    expect(result.tex).toContain('\\paren[甲]');
    expect(result.tex).toContain('index = 3');
    expect(result.tex).toContain('label-width = 2em');
    expect(result.tex).toContain('label-align = right');
    expect(result.tex).toContain('label = {}');
  });

  it('reapplies global fixed columns locally and lets a question return to automatic layout', () => {
    const document = createEmptyExamDocument('doc-choice-layout-global-fixed');
    document.setup.choices = { examZhOptions: { columns: 2 } };
    document.sections = [
      {
        id: 'section-choice-layout-global-fixed',
        title: '选择题',
        kind: 'singleChoice',
        questions: [
          {
            id: 'question-choice-layout-inherit-fixed',
            type: 'singleChoice',
            stem: [],
            choices: [
              { id: 'A', label: 'A', content: [] },
              { id: 'B', label: 'B', content: [] },
            ],
          },
          {
            id: 'question-choice-layout-local-auto',
            type: 'singleChoice',
            stem: [],
            choices: [
              { id: 'A', label: 'A', content: [] },
              { id: 'B', label: 'B', content: [] },
            ],
            choicesSetup: { maxColumns: 1 },
          },
        ],
      },
    ];

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.diagnostics).toEqual([]);
    expect(result.tex).toContain('choices/columns = 2');
    expect(result.tex).toContain('\\begin{choices}[columns = 2]');
    expect(result.tex).toContain('\\begin{choices}[max-columns = 1]');
  });

  it('does not repeat the upstream automatic columns sentinel in an environment', () => {
    const document = createEmptyExamDocument('doc-choice-layout-global-auto-sentinel');
    document.setup.choices = { examZhOptions: { columns: 0 } };
    document.sections = [
      {
        id: 'section-choice-layout-global-auto-sentinel',
        title: '选择题',
        kind: 'singleChoice',
        questions: [
          {
            id: 'question-choice-layout-global-auto-sentinel',
            type: 'singleChoice',
            stem: [],
            choices: [
              { id: 'A', label: 'A', content: [] },
              { id: 'B', label: 'B', content: [] },
            ],
          },
        ],
      },
    ];

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.diagnostics).toEqual([]);
    expect(result.tex).toContain('choices/columns = 0');
    expect(result.tex).toContain('\\begin{choices}\n');
    expect(result.tex).not.toContain('\\begin{choices}[columns = 0]');
  });

  it('lets per-question counters override preserved custom labels', () => {
    const document = createEmptyExamDocument('doc-choice-label-priority');
    document.setup.answerMode = 'teacher';
    document.setup.choices = { examZhOptions: { label: '\\circlednumber*' } };
    document.sections = [
      {
        id: 'section-choice-label-priority',
        title: '选择题',
        kind: 'singleChoice',
        questions: [
          {
            id: 'question-choice-label-priority',
            type: 'singleChoice',
            stem: [],
            choices: [
              { id: 'A', label: '甲', content: [] },
              { id: 'B', label: '乙', content: [] },
            ],
            correctChoiceIds: ['A'],
          },
        ],
      },
    ];

    const customResult = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(customResult.diagnostics).toEqual([]);
    expect(customResult.tex).toContain('\\paren[甲]');
    expect(customResult.tex).toContain('\\begin{choices}[label = {}, label-sep = 0pt]');

    document.sections[0]!.questions[0]!.choicesSetup = {
      examZhOptions: { label: '\\circlednumber*' },
    };

    const localCounterResult = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(localCounterResult.diagnostics).toEqual([]);
    expect(localCounterResult.tex).toContain('\\paren[①]');
    expect(localCounterResult.tex).toContain('\\begin{choices}[label = \\circlednumber*]');
    expect(localCounterResult.tex).not.toContain('label = {}');
  });

  it('exports advanced front matter setup keys only when stored in examZhOptions', () => {
    const defaultDocument = createEmptyExamDocument('doc-default-front-matter-options');
    const defaultResult = exportExamDocumentToTex(defaultDocument, { includeAppMetadata: false });

    expect(defaultResult.diagnostics).toEqual([]);
    expect(defaultResult.tex).not.toContain('notice/label');
    expect(defaultResult.tex).not.toContain('title/top-sep');

    const document = createEmptyExamDocument('doc-front-matter-options');
    document.setup.examZhOptions = {
      'notice/label': '答题须知：',
      'notice/label-format': '\\bfseries',
      'notice/top-sep': '.1em plus .1em minus .05em',
      'notice/bottom-sep': '.1em plus .1em minus .05em',
      'title/top-sep': '-.75em plus .2em minus .1em',
      'title/bottom-sep': '-.25em plus .2em minus .1em',
    };

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.diagnostics).toEqual([]);
    expect(result.tex).toContain('notice/label = 答题须知：');
    expect(result.tex).toContain('notice/label-format = \\bfseries');
    expect(result.tex).toContain('notice/top-sep = .1em plus .1em minus .05em');
    expect(result.tex).toContain('notice/bottom-sep = .1em plus .1em minus .05em');
    expect(result.tex).toContain('title/top-sep = -.75em plus .2em minus .1em');
    expect(result.tex).toContain('title/bottom-sep = -.25em plus .2em minus .1em');
  });

  it('validates problem environment options against the problem namespace', () => {
    const document = createEmptyExamDocument('doc-problem-options');
    document.sections = [
      {
        id: 'section-problem-options',
        title: '解答题',
        kind: 'problem',
        questions: [
          {
            id: 'q-problem-options',
            type: 'problem',
            index: 3,
            points: 12,
            examZhOptions: {
              label: '\\Roman*.',
              'show-points': 'true',
            },
            stem: [{ type: 'paragraph', children: [{ type: 'text', text: '证明。' }] }],
          },
        ],
      },
    ];

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.diagnostics).toEqual([]);
    expect(result.tex).toContain(
      '\\begin{problem}[index = 3, label = \\Roman*., points = 12, show-points = true]',
    );
  });

  it('exports global fillin semantics and passthrough options with explicit precedence', () => {
    const document = createEmptyExamDocument('doc-global-fillin-options');
    document.setup.fillin = {
      type: 'line',
      width: '4em',
      examZhOptions: {
        type: 'paren',
        'box-color': 'blue',
        'text-color': 'red',
        'no-answer-counter-index': 2,
        'no-answer-counter-label': '\\circlednumber*',
        depth: '.5em',
      },
    };
    document.setup.examZhOptions = {
      'fillin/type': 'rectangle',
      'fillin/width': '6em',
    };
    document.sections = [
      {
        id: 'section-blank-options',
        title: '填空题',
        kind: 'blank',
        questions: [
          {
            id: 'q-blank-options',
            type: 'blank',
            stem: [
              {
                type: 'paragraph',
                children: [
                  { type: 'text', text: '结果为' },
                  { type: 'blankRef', blankId: 'blank-options' },
                ],
              },
            ],
            blanks: [
              {
                id: 'blank-options',
                type: 'paren',
                noAnswerType: 'counter',
                widthType: 'fill',
                parenType: 'quanjiao',
              },
            ],
          },
        ],
      },
    ];

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.diagnostics).toEqual([]);
    expect(result.tex).toContain('fillin/type = rectangle');
    expect(result.tex).toContain('fillin/width = 6em');
    expect(result.tex).toContain('fillin/box-color = blue');
    expect(result.tex).toContain('fillin/text-color = red');
    expect(result.tex).toContain('fillin/no-answer-counter-index = 2');
    expect(result.tex).toContain('fillin/no-answer-counter-label = \\circlednumber*');
    expect(result.tex).toContain('fillin/depth = .5em');
    expect(result.tex).toContain('fillin/show-answer = false');
    expect(result.tex).not.toContain('fillin/no-answer-type =');
    expect(result.tex).toContain(
      '\\fillin[no-answer-type = counter, paren-type = quanjiao, type = paren, width-type = fill][]',
    );
  });

  it('lets command-level fillin show-answer override the document answer mode', () => {
    const document = createEmptyExamDocument('doc-local-fillin-answer-mode');
    document.sections = [
      {
        id: 'section-blank',
        title: '填空题',
        kind: 'blank',
        questions: [
          {
            id: 'q-local-answer-mode',
            type: 'blank',
            stem: [
              {
                type: 'paragraph',
                children: [
                  { type: 'blankRef', blankId: 'blank-local-show' },
                  { type: 'blankRef', blankId: 'blank-local-hide' },
                ],
              },
            ],
            blanks: [
              {
                id: 'blank-local-show',
                answer: [{ type: 'paragraph', children: [{ type: 'text', text: '显示答案' }] }],
                examZhOptions: { 'show-answer': true },
              },
              {
                id: 'blank-local-hide',
                answer: [{ type: 'paragraph', children: [{ type: 'text', text: '隐藏答案' }] }],
                examZhOptions: { 'show-answer': false },
              },
            ],
          },
        ],
      },
    ];

    const studentResult = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(studentResult.diagnostics).toEqual([]);
    expect(studentResult.tex).toContain('\\fillin[show-answer = true][显示答案]');
    expect(studentResult.tex).toContain('\\fillin[show-answer = false][]');
    expect(studentResult.tex).not.toContain('隐藏答案');

    document.setup.answerMode = 'teacher';
    const teacherResult = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(teacherResult.diagnostics).toEqual([]);
    expect(teacherResult.tex).toContain('\\fillin[show-answer = true][显示答案]');
    expect(teacherResult.tex).toContain('\\fillin[show-answer = false][]');
    expect(teacherResult.tex).not.toContain('隐藏答案');
  });

  it('uses a compile-safe fillin command for breakable circle and rectangle answers', () => {
    const document = createEmptyExamDocument('doc-breakable-shaped-fillin');
    document.setup.answerMode = 'teacher';
    document.sections = [
      {
        id: 'section-blank',
        title: '填空题',
        kind: 'blank',
        questions: [
          {
            id: 'q-breakable-shaped-fillin',
            type: 'blank',
            stem: [
              {
                type: 'paragraph',
                children: [
                  { type: 'blankRef', blankId: 'blank-circle' },
                  { type: 'blankRef', blankId: 'blank-circle' },
                  { type: 'blankRef', blankId: 'blank-rectangle' },
                ],
              },
            ],
            blanks: [
              {
                id: 'blank-circle',
                command: 'fillin*',
                type: 'circle',
                answer: [{ type: 'paragraph', children: [{ type: 'text', text: '1' }] }],
              },
              {
                id: 'blank-rectangle',
                command: 'fillin*',
                type: 'rectangle',
                answer: [{ type: 'paragraph', children: [{ type: 'text', text: '2' }] }],
              },
            ],
          },
        ],
      },
    ];

    const teacherResult = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(teacherResult.tex).not.toContain('\\fillin*');
    expect(teacherResult.tex.match(/\\fillin\[/gu)).toHaveLength(3);
    expect(
      teacherResult.diagnostics.filter(
        (diagnostic) => diagnostic.code === 'fillin_breakable_type_fallback',
      ),
    ).toHaveLength(2);

    document.setup.answerMode = 'student';
    const studentResult = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(studentResult.tex.match(/\\fillin\*\[/gu)).toHaveLength(3);
    expect(studentResult.diagnostics).toEqual([]);
  });

  it('exports semantic blank references at their inline position', () => {
    const document = readExamDocumentFixture(documentFixturesDirectory, 'editor-mvp.examzh.json');
    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.diagnostics).toEqual([]);
    expect(result.tex).toContain('$a+b=$\\fillin[type = line, width = 4em][3]');
    expect(result.tex).toContain('$ab=$\\fillin*[type = paren, width = 4em][2]');
  });

  it('exports rich content blank answers without leaking them in student mode', () => {
    const document = createEmptyExamDocument('doc-rich-blank-answer');
    document.sections = [
      {
        id: 'section-blank',
        title: '填空题',
        kind: 'blank',
        questions: [
          {
            id: 'q-rich-blank',
            type: 'blank',
            stem: [
              {
                type: 'paragraph',
                children: [
                  { type: 'text', text: '值为' },
                  { type: 'blankRef', blankId: 'blank-1' },
                  { type: 'text', text: '，另一个值为' },
                  { type: 'blankRef', blankId: 'blank-2' },
                ],
              },
            ],
            blanks: [
              {
                id: 'blank-1',
                command: 'fillin',
                answer: [
                  {
                    type: 'paragraph',
                    children: [
                      { type: 'text', text: '答案 ' },
                      { type: 'inlineMath', latex: 'f(0)=1' },
                    ],
                  },
                ],
              },
              {
                id: 'blank-2',
                command: 'fillin',
                answer: [{ type: 'displayMath', latex: '\\frac{1}{2}' }],
              },
            ],
          },
        ],
      },
    ];

    document.setup.answerMode = 'student';
    const studentResult = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(studentResult.tex).toContain('\\fillin');
    expect(studentResult.tex).not.toContain('f(0)=1');
    expect(studentResult.tex).not.toContain('\\frac{1}{2}');

    document.setup.answerMode = 'teacher';
    const teacherResult = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(teacherResult.tex).toContain('\\fillin[答案 $f(0)=1$]');
    expect(teacherResult.tex).toContain('\\fillin[$\\frac{1}{2}$]');
    expect(teacherResult.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: 'warning',
        code: 'blank_answer_display_math_downgraded',
        path: 'blank.blank-2.answer',
      }),
    );
  });

  it('exports semantic choice parentheses and stem lines inline', () => {
    const document = createEmptyExamDocument('doc-choice-paren-line');
    document.setup.answerMode = 'teacher';
    document.sections = [
      {
        id: 'section-choice',
        title: '选择题',
        kind: 'singleChoice',
        questions: [
          {
            id: 'q-auto-paren',
            type: 'singleChoice',
            stem: [{ type: 'paragraph', children: [{ type: 'text', text: '自动括号' }] }],
            choices: [{ id: 'A', content: [] }],
            correctChoiceIds: ['A'],
          },
          {
            id: 'q-inline-paren',
            type: 'singleChoice',
            stem: [
              {
                type: 'paragraph',
                children: [
                  { type: 'text', text: '这里 ' },
                  { type: 'stemLine' },
                  { type: 'text', text: ' 应选 ' },
                  { type: 'choiceParenRef' },
                ],
              },
            ],
            choices: [{ id: 'B', content: [] }],
            correctChoiceIds: ['B'],
          },
        ],
      },
    ];

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.diagnostics).toEqual([]);
    expect(result.tex).toContain('自动括号 \\paren[A]');
    expect(result.tex).toContain(
      '这里 \\underline{\\hspace{3em}} 应选 {\\examsetup{paren/type = none}\\paren[B]}',
    );
    expect(result.tex).not.toContain('应选 \\paren[B] \\paren[B]');
  });

  it('exports judgement answers for both placements and answer styles', () => {
    const document = createEmptyExamDocument('doc-judgement-export');
    document.setup.answerMode = 'teacher';
    document.sections = [
      {
        id: 'section-judgement',
        title: '判断题',
        kind: 'judgement',
        questions: [
          {
            id: 'judgement-text-true',
            type: 'judgement',
            stem: [{ type: 'paragraph', children: [{ type: 'text', text: '一加一等于二' }] }],
            judgement: { correctAnswer: true },
          },
          {
            id: 'judgement-symbol-false',
            type: 'judgement',
            stem: [
              {
                type: 'paragraph',
                children: [{ type: 'text', text: '一加一等于三 ' }, { type: 'judgementRef' }],
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

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.diagnostics).toEqual([]);
    expect(result.tex).toContain('一加一等于二 \\paren[对]');
    expect(result.tex).toContain(
      '一加一等于三 \\fillin[no-answer-type = none, type = paren][$\\times$]',
    );
    expect(result.tex).not.toContain('\\begin{choices}');
  });

  it('hides judgement answers in student exports and keeps empty answers compilable', () => {
    const document = createEmptyExamDocument('doc-judgement-student');
    document.sections = [
      {
        id: 'section-judgement',
        title: '判断题',
        kind: 'judgement',
        questions: [
          {
            id: 'judgement-student',
            type: 'judgement',
            stem: [{ type: 'paragraph', children: [{ type: 'text', text: '学生题' }] }],
            judgement: { correctAnswer: false, answerStyle: 'symbol' },
          },
          {
            id: 'judgement-unanswered',
            type: 'judgement',
            stem: [{ type: 'paragraph', children: [{ type: 'text', text: '未设答案' }] }],
          },
        ],
      },
    ];

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.diagnostics).toEqual([]);
    expect(result.tex).toContain('学生题 \\paren');
    expect(result.tex).toContain('未设答案 \\paren');
    expect(result.tex).not.toContain('\\times');
    expect(result.tex).not.toContain('[错]');
  });

  it('appends missing inline judgement refs with one warning', () => {
    const document = createEmptyExamDocument('doc-judgement-inline-fallback');
    document.setup.answerMode = 'teacher';
    document.sections = [
      {
        id: 'section-judgement',
        title: '判断题',
        kind: 'judgement',
        questions: [
          {
            id: 'judgement-inline-fallback',
            type: 'judgement',
            stem: [{ type: 'paragraph', children: [{ type: 'text', text: '追加括号' }] }],
            judgement: { correctAnswer: true, placement: 'inline' },
          },
        ],
      },
    ];

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.tex).toContain('追加括号 \\fillin[no-answer-type = none, type = paren][对]');
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        severity: 'warning',
        code: 'judgement_appended_after_stem',
      }),
    ]);
  });

  it('keeps judgement answer colors independent from choices and fillins', () => {
    const blackJudgement = createEmptyExamDocument('doc-judgement-black');
    blackJudgement.setup.answerMode = 'teacher';
    blackJudgement.setup.examZhOptions = {
      'paren/text-color': 'red',
      'fillin/text-color': 'red',
    };
    blackJudgement.sections = [
      {
        id: 'section-judgement',
        title: '判断题',
        kind: 'judgement',
        questions: [
          {
            id: 'judgement-line-end',
            type: 'judgement',
            stem: [{ type: 'paragraph', children: [{ type: 'text', text: '行末' }] }],
            judgement: { correctAnswer: true },
          },
          {
            id: 'judgement-inline',
            type: 'judgement',
            stem: [{ type: 'paragraph', children: [{ type: 'judgementRef' }] }],
            judgement: { correctAnswer: false, placement: 'inline' },
          },
        ],
      },
    ];
    const redJudgement = structuredClone(blackJudgement);
    redJudgement.documentId = 'doc-judgement-red';
    redJudgement.setup.judgement = { answerColor: 'red' };
    redJudgement.setup.examZhOptions = {
      'paren/text-color': 'black',
      'fillin/text-color': 'black',
    };

    const blackResult = exportExamDocumentToTex(blackJudgement, { includeAppMetadata: false });
    const redResult = exportExamDocumentToTex(redJudgement, { includeAppMetadata: false });

    expect(blackResult.tex).toContain('{\\examsetup{paren/text-color = black}\\paren[对]}');
    expect(blackResult.tex).toContain(
      '\\fillin[no-answer-type = none, text-color = black, type = paren][错]',
    );
    expect(redResult.tex).toContain('{\\examsetup{paren/text-color = red}\\paren[对]}');
    expect(redResult.tex).toContain(
      '\\fillin[no-answer-type = none, text-color = red, type = paren][错]',
    );
  });

  it('resolves nested paren colors before applying judgement color isolation', () => {
    const document = createEmptyExamDocument('doc-judgement-nested-color');
    document.setup.answerMode = 'teacher';
    document.setup.examZhOptions = { paren: { 'text-color': 'red' } };
    document.sections = [
      {
        id: 'section-judgement',
        title: '判断题',
        kind: 'judgement',
        questions: [
          {
            id: 'judgement-nested-color',
            type: 'judgement',
            stem: [{ type: 'paragraph', children: [{ type: 'text', text: '嵌套颜色' }] }],
            judgement: { correctAnswer: true },
          },
        ],
      },
    ];

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.tex).toContain('嵌套颜色 {\\examsetup{paren/text-color = black}\\paren[对]}');
  });

  it('returns source map entries for sections, questions, and solutions', () => {
    const document = readExamDocumentFixture(
      documentFixturesDirectory,
      'problem-with-subquestions.examzh.json',
    );
    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.sourceMap).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'sections.0', label: '第 1 节：解答题' }),
        expect.objectContaining({
          path: 'sections.0.questions.0',
          label: '第 1 题：解答题',
        }),
        expect.objectContaining({
          path: 'sections.0.questions.0.solution',
          label: '第 1 题解析',
        }),
        expect.objectContaining({
          path: 'sections.0.questions.0.subQuestionGroup.items.1.solution',
          label: '第 1 题第 2 小题解析',
        }),
      ]),
    );
  });

  it('does not emit an empty enumerate environment for problem questions without subquestions', () => {
    const document = createEmptyExamDocument('doc-empty-subquestions');
    document.sections = [
      {
        id: 'section-problem',
        title: '解答题',
        kind: 'problem',
        questions: [
          {
            id: 'problem-empty-subquestions',
            type: 'problem',
            environment: 'problem',
            stem: [{ type: 'paragraph', children: [{ type: 'text', text: '直接解答。' }] }],
            subQuestionGroup: {
              exportAs: 'enumerate',
              listKind: 'enumerate',
              items: [],
            },
          },
        ],
      },
    ];

    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.tex).toContain('直接解答。');
    expect(result.tex).not.toContain('\\begin{enumerate}');
    expect(result.tex).not.toContain('\\end{enumerate}');
  });

  it('exports figures while reporting missing image paths when needed', () => {
    const document = readExamDocumentFixture(documentFixturesDirectory, 'figures.examzh.json');
    const result = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(result.tex).toContain('\\textfigure{');
    expect(result.tex).toContain('\\begin{multifigures}');
    expect(result.tex).toContain('\\includegraphics{assets/graph-1.png}');
    expect(result.diagnostics).toEqual([]);

    document.assets[0] = { id: 'asset-graph-1', kind: 'image' };
    const missingImageResult = exportExamDocumentToTex(document, { includeAppMetadata: false });

    expect(missingImageResult.diagnostics).toContainEqual({
      severity: 'warning',
      code: 'missing_image_path',
      message: '图片资源“asset-graph-1”没有 exportPath 或 sourcePath。',
      path: 'assets.asset-graph-1',
    });
  });

  it('returns an error diagnostic for invalid documents', () => {
    const document = createEmptyExamDocument('doc-invalid-export');
    const invalidDocument = {
      ...document,
      examZh: {
        documentClass: {
          twoside: 'yes',
        },
      },
    } as unknown as ExamDocument;

    const result = exportExamDocumentToTex(invalidDocument, { includeAppMetadata: false });

    expect(result.tex).toBe('');
    expect(result.diagnostics[0]?.severity).toBe('error');
    expect(result.diagnostics[0]?.code).toBe('invalid_document');
  });
});

function createMinimalChoiceQuestion(id: string, points: number): ExamQuestion {
  const choiceId = `${id}-choice`;
  return {
    id,
    type: 'singleChoice',
    points,
    stem: [{ type: 'paragraph', children: [{ type: 'text', text: '选择正确答案。' }] }],
    choices: [{ id: choiceId, label: 'A', content: [] }],
    correctChoiceIds: [choiceId],
  };
}

function createMinimalProblemQuestion(id: string, points: number): ExamQuestion {
  return {
    id,
    type: 'problem',
    points,
    stem: [{ type: 'paragraph', children: [{ type: 'text', text: '解答。' }] }],
  };
}

function createMinimalBlankQuestion(id: string, points: number): ExamQuestion {
  const blankId = `${id}-blank`;
  return {
    id,
    type: 'blank',
    points,
    stem: [{ type: 'paragraph', children: [{ type: 'blankRef', blankId }] }],
    blanks: [{ id: blankId }],
  };
}

function readExamDocumentFixture(directory: URL, fixtureName: string): ExamDocument {
  return deserializeExamDocument(readFileSync(new URL(fixtureName, directory), 'utf8'));
}
