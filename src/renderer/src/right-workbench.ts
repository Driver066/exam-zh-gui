import {
  calculateTotalPointsMismatch,
  resolveQuestionNumbers,
  reviewQuestionScoreMarks,
  type ExamDocument,
  type ExamQuestion,
  type RichContentBlock,
} from '../../shared/document';
import { exportExamDocumentToTex } from '../../shared/export/exam-zh';
import type {
  ExportPdfArtifactResult,
  ExportPdfProgress,
  PdfExportProgressPhase,
  PdfExportVariant,
} from '../../shared/ipc/contracts';

export type RightWorkbenchMode = 'preview' | 'check';
export type RightWorkbenchScrollKey = 'preview-draft' | 'preview-pdf' | 'check';

export function getRightWorkbenchScrollKey(
  mode: RightWorkbenchMode,
  previewMode: 'draft' | 'pdf',
): RightWorkbenchScrollKey {
  if (mode === 'check') return 'check';
  return previewMode === 'pdf' ? 'preview-pdf' : 'preview-draft';
}

export interface PdfExportItemView {
  variant: PdfExportVariant;
  phase: 'queued' | PdfExportProgressPhase;
  completionSuccess?: boolean;
  result?: ExportPdfArtifactResult;
}

export interface PdfExportSessionView {
  jobId: string;
  items: PdfExportItemView[];
}

export type PdfExportItemTone = 'pending' | 'success' | 'warning' | 'error';

export interface PdfExportItemPresentation {
  tone: PdfExportItemTone;
  label: string;
  final: boolean;
}

export function getPdfExportItemPresentation(item: PdfExportItemView): PdfExportItemPresentation {
  if (item.result) {
    const provider = item.result.provider ? formatPdfProvider(item.result.provider) : null;

    if (!item.result.success) {
      const message = item.result.diagnostics[0]?.message ?? '生成失败';
      return {
        tone: 'error',
        label: provider ? `${provider} · ${message}` : message,
        final: true,
      };
    }

    const diagnosticCount = item.result.diagnostics.length;
    const providerText = provider ? ` · ${provider}` : '';
    const diagnosticText = diagnosticCount > 0 ? ` · ${diagnosticCount} 个提示` : '';
    return {
      tone: diagnosticCount > 0 ? 'warning' : 'success',
      label: `已生成${providerText}${diagnosticText} · ${formatPdfExportDuration(
        item.result.durationMs,
      )}`,
      final: true,
    };
  }

  if (item.phase === 'queued') {
    return { tone: 'pending', label: '等待中', final: false };
  }
  if (item.phase === 'exporting') {
    return { tone: 'pending', label: '正在导出 LaTeX', final: false };
  }
  if (item.phase === 'compiling') {
    return { tone: 'pending', label: '正在编译', final: false };
  }
  if (item.completionSuccess === true) {
    return { tone: 'success', label: '已完成，正在汇总结果', final: false };
  }
  if (item.completionSuccess === false) {
    return { tone: 'error', label: '生成失败，正在汇总结果', final: false };
  }
  return { tone: 'pending', label: '正在汇总结果', final: false };
}

export function isPdfExportSessionBusy(session: PdfExportSessionView | null): boolean {
  return Boolean(session?.items.some((item) => !item.result));
}

export function isPdfExportSessionFinal(session: PdfExportSessionView | null): boolean {
  return Boolean(session?.items.length && session.items.every((item) => item.result));
}

export function applyPdfExportProgress(
  session: PdfExportSessionView | null,
  progress: ExportPdfProgress,
): PdfExportSessionView | null {
  if (!session || session.jobId !== progress.jobId) return session;

  return {
    ...session,
    items: session.items.map((item) =>
      item.variant === progress.variant
        ? {
            ...item,
            phase: progress.phase,
            completionSuccess: progress.phase === 'complete' ? progress.success : undefined,
          }
        : item,
    ),
  };
}

export function queuePdfExportRetry(
  session: PdfExportSessionView,
  variants: PdfExportVariant[],
): PdfExportSessionView {
  return {
    ...session,
    items: session.items.map((item) =>
      variants.includes(item.variant) ? { variant: item.variant, phase: 'queued' } : item,
    ),
  };
}

export type DocumentCheckSeverity = 'error' | 'warning' | 'info';

export interface DocumentCheckItem {
  id: string;
  severity: DocumentCheckSeverity;
  code: string;
  title: string;
  detail: string;
  sectionId?: string;
  questionId?: string;
  sourcePath?: string;
}

export interface PdfExportRoute {
  mode: RightWorkbenchMode;
  previewMode: 'draft' | 'pdf';
  selectedArtifact: ExportPdfArtifactResult | null;
  issueCount: number;
}

export function shouldPreservePdfPreviewFocus(
  previewFocused: boolean,
  route: Pick<PdfExportRoute, 'mode' | 'previewMode'>,
): boolean {
  return previewFocused && route.mode === 'preview' && route.previewMode === 'pdf';
}

export function buildDocumentCheckItems(
  document: ExamDocument,
  options: { includeExportDiagnostics?: boolean } = {},
): DocumentCheckItem[] {
  const checks: DocumentCheckItem[] = [];
  const totalPointsMismatch = calculateTotalPointsMismatch(document);

  if (totalPointsMismatch) {
    checks.push({
      id: 'document-total-points-mismatch',
      severity: 'warning',
      code: 'total_points_mismatch',
      title: '标注总分与题目合计不一致',
      detail: `标注总分为 ${totalPointsMismatch.configured} 分，当前题目合计为 ${totalPointsMismatch.calculated} 分。`,
      sourcePath: 'metadata.totalPoints',
    });
  }

  const questionNumbers = resolveQuestionNumbers(document);
  for (const section of document.sections) {
    for (const [questionIndex, question] of section.questions.entries()) {
      const questionNumber = questionNumbers.get(question.id)?.number ?? questionIndex + 1;
      checks.push(...buildQuestionChecks(section.id, question, questionNumber));
    }
  }

  if (options.includeExportDiagnostics ?? true) {
    const exported = exportExamDocumentToTex(document, { includeAppMetadata: false });

    exported.diagnostics.forEach((diagnostic, index) => {
      const target = resolveDocumentCheckTarget(document, diagnostic.path);
      const alreadyCovered = Boolean(
        target.questionId &&
        checks.some(
          (check) => check.questionId === target.questionId && check.code === diagnostic.code,
        ),
      );
      if (alreadyCovered) return;
      checks.push({
        id: `export-${diagnostic.code}-${diagnostic.path ?? 'document'}-${index}`,
        severity: diagnostic.severity,
        code: `export_${diagnostic.code}`,
        title: diagnostic.severity === 'error' ? '导出前检查失败' : '导出兼容性提示',
        detail: diagnostic.message,
        sourcePath: diagnostic.path,
        ...target,
      });
    });
  }

  return dedupeDocumentChecks(checks);
}

export function getSuccessfulPdfArtifacts(
  session: PdfExportSessionView | null,
): ExportPdfArtifactResult[] {
  if (!session) return [];

  return session.items
    .map((item) => item.result)
    .filter((result): result is ExportPdfArtifactResult =>
      Boolean(result?.success && result.pdfDataBase64),
    )
    .sort(comparePdfVariants);
}

export function getPdfSessionIssueCount(session: PdfExportSessionView | null): number {
  if (!session) return 0;

  return session.items.reduce((count, item) => {
    if (!item.result) return count;
    const diagnostics = item.result.diagnostics.length;
    return count + diagnostics + (!item.result.success && diagnostics === 0 ? 1 : 0);
  }, 0);
}

export function resolvePdfExportRoute(session: PdfExportSessionView | null): PdfExportRoute {
  const completed = (session?.items ?? [])
    .map((item) => item.result)
    .filter((result): result is ExportPdfArtifactResult => Boolean(result));
  const failed = completed.filter((artifact) => !artifact.success);
  const successful = completed
    .filter((artifact) => artifact.success && artifact.pdfDataBase64)
    .sort(comparePdfVariants);

  if (failed.length > 0) {
    return {
      mode: 'check',
      previewMode: successful.length > 0 ? 'pdf' : 'draft',
      selectedArtifact: failed[0] ?? successful[0] ?? null,
      issueCount: getPdfSessionIssueCount(session),
    };
  }

  if (successful.length > 0) {
    return {
      mode: 'preview',
      previewMode: 'pdf',
      selectedArtifact: successful[0] ?? null,
      issueCount: getPdfSessionIssueCount(session),
    };
  }

  return {
    mode: 'preview',
    previewMode: 'draft',
    selectedArtifact: completed[0] ?? null,
    issueCount: getPdfSessionIssueCount(session),
  };
}

function buildQuestionChecks(
  sectionId: string,
  question: ExamQuestion,
  questionNumber: number,
): DocumentCheckItem[] {
  const checks: DocumentCheckItem[] = [];
  const sourcePath = `questions.${question.id}`;
  const base = {
    sectionId,
    questionId: question.id,
  };

  if (
    (question.type === 'singleChoice' || question.type === 'multipleChoice') &&
    (question.correctChoiceIds?.length ?? 0) === 0
  ) {
    checks.push({
      id: `question-${question.id}-answer-missing`,
      severity: 'warning',
      code: 'answer_missing',
      title: `第 ${questionNumber} 题未设答案`,
      detail: `${question.type === 'singleChoice' ? '单选题' : '多选题'}尚未选择正确答案。`,
      sourcePath: `${sourcePath}.correctChoiceIds`,
      ...base,
    });
  }

  if (question.type === 'blank') {
    const missingCount = (question.blanks ?? []).filter(
      (blank) => !hasRichContent(blank.answer ?? []),
    ).length;

    if (missingCount > 0) {
      checks.push({
        id: `question-${question.id}-answer-missing`,
        severity: 'warning',
        code: 'answer_missing',
        title: `第 ${questionNumber} 题未设完整答案`,
        detail: `还有 ${missingCount} 个空没有填写答案。`,
        sourcePath: `${sourcePath}.blanks`,
        ...base,
      });
    }
  }

  if (question.type === 'judgement' && question.judgement?.correctAnswer === undefined) {
    checks.push({
      id: `question-${question.id}-answer-missing`,
      severity: 'warning',
      code: 'answer_missing',
      title: `第 ${questionNumber} 题未设答案`,
      detail: '判断题尚未选择正确或错误。',
      sourcePath: `${sourcePath}.judgement.correctAnswer`,
      ...base,
    });
  }

  reviewQuestionScoreMarks(question).forEach((diagnostic, index) => {
    checks.push({
      id: `question-${question.id}-${diagnostic.code}-${index}`,
      severity: 'warning',
      code: diagnostic.code,
      title: `第 ${questionNumber} 题评分需要确认`,
      detail: diagnostic.message,
      sourcePath: `${sourcePath}.scoreMarks`,
      ...base,
    });
  });

  return checks;
}

function resolveDocumentCheckTarget(
  document: ExamDocument,
  sourcePath: string | undefined,
): Pick<DocumentCheckItem, 'sectionId' | 'questionId'> {
  if (!sourcePath) return {};

  const sectionQuestionMatch = sourcePath.match(/^sections\.([^.]+)\.questions\.([^.]+)/);
  if (sectionQuestionMatch) {
    const sectionToken = sectionQuestionMatch[1]!;
    const questionToken = sectionQuestionMatch[2]!;
    const section =
      document.sections.find((item) => item.id === sectionToken) ??
      document.sections[Number(sectionToken)];
    const question =
      section?.questions.find((item) => item.id === questionToken) ??
      section?.questions[Number(questionToken)];
    return section && question ? { sectionId: section.id, questionId: question.id } : {};
  }

  const questionMatch = sourcePath.match(/^questions\.([^.]+)/);
  if (questionMatch) {
    return findQuestionTarget(document, questionMatch[1]!);
  }

  const blankMatch = sourcePath.match(/^blank\.([^.]+)/);
  if (blankMatch) {
    const blankId = blankMatch[1]!;
    for (const section of document.sections) {
      const question = section.questions.find((item) =>
        item.blanks?.some((blank) => blank.id === blankId),
      );
      if (question) return { sectionId: section.id, questionId: question.id };
    }
  }

  const sectionMatch = sourcePath.match(/^sections\.([^.]+)/);
  if (sectionMatch) {
    const token = sectionMatch[1]!;
    const section =
      document.sections.find((item) => item.id === token) ?? document.sections[Number(token)];
    return section ? { sectionId: section.id } : {};
  }

  return {};
}

function findQuestionTarget(
  document: ExamDocument,
  questionId: string,
): Pick<DocumentCheckItem, 'sectionId' | 'questionId'> {
  for (const section of document.sections) {
    if (section.questions.some((question) => question.id === questionId)) {
      return { sectionId: section.id, questionId };
    }
  }
  return {};
}

function dedupeDocumentChecks(checks: DocumentCheckItem[]): DocumentCheckItem[] {
  const seen = new Set<string>();

  return checks.filter((check) => {
    const key = [check.code, check.detail, check.sourcePath ?? '', check.questionId ?? ''].join(
      '|',
    );
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function comparePdfVariants(left: ExportPdfArtifactResult, right: ExportPdfArtifactResult): number {
  const order: PdfExportVariant[] = ['student', 'teacher'];
  return order.indexOf(left.variant) - order.indexOf(right.variant);
}

function formatPdfProvider(provider: NonNullable<ExportPdfArtifactResult['provider']>): string {
  if (provider === 'latexmk-xelatex') return 'latexmk + XeLaTeX';
  if (provider === 'xelatex') return 'XeLaTeX';
  return 'Tectonic';
}

function formatPdfExportDuration(durationMs: number): string {
  return durationMs >= 1000 ? `${(durationMs / 1000).toFixed(1)} 秒` : `${durationMs} ms`;
}

function hasRichContent(blocks: RichContentBlock[]): boolean {
  return blocks.some((block) => {
    switch (block.type) {
      case 'paragraph':
        return block.children.some((child) => {
          switch (child.type) {
            case 'text':
              return child.text.trim().length > 0;
            case 'inlineMath':
            case 'rawLatex':
              return child.latex.trim().length > 0;
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
        return hasRichContent(block.text);
      case 'image':
        return block.assetId.trim().length > 0;
      case 'figureGroup':
        return block.items.length > 0;
    }
  });
}
