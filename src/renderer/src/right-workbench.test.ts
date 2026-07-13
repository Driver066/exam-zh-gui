import { describe, expect, it } from 'vitest';

import {
  createDefaultQuestion,
  createDefaultSection,
  createEmptyExamDocument,
  createExamDocumentFromTemplate,
  parseRichContentInput,
  type CreateId,
} from '../../shared/document';
import type { ExportPdfArtifactResult } from '../../shared/ipc/contracts';
import {
  applyPdfExportProgress,
  buildDocumentCheckItems,
  getPdfExportItemPresentation,
  getPdfSessionIssueCount,
  getRightWorkbenchScrollKey,
  getSuccessfulPdfArtifacts,
  isPdfExportSessionBusy,
  isPdfExportSessionFinal,
  queuePdfExportRetry,
  resolvePdfExportRoute,
  shouldPreservePdfPreviewFocus,
  type PdfExportSessionView,
} from './right-workbench';

describe('right workbench checks', () => {
  it('collects missing answers, total mismatch, and score diagnostics with targets', () => {
    const createId = sequenceIdFactory();
    const singleChoice = createDefaultQuestion('singleChoice', createId);
    const multipleChoice = createDefaultQuestion('multipleChoice', createId);
    const blank = createDefaultQuestion('blank', createId);
    const judgement = createDefaultQuestion('judgement', createId);
    const problem = createDefaultQuestion('problem', createId);
    const section = createDefaultSection(createId, 'custom');

    singleChoice.correctChoiceIds = undefined;
    multipleChoice.correctChoiceIds = undefined;
    blank.blanks = blank.blanks?.map((slot) => ({ ...slot, answer: [] }));
    problem.points = 10;
    problem.scoreMarks = [
      { id: 'score-1', points: 4, description: [{ type: 'text', text: '第一步' }] },
    ];

    const document = {
      ...createEmptyExamDocument('right-checks'),
      metadata: { title: '检查示例', subject: '数学', totalPoints: 99 },
      sections: [
        {
          ...section,
          questions: [singleChoice, multipleChoice, blank, judgement, problem],
        },
      ],
    };
    const checks = buildDocumentCheckItems(document, { includeExportDiagnostics: false });

    expect(checks.filter((check) => check.code === 'answer_missing')).toHaveLength(4);
    expect(checks).toContainEqual(
      expect.objectContaining({
        code: 'total_points_mismatch',
        title: '标注总分与题目合计不一致',
      }),
    );
    expect(checks).toContainEqual(
      expect.objectContaining({
        code: 'score_total_mismatch',
        sectionId: section.id,
        questionId: problem.id,
      }),
    );
  });

  it('does not treat false judgement answers or filled blanks as missing', () => {
    const createId = sequenceIdFactory();
    const judgement = createDefaultQuestion('judgement', createId);
    const blank = createDefaultQuestion('blank', createId);
    const section = createDefaultSection(createId, 'custom');

    judgement.judgement = { correctAnswer: false };
    blank.blanks = blank.blanks?.map((slot) => ({
      ...slot,
      answer: parseRichContentInput('$0$', { context: 'blankAnswer' }).blocks,
    }));

    const document = {
      ...createEmptyExamDocument('right-check-complete'),
      sections: [{ ...section, questions: [judgement, blank] }],
    };

    expect(
      buildDocumentCheckItems(document, { includeExportDiagnostics: false }).filter(
        (check) => check.code === 'answer_missing',
      ),
    ).toEqual([]);
  });

  it('uses effective cross-section numbering in check titles', () => {
    const createId = sequenceIdFactory();
    const firstSection = createDefaultSection(createId, 'singleChoice');
    const secondSection = createDefaultSection(createId, 'problem');
    const first = createDefaultQuestion('singleChoice', createId);
    const second = createDefaultQuestion('singleChoice', createId);
    const problem = createDefaultQuestion('problem', createId);

    problem.points = 10;
    problem.scoreMarks = [
      { id: 'score-reset', points: 4, description: [{ type: 'text', text: '第一步' }] },
    ];
    const document = {
      ...createEmptyExamDocument('right-check-numbering'),
      sections: [
        { ...firstSection, questions: [first, second] },
        { ...secondSection, numbering: { reset: true }, questions: [problem] },
      ],
    };

    const scoreCheck = buildDocumentCheckItems(document, {
      includeExportDiagnostics: false,
    }).find((check) => check.questionId === problem.id && check.code === 'score_total_mismatch');

    expect(scoreCheck?.title).toBe('第 1 题评分需要确认');
  });

  it('includes exporter diagnostics and maps question paths when possible', () => {
    const createId = sequenceIdFactory();
    const question = createDefaultQuestion('singleChoice', createId);
    const section = createDefaultSection(createId, 'singleChoice');
    question.correctChoiceIds = [question.choices![0]!.id];
    question.examZhOptions = { 'not-a-real-key': true };
    const document = {
      ...createEmptyExamDocument('right-export-check'),
      sections: [{ ...section, questions: [question] }],
    };

    const exportCheck = buildDocumentCheckItems(document).find((check) =>
      check.code.startsWith('export_exam_zh_'),
    );

    expect(exportCheck).toMatchObject({
      severity: 'warning',
      sectionId: section.id,
      questionId: question.id,
    });
  });

  it('reports score-level order and missing inline positions without duplicate export checks', () => {
    const createId = sequenceIdFactory();
    const question = createDefaultQuestion('problem', createId);
    const section = createDefaultSection(createId, 'problem');
    question.points = 4;
    question.scoreMode = 'levels';
    question.scoreMarks = [
      {
        id: 'score-low',
        points: 2,
        description: [{ type: 'text', text: '部分正确' }],
        placement: 'inline',
      },
      {
        id: 'score-high',
        points: 4,
        description: [{ type: 'text', text: '完整正确' }],
      },
    ];
    question.solutionAnnotations = [
      {
        id: 'annotation-unplaced',
        content: [{ type: 'text', text: '注意符号方向' }],
      },
    ];
    section.questions = [question];
    const document = {
      ...createEmptyExamDocument('right-teacher-content-checks'),
      sections: [section],
    };

    const checks = buildDocumentCheckItems(document);

    expect(checks.filter((check) => check.code === 'score_level_order')).toHaveLength(1);
    expect(checks.filter((check) => check.code === 'inline_score_position_missing')).toHaveLength(
      1,
    );
    expect(
      checks.filter((check) => check.code === 'inline_annotation_position_missing'),
    ).toHaveLength(1);
    expect(checks).not.toContainEqual(
      expect.objectContaining({ code: 'export_inline_score_position_missing' }),
    );
  });

  it('returns no checks for a complete document without exporter diagnostics', () => {
    const createId = sequenceIdFactory();
    const question = createDefaultQuestion('singleChoice', createId);
    const section = createDefaultSection(createId, 'singleChoice');
    question.correctChoiceIds = [question.choices![0]!.id];
    const document = {
      ...createEmptyExamDocument('right-check-clean'),
      sections: [{ ...section, questions: [question] }],
    };

    expect(buildDocumentCheckItems(document, { includeExportDiagnostics: false })).toEqual([]);
  });

  it('uses the full math exam as a clean check baseline and detects derived regressions', () => {
    const document = createExamDocumentFromTemplate('math-full-exam', sequenceIdFactory());

    expect(buildDocumentCheckItems(document)).toEqual([]);

    const totalMismatch = structuredClone(document);
    totalMismatch.metadata.totalPoints = 149;
    expect(buildDocumentCheckItems(totalMismatch)).toContainEqual(
      expect.objectContaining({ code: 'total_points_mismatch' }),
    );

    const missingAnswer = structuredClone(document);
    missingAnswer.sections[0]!.questions[0]!.correctChoiceIds = undefined;
    expect(buildDocumentCheckItems(missingAnswer)).toContainEqual(
      expect.objectContaining({
        code: 'answer_missing',
        questionId: missingAnswer.sections[0]!.questions[0]!.id,
      }),
    );

    const scoreMismatch = structuredClone(document);
    scoreMismatch.sections[0]!.questions[0]!.scoreMarks![0]!.points = 4;
    expect(buildDocumentCheckItems(scoreMismatch)).toContainEqual(
      expect.objectContaining({
        code: 'score_total_mismatch',
        questionId: scoreMismatch.sections[0]!.questions[0]!.id,
      }),
    );
  });
});

describe('right workbench PDF routing', () => {
  it('keeps independent scroll keys for draft, PDF, and checks', () => {
    expect(getRightWorkbenchScrollKey('preview', 'draft')).toBe('preview-draft');
    expect(getRightWorkbenchScrollKey('preview', 'pdf')).toBe('preview-pdf');
    expect(getRightWorkbenchScrollKey('check', 'pdf')).toBe('check');
  });

  it('opens preview for successful artifacts and prefers the student version', () => {
    const session = createSession([
      createArtifact('teacher', true),
      createArtifact('student', true),
    ]);

    expect(getSuccessfulPdfArtifacts(session).map((artifact) => artifact.variant)).toEqual([
      'student',
      'teacher',
    ]);
    expect(resolvePdfExportRoute(session)).toMatchObject({
      mode: 'preview',
      previewMode: 'pdf',
      selectedArtifact: { variant: 'student' },
      issueCount: 0,
    });
  });

  it('opens checks and selects a failed artifact for partial failure', () => {
    const session = createSession([
      createArtifact('student', true),
      createArtifact('teacher', false, '编译失败'),
    ]);

    expect(resolvePdfExportRoute(session)).toMatchObject({
      mode: 'check',
      previewMode: 'pdf',
      selectedArtifact: { variant: 'teacher', success: false },
      issueCount: 1,
    });
    expect(getPdfSessionIssueCount(session)).toBe(1);
  });

  it('keeps successful artifacts in preview when they only contain warnings', () => {
    const artifact = createArtifact('teacher', true, '字体回退提示', 'warning');
    const session = createSession([artifact]);

    expect(resolvePdfExportRoute(session)).toMatchObject({
      mode: 'preview',
      previewMode: 'pdf',
      selectedArtifact: { variant: 'teacher' },
      issueCount: 1,
    });
  });

  it('opens checks for total failure and excludes failed artifacts from preview choices', () => {
    const session = createSession([
      createArtifact('student', false, '学生版失败'),
      createArtifact('teacher', false, '教师版失败'),
    ]);

    expect(getSuccessfulPdfArtifacts(session)).toEqual([]);
    expect(resolvePdfExportRoute(session)).toMatchObject({
      mode: 'check',
      previewMode: 'draft',
      selectedArtifact: { variant: 'student', success: false },
      issueCount: 2,
    });
  });

  it('preserves PDF focus only when a successful export remains in PDF preview', () => {
    const previewRoute = resolvePdfExportRoute(
      createSession([createArtifact('student', true), createArtifact('teacher', true)]),
    );
    const checkRoute = resolvePdfExportRoute(
      createSession([createArtifact('student', true), createArtifact('teacher', false)]),
    );

    expect(shouldPreservePdfPreviewFocus(true, previewRoute)).toBe(true);
    expect(shouldPreservePdfPreviewFocus(false, previewRoute)).toBe(false);
    expect(shouldPreservePdfPreviewFocus(true, checkRoute)).toBe(false);
  });
});

describe('PDF export item presentation', () => {
  it('presents queued and active phases as pending work', () => {
    expect(getPdfExportItemPresentation({ variant: 'student', phase: 'queued' })).toMatchObject({
      tone: 'pending',
      label: '等待中',
      final: false,
    });
    expect(getPdfExportItemPresentation({ variant: 'student', phase: 'exporting' })).toMatchObject({
      tone: 'pending',
      label: '正在导出 LaTeX',
      final: false,
    });
    expect(getPdfExportItemPresentation({ variant: 'student', phase: 'compiling' })).toMatchObject({
      tone: 'pending',
      label: '正在编译',
      final: false,
    });
  });

  it('keeps complete progress in an explicit aggregation state until results arrive', () => {
    expect(
      getPdfExportItemPresentation({
        variant: 'student',
        phase: 'complete',
        completionSuccess: true,
      }),
    ).toEqual({ tone: 'success', label: '已完成，正在汇总结果', final: false });
    expect(
      getPdfExportItemPresentation({
        variant: 'student',
        phase: 'complete',
        completionSuccess: false,
      }),
    ).toEqual({ tone: 'error', label: '生成失败，正在汇总结果', final: false });
    expect(getPdfExportItemPresentation({ variant: 'student', phase: 'complete' })).toEqual({
      tone: 'pending',
      label: '正在汇总结果',
      final: false,
    });
  });

  it('uses final results before progress and distinguishes warnings from failures', () => {
    expect(
      getPdfExportItemPresentation({
        variant: 'student',
        phase: 'complete',
        completionSuccess: false,
        result: createArtifact('student', true),
      }),
    ).toMatchObject({ tone: 'success', label: '已生成 · 100 ms', final: true });
    expect(
      getPdfExportItemPresentation({
        variant: 'teacher',
        phase: 'complete',
        result: createArtifact('teacher', true, '字体提示', 'warning'),
      }),
    ).toMatchObject({ tone: 'warning', label: '已生成 · 1 个提示 · 100 ms', final: true });
    expect(
      getPdfExportItemPresentation({
        variant: 'teacher',
        phase: 'complete',
        result: createArtifact('teacher', false, '编译失败'),
      }),
    ).toMatchObject({ tone: 'error', label: '编译失败', final: true });
  });

  it('keeps a dual export busy until every final result is available', () => {
    const session: PdfExportSessionView = {
      jobId: 'pdf-job',
      items: [
        { variant: 'student', phase: 'complete', completionSuccess: true },
        { variant: 'teacher', phase: 'compiling' },
      ],
    };

    expect(isPdfExportSessionBusy(session)).toBe(true);
    expect(isPdfExportSessionFinal(session)).toBe(false);

    const finalSession = createSession([
      createArtifact('student', true),
      createArtifact('teacher', true),
    ]);
    expect(isPdfExportSessionBusy(finalSession)).toBe(false);
    expect(isPdfExportSessionFinal(finalSession)).toBe(true);
  });

  it('stores completion success from progress and clears old state for retries', () => {
    const session: PdfExportSessionView = {
      jobId: 'pdf-job',
      items: [
        {
          variant: 'student',
          phase: 'complete',
          completionSuccess: true,
          result: createArtifact('student', true),
        },
        { variant: 'teacher', phase: 'compiling' },
      ],
    };
    const progressed = applyPdfExportProgress(session, {
      jobId: 'pdf-job',
      variant: 'teacher',
      index: 1,
      total: 2,
      phase: 'complete',
      success: false,
    });

    expect(progressed?.items[1]).toMatchObject({
      phase: 'complete',
      completionSuccess: false,
    });

    const retried = queuePdfExportRetry(session, ['student']);
    expect(retried.items[0]).toEqual({ variant: 'student', phase: 'queued' });
    expect(retried.items[1]).toEqual(session.items[1]);
  });
});

function createSession(artifacts: ExportPdfArtifactResult[]): PdfExportSessionView {
  return {
    jobId: 'pdf-job',
    items: artifacts.map((result) => ({ variant: result.variant, phase: 'complete', result })),
  };
}

function createArtifact(
  variant: ExportPdfArtifactResult['variant'],
  success: boolean,
  diagnostic?: string,
  severity: 'error' | 'warning' = 'error',
): ExportPdfArtifactResult {
  return {
    variant,
    success,
    pdfDataBase64: success ? 'pdf-data' : undefined,
    diagnostics: diagnostic ? [{ severity, code: 'compile_diagnostic', message: diagnostic }] : [],
    durationMs: 100,
    log: '',
  };
}

function sequenceIdFactory(): CreateId {
  let index = 0;
  return (prefix: string) => `${prefix}-${++index}`;
}
