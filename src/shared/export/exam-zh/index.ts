import {
  validateExamZhOptions,
  type ExamZhOptionNamespace,
  type ExamZhOptionTarget,
} from '../../exam-zh/options-registry';
import {
  buildEffectiveFillinOptions,
  buildPageFooterContent,
  collectAnnotationReferenceIds,
  collectScoreReferenceIds,
  CURRENT_SCHEMA_VERSION,
  formatQuestionLabel,
  formatSectionSummary,
  formatJudgementAnswer,
  getChoiceDisplayLabel,
  getSectionStartIndex,
  resolveJudgementSetup,
  safeParseExamDocument,
  type ExamDocument,
} from '../../document';
import type {
  Asset,
  BlankSlot,
  ExamQuestion,
  ExamSection,
  ExamZhOptionBag,
  FigureGroupBlock,
  ImageBlock,
  InlineContent,
  ListBlock,
  RawLatexBlock,
  RichContentBlock,
  ScoreMark,
  ScoreMode,
  SolutionAnnotation,
  SubQuestion,
  TextFigureBlock,
} from '../../document/model';
import {
  escapeLatexComment,
  escapeLatexText,
  formatDisplayOptionBag,
  formatDocumentClassOptions,
  formatOptionalArgument,
  isEmptyOptionBag,
  mergeOptionBags,
} from './latex';
import type {
  ExportExamZhOptions,
  ExportExamZhResult,
  TexExportDiagnostic,
  TexSourceMapEntry,
} from './types';
export type {
  ExportExamZhOptions,
  ExportExamZhResult,
  TexExportDiagnostic,
  TexSourceMapEntry,
} from './types';
export { hasTexExportErrors } from './types';

interface ExportContext {
  diagnostics: TexExportDiagnostic[];
  diagnosticKeys: Set<string>;
  sourceMap: TexSourceMapEntry[];
  assets: Map<string, Asset>;
  compilerTarget: NonNullable<ExportExamZhOptions['compilerTarget']>;
  showAnswers: boolean;
  examSetup: ExamZhOptionBag;
  choiceDefaults: ExamZhOptionBag;
  parenDefaults: ExamZhOptionBag;
  fillinDefaults: ExamZhOptionBag;
  judgementAnswerColor: 'black' | 'red';
}

interface TeacherContentOwner {
  scoreMarks?: ScoreMark[];
  solutionAnnotations?: SolutionAnnotation[];
}

export function exportExamDocumentToTex(
  document: ExamDocument,
  options: ExportExamZhOptions = {},
): ExportExamZhResult {
  const validation = safeParseExamDocument(document);

  if (!validation.success) {
    return {
      tex: '',
      diagnostics: [
        {
          severity: 'error',
          code: 'invalid_document',
          message: validation.error.issues.map((issue) => issue.message).join('; '),
        },
      ],
      sourceMap: [],
    };
  }

  const examSetup = buildExamSetup(validation.data);
  const ctx: ExportContext = {
    diagnostics: [],
    diagnosticKeys: new Set(),
    sourceMap: [],
    assets: new Map(validation.data.assets.map((asset) => [asset.id, asset])),
    compilerTarget: options.compilerTarget ?? 'standard',
    showAnswers: validation.data.setup.answerMode === 'teacher',
    examSetup,
    choiceDefaults: extractNamespaceOptions(examSetup, 'choices'),
    parenDefaults: extractNamespaceOptions(examSetup, 'paren'),
    fillinDefaults: buildEffectiveFillinOptions(validation.data),
    judgementAnswerColor: resolveJudgementSetup(validation.data, {}).answerColor,
  };
  const lines: string[] = [];
  const includeAppMetadata = options.includeAppMetadata ?? true;
  const generatedAt = options.generatedAt ?? new Date().toISOString();

  if (includeAppMetadata) {
    lines.push('% !TeX program = xelatex');
    lines.push('% !TeX encoding = UTF-8');
    lines.push('% Created with exam-zh GUI');
    lines.push('% Project: https://github.com/Driver066/exam-zh-gui');
    lines.push('% If this tool helps you, a GitHub star is appreciated.');
    lines.push(`% exam-zh-gui-schema: ${CURRENT_SCHEMA_VERSION}`);
    lines.push(`% exam-zh-gui-document-id: ${escapeLatexComment(validation.data.documentId)}`);
    lines.push(`% exam-zh-gui-generated-at: ${escapeLatexComment(generatedAt)}`);

    if (options.sourceFilePath) {
      lines.push(`% exam-zh-gui-source: ${escapeLatexComment(options.sourceFilePath)}`);
    }

    lines.push('');
  }

  appendDocumentPreamble(lines, validation.data, ctx);
  appendDocumentBody(lines, validation.data, ctx);

  return {
    tex: normalizeTex(lines),
    diagnostics: ctx.diagnostics,
    sourceMap: ctx.sourceMap,
  };
}

function appendDocumentPreamble(lines: string[], document: ExamDocument, ctx: ExportContext): void {
  addOptionDiagnostics(
    ctx,
    'documentClass',
    'documentClass',
    document.examZh?.documentClass,
    'examZh.documentClass',
  );

  const documentClassOptions = formatDocumentClassOptions(
    buildDocumentClassOptions(document, ctx.compilerTarget),
  );
  lines.push(`\\documentclass${documentClassOptions}{exam-zh}`);
  appendCompilerCompatibilityPreamble(lines, ctx.compilerTarget);

  const examSetup = ctx.examSetup;
  addOptionDiagnostics(ctx, 'examsetup', 'examsetup', examSetup, 'setup.examZhOptions');

  if (!isEmptyOptionBag(examSetup)) {
    lines.push('\\examsetup{');
    lines.push(formatDisplayOptionBag(examSetup));
    lines.push('}');
  }

  if (document.examZh?.rawPreamble?.length) {
    lines.push(...document.examZh.rawPreamble);
  }

  lines.push(`\\title{${escapeLatexText(document.metadata.title)}}`);
  lines.push(`\\subject{${escapeLatexText(document.metadata.subject)}}`);
}

function buildAnswerModeExamSetup(document: ExamDocument): ExamZhOptionBag {
  const showAnswers = document.setup.answerMode === 'teacher';

  return {
    'fillin/show-answer': showAnswers,
    'paren/show-answer': showAnswers,
    'solution/show-solution': showAnswers ? 'show-stay' : 'hide',
  };
}

function buildExamSetup(document: ExamDocument): ExamZhOptionBag {
  const semanticExamSetup = mergeOptionBags(
    mergeOptionBags(buildChoiceExamSetup(document), buildFillinExamSetup(document)),
    buildPageExamSetup(document),
  );
  const explicitExamSetup = document.setup.examZhOptions;

  return mergeOptionBags(
    mergeOptionBags(semanticExamSetup, explicitExamSetup),
    buildAnswerModeExamSetup(document),
  );
}

function buildPageExamSetup(document: ExamDocument): ExamZhOptionBag {
  const page = document.setup.page;
  const semanticOptions: ExamZhOptionBag = {};

  if (page?.size === 'a3paper') {
    semanticOptions['page/size'] = 'a3paper';

    if (page.a3FooterType === 'common') {
      semanticOptions['page/foot-type'] = 'common';
    }

    if (page.showColumnLine === true) {
      semanticOptions['page/show-columnline'] = true;
    }
  }

  if (page?.showFooter === false) {
    semanticOptions['page/show-foot'] = false;
  } else {
    semanticOptions['page/foot-content'] = buildPageFooterContent(
      page,
      document.metadata.subject,
      escapeLatexText,
    )!;
  }

  return mergeOptionBags(semanticOptions, scopeExamSetupOptions('page', page?.examZhOptions));
}

function buildChoiceExamSetup(document: ExamDocument): ExamZhOptionBag {
  const maxColumns = document.setup.choices?.maxColumns;
  const semanticOptions: ExamZhOptionBag = {};

  if (maxColumns !== undefined) {
    semanticOptions['choices/max-columns'] = maxColumns;
  }

  return mergeOptionBags(
    semanticOptions,
    scopeExamSetupOptions('choices', document.setup.choices?.examZhOptions),
  );
}

function buildFillinExamSetup(document: ExamDocument): ExamZhOptionBag {
  const semanticOptions: ExamZhOptionBag = {};
  const fillin = document.setup.fillin;

  if (fillin?.type !== undefined) {
    semanticOptions['fillin/type'] = fillin.type;
  }

  if (fillin?.width !== undefined) {
    semanticOptions['fillin/width'] = fillin.width;
  }

  if (document.setup.answerMode === 'teacher' && fillin?.answerColor === 'red') {
    semanticOptions['fillin/text-color'] = 'red';
  }

  return mergeOptionBags(semanticOptions, scopeExamSetupOptions('fillin', fillin?.examZhOptions));
}

function scopeExamSetupOptions(
  namespace: string,
  options: ExamZhOptionBag | undefined,
): ExamZhOptionBag {
  if (!options) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(options).map(([key, value]) => [
      key.startsWith(`${namespace}/`) ? key : `${namespace}/${key}`,
      value,
    ]),
  );
}

function extractNamespaceOptions(examSetup: ExamZhOptionBag, namespace: string): ExamZhOptionBag {
  const defaults: ExamZhOptionBag = {};

  for (const [key, value] of Object.entries(examSetup)) {
    if (key.startsWith(`${namespace}/`)) {
      defaults[key.slice(namespace.length + 1)] = value;
    } else if (key === namespace && isOptionBagValue(value)) {
      Object.assign(defaults, value);
    }
  }

  return defaults;
}

function isOptionBagValue(value: ExamZhOptionBag[string]): value is ExamZhOptionBag {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function buildDocumentClassOptions(
  document: ExamDocument,
  compilerTarget: ExportContext['compilerTarget'],
): ExamZhOptionBag {
  const options = document.examZh?.documentClass ?? {};

  if (compilerTarget !== 'tectonic' || Object.hasOwn(options, 'fontset')) {
    return options;
  }

  return {
    fontset: 'fandol',
    ...options,
  };
}

function appendCompilerCompatibilityPreamble(
  lines: string[],
  compilerTarget: ExportContext['compilerTarget'],
): void {
  if (compilerTarget !== 'tectonic') {
    return;
  }

  lines.push('\\ExplSyntaxOn');
  lines.push('\\cs_if_exist:NF \\IfBlankTF { \\cs_new_eq:NN \\IfBlankTF \\tl_if_blank:nTF }');
  lines.push('\\ExplSyntaxOff');
}

function appendDocumentBody(lines: string[], document: ExamDocument, ctx: ExportContext): void {
  lines.push('\\begin{document}');

  const informationPlacement = document.frontMatter.informationPlacement ?? 'top';
  const showTitleBlock = document.frontMatter.showTitleBlock ?? true;
  const effectiveInformationPlacement = showTitleBlock ? informationPlacement : 'top';

  if (
    document.frontMatter.informationFields.length > 0 &&
    effectiveInformationPlacement === 'top'
  ) {
    lines.push(renderInformation(document.frontMatter));
  }

  if (document.frontMatter.secret) {
    lines.push('\\secret');
  }

  if (showTitleBlock) {
    lines.push('\\maketitle');
  }

  if (
    document.frontMatter.informationFields.length > 0 &&
    effectiveInformationPlacement === 'belowSubject'
  ) {
    lines.push(renderInformation(document.frontMatter));
  }

  if (document.frontMatter.warning?.trim()) {
    lines.push(
      renderWarning(document.frontMatter.warning.trim(), document.frontMatter.warningSpacing),
    );
  }

  if (document.frontMatter.preface?.length) {
    lines.push(renderBlocks(document.frontMatter.preface, ctx));
  }

  if (document.frontMatter.notices.length > 0) {
    lines.push('\\begin{notice}');
    for (const notice of document.frontMatter.notices) {
      lines.push(`\\item ${renderBlock(notice, ctx)}`);
    }
    lines.push('\\end{notice}');
  }

  let questionNumber = 0;

  for (const [sectionIndex, section] of document.sections.entries()) {
    questionNumber = appendSection(lines, section, sectionIndex, questionNumber, ctx);
  }

  lines.push('\\end{document}');
}

function renderWarning(
  warning: string,
  spacing: ExamDocument['frontMatter']['warningSpacing'],
): string {
  const command = `\\noindent\\warning{${escapeLatexText(warning)}}`;
  return spacing ? wrapWithVerticalSpacing(command, spacing) : command;
}

function renderInformation(frontMatter: ExamDocument['frontMatter']): string {
  const renderedFields = frontMatter.informationFields.map((field) => {
    const label = escapeLatexText(field.label);

    if (field.kind === 'text') {
      return label;
    }

    if (field.kind === 'squares') {
      return `${label}\\examsquare{${field.length}}`;
    }

    return `${label}\\underline{\\hspace{${field.width ?? '6em'}}}`;
  });

  const separator = renderInformationSeparator(frontMatter.informationSeparator);

  if (frontMatter.informationSpacing) {
    const command = `\\noindent\\makebox[\\linewidth][c]{${renderedFields.join(separator)}}`;
    return wrapWithVerticalSpacing(command, frontMatter.informationSpacing);
  }

  const optionalSeparator = frontMatter.informationSeparator
    ? `[${frontMatter.informationSeparator.mode === 'custom' ? `{${separator}}` : separator}]`
    : '';
  return `\\information${optionalSeparator}{${renderedFields.join(',')}}`;
}

function renderInformationSeparator(
  separator: ExamDocument['frontMatter']['informationSeparator'],
): string {
  if (!separator) return '\\quad';

  switch (separator.mode) {
    case 'compactSpace':
      return '\\enspace';
    case 'wideSpace':
      return '\\qquad';
    case 'comma':
      return '\\quad ，\\quad';
    case 'middleDot':
      return '\\quad ·\\quad';
    case 'verticalBar':
      return '\\quad\\textbar\\quad';
    case 'none':
      return '';
    case 'custom':
      return `\\quad ${escapeLatexText(separator.text ?? '')}\\quad`;
  }
}

function wrapWithVerticalSpacing(
  command: string,
  spacing: NonNullable<ExamDocument['frontMatter']['informationSpacing']>,
): string {
  return [`\\par\\addvspace{${spacing.top}}`, command, `\\par\\addvspace{${spacing.bottom}}`].join(
    '\n',
  );
}

function appendSection(
  lines: string[],
  section: ExamSection,
  sectionIndex: number,
  questionNumber: number,
  ctx: ExportContext,
): number {
  addSourceMapEntry(
    lines,
    ctx,
    `sections.${sectionIndex}`,
    `第 ${sectionIndex + 1} 节：${section.title}`,
  );
  const sectionSummary = formatSectionSummary(section);
  const sectionTitle = sectionSummary ? `${section.title}：${sectionSummary}` : section.title;
  lines.push(`\\section{${escapeLatexText(sectionTitle)}}`);

  const numberingNamespaces = new Set<ExamZhOptionNamespace>();

  for (const question of section.questions) {
    if (question.type === 'rawLatex' && question.rawLatex) {
      continue;
    }

    numberingNamespaces.add(
      (question.environment ?? (question.type === 'problem' ? 'problem' : 'question')) === 'problem'
        ? 'problem'
        : 'question',
    );
  }

  for (const namespace of numberingNamespaces) {
    addOptionDiagnostics(
      ctx,
      namespace,
      'environment',
      section.numbering?.examZhOptions,
      `sections.${section.id}.numbering.examZhOptions`,
    );
  }

  let sectionNumberingPending = getSectionStartIndex(section) !== undefined;

  for (const [questionIndex, question] of section.questions.entries()) {
    questionNumber += 1;
    const isStructuredQuestion = question.type !== 'rawLatex' || !question.rawLatex;
    appendQuestion(
      lines,
      question,
      section,
      sectionIndex,
      questionIndex,
      questionNumber,
      sectionNumberingPending && isStructuredQuestion,
      ctx,
    );

    if (isStructuredQuestion) {
      sectionNumberingPending = false;
    }
  }

  return questionNumber;
}

function appendQuestion(
  lines: string[],
  question: ExamQuestion,
  section: ExamSection,
  sectionIndex: number,
  questionIndex: number,
  questionNumber: number,
  applySectionStart: boolean,
  ctx: ExportContext,
): void {
  if (question.type === 'rawLatex' && question.rawLatex) {
    addSourceMapEntry(
      lines,
      ctx,
      `sections.${sectionIndex}.questions.${questionIndex}`,
      `第 ${questionNumber} 题：原始 LaTeX`,
    );
    lines.push(question.rawLatex);
    return;
  }

  const environment =
    question.environment ?? (question.type === 'problem' ? 'problem' : 'question');
  const environmentOptions = buildQuestionEnvironmentOptions(question, section, applySectionStart);

  addOptionDiagnostics(
    ctx,
    environment === 'problem' ? 'problem' : 'question',
    'environment',
    question.examZhOptions,
    `sections.${section.id}.questions.${question.id}.examZhOptions`,
  );

  const questionPath = `sections.${sectionIndex}.questions.${questionIndex}`;
  addSourceMapEntry(
    lines,
    ctx,
    questionPath,
    `第 ${questionNumber} 题：${getQuestionTypeLabel(question.type)}`,
  );
  lines.push(`\\begin{${environment}}${renderEnvironmentOptions(environmentOptions)}`);
  const contentLines = renderQuestionContent(question, ctx);

  if (contentLines.length > 0) {
    lines.push(...contentLines);
  }

  lines.push(`\\end{${environment}}`);

  if (ctx.showAnswers && questionHasTeacherContent(question)) {
    appendSolution(lines, question, questionPath, questionNumber, ctx);
  }
}

function buildQuestionEnvironmentOptions(
  question: ExamQuestion,
  section: ExamSection,
  applySectionStart: boolean,
): ExamZhOptionBag {
  const options: ExamZhOptionBag = { ...(section.numbering?.examZhOptions ?? {}) };
  delete options.index;

  if (applySectionStart) {
    const sectionStart = getSectionStartIndex(section);

    if (sectionStart !== undefined) {
      options.index = sectionStart;
    }
  }

  if (question.index !== undefined) {
    options.index = question.index;
  }

  const points = question.points ?? section.defaultPoints;

  if (points !== undefined) {
    options.points = points;
  }

  return mergeOptionBags(options, question.examZhOptions);
}

function renderQuestionContent(question: ExamQuestion, ctx: ExportContext): string[] {
  const lines: string[] = [];
  const stem = renderBlocks(question.stem, ctx, question).trim();

  if (stem) {
    lines.push(stem);
  }

  if (question.type === 'singleChoice' || question.type === 'multipleChoice') {
    if (!blocksContainChoiceParenRef(question.stem)) {
      if (lines.length > 0) {
        lines[lines.length - 1] = `${lines[lines.length - 1]} ${renderParen(question, ctx)}`;
      } else {
        lines.push(renderParen(question, ctx));
      }
    }

    if (question.choices?.length) {
      lines.push(renderChoices(question, ctx));
    } else {
      addDiagnostic(ctx, {
        severity: 'warning',
        code: 'choice_question_without_choices',
        message: `选择题“${question.id}”没有选项。`,
        path: `questions.${question.id}.choices`,
      });
    }
  }

  if (question.type === 'blank' && question.blanks?.length) {
    if (!blocksContainFillin(question.stem) && !blocksContainBlankRef(question.stem)) {
      addDiagnostic(ctx, {
        severity: 'warning',
        code: 'blank_appended_after_stem',
        message: `填空题“${question.id}”的题干中没有明确填空占位，已按顺序把填空追加到题干后。`,
        path: `questions.${question.id}.blanks`,
      });
      lines.push(question.blanks.map((blank) => renderBlank(blank, ctx)).join(' '));
    }
  }

  if (question.type === 'judgement') {
    const placement = question.judgement?.placement ?? 'lineEnd';
    const hasJudgementRef = blocksContainJudgementRef(question.stem);

    if (placement === 'lineEnd') {
      appendCommandToLastLine(lines, renderJudgement(question, ctx, 'lineEnd'));
    } else if (!hasJudgementRef) {
      addDiagnostic(ctx, {
        severity: 'warning',
        code: 'judgement_appended_after_stem',
        message: `判断题“${question.id}”没有明确判断括号占位，已追加到题干后。`,
        path: `questions.${question.id}.stem`,
      });
      appendCommandToLastLine(lines, renderJudgement(question, ctx, 'inline'));
    }
  }

  if (question.subQuestionGroup) {
    const subQuestionGroup = renderSubQuestionGroup(question.subQuestionGroup, ctx, question.id);

    if (subQuestionGroup) {
      lines.push(subQuestionGroup);
    }
  }

  return lines;
}

function appendCommandToLastLine(lines: string[], command: string): void {
  if (lines.length > 0) {
    lines[lines.length - 1] = `${lines[lines.length - 1]} ${command}`;
  } else {
    lines.push(command);
  }
}

function renderJudgement(
  question: ExamQuestion,
  ctx: ExportContext,
  placement: 'lineEnd' | 'inline',
): string {
  const answer = ctx.showAnswers ? renderJudgementAnswer(question) : '';

  if (placement === 'inline') {
    const options: ExamZhOptionBag = {
      type: 'paren',
      'no-answer-type': 'none',
    };
    const effectiveFillinColor = getStringOption(ctx.fillinDefaults['text-color'], 'black');

    if (effectiveFillinColor !== ctx.judgementAnswerColor) {
      options['text-color'] = ctx.judgementAnswerColor;
    }

    return `\\fillin[${formatOptionalArgument(options)}][${answer}]`;
  }

  const command = answer ? `\\paren[${answer}]` : '\\paren';
  const localOptions: ExamZhOptionBag = {};
  const effectiveParenType = getStringOption(ctx.parenDefaults.type, 'hfill');
  const effectiveParenColor = getStringOption(ctx.parenDefaults['text-color'], 'black');
  const effectiveShowParen = ctx.parenDefaults['show-paren'];

  if (effectiveParenType !== 'hfill') {
    localOptions['paren/type'] = 'hfill';
  }
  if (effectiveParenColor !== ctx.judgementAnswerColor) {
    localOptions['paren/text-color'] = ctx.judgementAnswerColor;
  }
  if (effectiveShowParen === false) {
    localOptions['paren/show-paren'] = true;
  }

  return isEmptyOptionBag(localOptions)
    ? command
    : `{\\examsetup{${formatOptionalArgument(localOptions)}}${command}}`;
}

function renderJudgementAnswer(question: ExamQuestion): string {
  return formatJudgementAnswer(
    {
      correctAnswer: question.judgement?.correctAnswer,
      answerStyle: question.judgement?.answerStyle ?? 'text',
    },
    'latex',
  );
}

function getStringOption(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function renderParen(
  question: ExamQuestion,
  ctx: ExportContext,
  placement: 'auto' | 'inline' = 'auto',
): string {
  const answer = ctx.showAnswers
    ? getOrderedChoiceAnswerLabels(question, ctx.choiceDefaults).join('')
    : '';
  const command = answer ? `\\paren[${answer}]` : '\\paren';

  return placement === 'inline' ? `{\\examsetup{paren/type = none}${command}}` : command;
}

function getOrderedChoiceAnswerLabels(
  question: ExamQuestion,
  choiceDefaults: ExamZhOptionBag,
): string[] {
  const answerIds = question.correctChoiceIds ?? [];

  if (!question.choices?.length) {
    return answerIds;
  }

  const selectedKeys = new Set(answerIds);
  const renderExplicitLabels = shouldRenderExplicitChoiceLabels(question);
  const effectiveOptions = mergeOptionBags(
    choiceDefaults,
    buildChoicesEnvironmentOptions(question),
  );
  const orderedKeys = question.choices
    .map((choice, index) => ({ choice, index }))
    .filter(({ choice }) => selectedKeys.has(choice.id))
    .map(
      ({ choice, index }) =>
        (!renderExplicitLabels
          ? resolveChoiceCounterAnswerLabel(effectiveOptions, index)
          : undefined) ?? getChoiceDisplayLabel(choice),
    );
  const knownChoiceIds = new Set(question.choices.map((choice) => choice.id));
  const unknownKeys = answerIds.filter((choiceId) => !knownChoiceIds.has(choiceId));

  return [...orderedKeys, ...unknownKeys];
}

function renderChoices(question: ExamQuestion, ctx: ExportContext): string {
  const renderExplicitLabels = shouldRenderExplicitChoiceLabels(question);
  const environmentOptions = renderExplicitLabels
    ? mergeOptionBags(buildChoicesEnvironmentOptions(question, ctx.choiceDefaults), {
        label: '',
        'label-sep': '0pt',
      })
    : buildChoicesEnvironmentOptions(question, ctx.choiceDefaults);
  addOptionDiagnostics(
    ctx,
    'choices',
    'environment',
    environmentOptions,
    `questions.${question.id}.choicesSetup`,
  );

  const optionalArgument = isEmptyOptionBag(environmentOptions)
    ? ''
    : `[${formatOptionalArgument(environmentOptions)}]`;
  const lines = [`\\begin{choices}${optionalArgument}`];

  for (const choice of question.choices ?? []) {
    const labelPrefix = renderExplicitLabels
      ? `${escapeLatexText(getChoiceDisplayLabel(choice))}.\\enspace `
      : '';
    lines.push(`\\item ${labelPrefix}${renderBlocks(choice.content, ctx, question).trim()}`);
  }

  lines.push('\\end{choices}');
  return lines.join('\n');
}

function buildChoicesEnvironmentOptions(
  question: ExamQuestion,
  choiceDefaults?: ExamZhOptionBag,
): ExamZhOptionBag {
  const maxColumns = question.choicesSetup?.maxColumns;
  const explicitOptions = question.choicesSetup?.examZhOptions;
  const inheritedColumns = choiceDefaults?.columns;
  const inheritedFixedColumns =
    typeof inheritedColumns === 'number' &&
    Number.isFinite(inheritedColumns) &&
    inheritedColumns > 0
      ? inheritedColumns
      : undefined;
  const inheritedOptions: ExamZhOptionBag = {};
  const semanticOptions: ExamZhOptionBag = {};

  // exam-zh resets the global columns value while measuring each choices
  // environment, then reapplies only its local optional argument.
  if (inheritedFixedColumns !== undefined && maxColumns === undefined) {
    inheritedOptions.columns = inheritedFixedColumns;
  }

  if (maxColumns !== undefined) {
    semanticOptions['max-columns'] = maxColumns;
  }

  return mergeOptionBags(inheritedOptions, mergeOptionBags(semanticOptions, explicitOptions));
}

function shouldRenderExplicitChoiceLabels(question: ExamQuestion): boolean {
  if (Object.hasOwn(question.choicesSetup?.examZhOptions ?? {}, 'label')) {
    return false;
  }

  return (question.choices ?? []).some(
    (choice, index) => getChoiceDisplayLabel(choice) !== getDefaultChoiceLabel(index),
  );
}

function getDefaultChoiceLabel(index: number): string {
  return index >= 0 && index < 26 ? String.fromCharCode(65 + index) : String(index + 1);
}

function resolveChoiceCounterAnswerLabel(
  effectiveOptions: ExamZhOptionBag,
  choiceIndex: number,
): string | undefined {
  const label = effectiveOptions.label ?? '\\Alph*.';

  if (typeof label !== 'string') {
    return undefined;
  }

  const counter = getChoiceCounterStart(effectiveOptions) + choiceIndex;
  const presets: Array<[string, string]> = [
    ['\\arabic*', '\\arabic*.'],
    ['\\alph*', '\\alph*.'],
    ['\\Alph*', '\\Alph*.'],
    ['\\roman*', '\\roman*.'],
    ['\\Roman*', '\\Roman*.'],
    ['\\circlednumber*', '\\circlednumber*'],
  ];
  const preset = presets.find(([token]) => label.includes(token));

  if (!preset) {
    return undefined;
  }

  return formatQuestionLabel(counter, preset[1]).replace(/\.$/u, '');
}

function getChoiceCounterStart(effectiveOptions: ExamZhOptionBag): number {
  const value = effectiveOptions.index;

  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string' && /^\d+$/u.test(value.trim())) {
    const parsed = Number(value);
    return parsed > 0 ? parsed : 1;
  }

  return 1;
}

function renderBlank(blank: BlankSlot, ctx: ExportContext): string {
  const options = buildBlankOptions(blank);
  const effectiveOptions = mergeOptionBags(ctx.fillinDefaults, options);
  const showAnswers =
    typeof effectiveOptions['show-answer'] === 'boolean'
      ? effectiveOptions['show-answer']
      : ctx.showAnswers;
  const answer = showAnswers ? renderBlankAnswer(blank, ctx) : undefined;
  const effectiveType = typeof effectiveOptions.type === 'string' ? effectiveOptions.type : 'line';
  let command = blank.command ?? 'fillin';

  if (
    command === 'fillin*' &&
    showAnswers &&
    (effectiveType === 'circle' || effectiveType === 'rectangle')
  ) {
    command = 'fillin';
    addDiagnosticOnce(ctx, `fillin-breakable-type:${blank.id}`, {
      severity: 'warning',
      code: 'fillin_breakable_type_fallback',
      message: `填空“${blank.id}”显示答案时不支持可换行的${effectiveType === 'circle' ? '圆框' : '方框'}样式，已改用标准填空命令导出。`,
      path: `blank.${blank.id}.command`,
    });
  }

  if (isEmptyOptionBag(options)) {
    return answer !== undefined ? `\\${command}[${answer}]` : `\\${command}`;
  }

  return `\\${command}[${formatOptionalArgument(options)}][${answer ?? ''}]`;
}

function renderBlankAnswer(blank: BlankSlot, ctx: ExportContext): string | undefined {
  const blocks = blank.answer;

  if (!blocks) {
    return undefined;
  }

  return blocks
    .map((block) => renderBlankAnswerBlock(block, blank, ctx))
    .join(' ')
    .trim();
}

function renderBlankAnswerBlock(
  block: RichContentBlock,
  blank: BlankSlot,
  ctx: ExportContext,
): string {
  switch (block.type) {
    case 'paragraph':
      return block.children.map((child) => renderInlineContent(child, ctx)).join('');
    case 'displayMath':
      addDiagnostic(ctx, {
        severity: 'warning',
        code: 'blank_answer_display_math_downgraded',
        message: '填空答案中的行间公式已按行内公式导出。',
        path: `blank.${blank.id}.answer`,
      });
      return `$${block.latex}$`;
    case 'rawLatex':
      return block.latex;
    case 'list':
      return block.items
        .map((item) =>
          item.map((itemBlock) => renderBlankAnswerBlock(itemBlock, blank, ctx)).join(' '),
        )
        .join('; ');
    case 'image':
    case 'figureGroup':
    case 'textFigure':
      addDiagnostic(ctx, {
        severity: 'warning',
        code: 'blank_answer_unsupported_block',
        message: '填空答案暂不支持图片或图文块导出，已省略该内容。',
        path: `blank.${blank.id}.answer`,
      });
      return '';
  }
}

function buildBlankOptions(blank: BlankSlot): ExamZhOptionBag {
  const options: ExamZhOptionBag = {};

  if (blank.width) {
    options.width = blank.width;
  }

  if (blank.type) {
    options.type = blank.type;
  }

  if (blank.noAnswerType) {
    options['no-answer-type'] = blank.noAnswerType;
  }

  if (blank.widthType) {
    options['width-type'] = blank.widthType;
  }

  if (blank.parenType) {
    options['paren-type'] = blank.parenType;
  }

  return mergeOptionBags(options, blank.examZhOptions);
}

function renderSubQuestionGroup(
  group: NonNullable<ExamQuestion['subQuestionGroup']>,
  ctx: ExportContext,
  questionId: string,
): string {
  if (group.items.length === 0 && group.exportAs !== 'rawLatex') {
    return '';
  }

  if (group.exportAs === 'rawLatex') {
    return group.rawLatex ?? '';
  }

  const listKind = group.listKind ?? 'enumerate';
  const environment = group.exportAs === 'examZhList' ? listKind : 'enumerate';

  if (group.exportAs === 'examZhList') {
    addDiagnostic(ctx, {
      severity: 'warning',
      code: 'exam_zh_list_passthrough',
      message: `题目“${questionId}”的小题组使用 examZhList，当前会按指定环境名透传导出。`,
      path: `questions.${questionId}.subQuestionGroup`,
    });
  }

  const lines = [`\\begin{${environment}}`];

  for (const item of group.items) {
    lines.push(`\\item ${renderSubQuestion(item, ctx)}`);
  }

  lines.push(`\\end{${environment}}`);
  return lines.join('\n');
}

function renderSubQuestion(item: SubQuestion, ctx: ExportContext): string {
  return renderBlocks(item.stem, ctx).trim();
}

function appendSolution(
  lines: string[],
  question: ExamQuestion,
  questionPath: string,
  questionNumber: number,
  ctx: ExportContext,
): void {
  addSourceMapEntry(lines, ctx, `${questionPath}.solution`, `第 ${questionNumber} 题解析`);
  lines.push('\\begin{solution}');

  const body = renderBlocks(question.solution ?? [], ctx, undefined, question).trim();
  const referencedScoreIds = new Set(collectScoreReferenceIds(question.solution));
  const referencedAnnotationIds = new Set(collectAnnotationReferenceIds(question.solution));
  const trailingScoreMarks = (question.scoreMarks ?? []).filter(
    (item) => !referencedScoreIds.has(item.id),
  );
  const trailingAnnotations = (question.solutionAnnotations ?? []).filter(
    (item) => !referencedAnnotationIds.has(item.id),
  );

  if (body) {
    lines.push(body);
  }

  if (trailingScoreMarks.length) {
    if (body) {
      lines.push('');
    }

    lines.push(renderScoreMarks(trailingScoreMarks, question.scoreMode));
  }

  appendUnplacedTeacherContentDiagnostics(
    question.scoreMarks ?? [],
    referencedScoreIds,
    trailingAnnotations,
    questionPath,
    ctx,
  );

  if (trailingAnnotations.length) {
    if (body || trailingScoreMarks.length) lines.push('');
    lines.push(...trailingAnnotations.map(renderSolutionAnnotation));
  }

  if (question.subQuestionGroup?.items.some(subQuestionHasTeacherContent)) {
    if (body || trailingScoreMarks.length || trailingAnnotations.length) {
      lines.push('');
    }

    appendSubQuestionSolutions(
      lines,
      question.subQuestionGroup.items,
      questionPath,
      questionNumber,
      ctx,
    );
  }

  lines.push('\\end{solution}');
}

function appendSubQuestionSolutions(
  lines: string[],
  subQuestions: SubQuestion[],
  questionPath: string,
  questionNumber: number,
  ctx: ExportContext,
): void {
  const indexedItems = subQuestions
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => subQuestionHasTeacherContent(item));
  const shouldUseExplicitLabels = indexedItems.length !== subQuestions.length;

  lines.push('\\begin{enumerate}');

  for (const { item, index } of indexedItems) {
    addSourceMapEntry(
      lines,
      ctx,
      `${questionPath}.subQuestionGroup.items.${index}.solution`,
      `第 ${questionNumber} 题第 ${index + 1} 小题解析`,
    );

    const label = shouldUseExplicitLabels ? `[(${index + 1})]` : '';
    lines.push(
      `\\item${label} ${renderSubQuestionTeacherContent(
        item,
        ctx,
        `${questionPath}.subQuestionGroup.items.${index}`,
      )}`,
    );
  }

  lines.push('\\end{enumerate}');
}

function renderSubQuestionTeacherContent(
  item: SubQuestion,
  ctx: ExportContext,
  itemPath: string,
): string {
  const lines: string[] = [];
  const solution = renderBlocks(item.solution ?? [], ctx, undefined, item).trim();
  const referencedScoreIds = new Set(collectScoreReferenceIds(item.solution));
  const referencedAnnotationIds = new Set(collectAnnotationReferenceIds(item.solution));
  const trailingScoreMarks = (item.scoreMarks ?? []).filter(
    (scoreMark) => !referencedScoreIds.has(scoreMark.id),
  );
  const trailingAnnotations = (item.solutionAnnotations ?? []).filter(
    (annotation) => !referencedAnnotationIds.has(annotation.id),
  );

  if (solution) {
    lines.push(`\\textbf{小题解析：} ${solution}`);
  }

  if (trailingScoreMarks.length) {
    if (solution) {
      lines.push('');
    }

    lines.push(renderScoreMarks(trailingScoreMarks, item.scoreMode));
  }

  appendUnplacedTeacherContentDiagnostics(
    item.scoreMarks ?? [],
    referencedScoreIds,
    trailingAnnotations,
    itemPath,
    ctx,
  );

  if (trailingAnnotations.length) {
    if (solution || trailingScoreMarks.length) lines.push('');
    lines.push(...trailingAnnotations.map(renderSolutionAnnotation));
  }

  return lines.filter(Boolean).join('\n\n');
}

function renderScoreMarks(scoreMarks: ScoreMark[], scoreMode?: ScoreMode): string {
  const scoreItemLabel = (scoreMode ?? 'additive') === 'levels' ? '评分档' : '评分点';
  const lines = [`\\textbf{${scoreItemLabel}：}`];

  lines.push(
    ...scoreMarks
      .map((scoreMark) => {
        const description = renderInlineRichText(scoreMark.description);
        return `${description ? `${description} ` : ''}\\score{${scoreMark.points}}`;
      })
      .filter(Boolean),
  );

  return lines.join('\n\n');
}

function renderSolutionAnnotation(annotation: SolutionAnnotation): string {
  return `{\\examsetup{solution/score-pre-content = {}, solution/score-post-content = {}}\\score{${renderInlineRichText(annotation.content)}}}`;
}

function renderInlineRichText(content: ScoreMark['description']): string {
  return (content ?? [])
    .map((item) => {
      if (item.type === 'text') return escapeLatexText(item.text);
      if (item.type === 'inlineMath') return `$${item.latex}$`;
      return item.latex;
    })
    .join('');
}

function appendUnplacedTeacherContentDiagnostics(
  scoreMarks: ScoreMark[],
  referencedScoreIds: Set<string>,
  annotations: SolutionAnnotation[],
  path: string,
  ctx: ExportContext,
): void {
  scoreMarks
    .filter((item) => item.placement === 'inline' && !referencedScoreIds.has(item.id))
    .forEach((item) => {
      addDiagnostic(ctx, {
        severity: 'warning',
        code: 'inline_score_position_missing',
        message: `原位评分项“${item.id}”的位置已丢失，已暂时输出到解析末尾。`,
        path: `${path}.scoreMarks.${item.id}`,
      });
    });

  annotations.forEach((item) => {
    addDiagnostic(ctx, {
      severity: 'warning',
      code: 'inline_annotation_position_missing',
      message: `解析批注“${item.id}”的位置已丢失，已暂时输出到解析末尾。`,
      path: `${path}.solutionAnnotations.${item.id}`,
    });
  });
}

function questionHasTeacherContent(question: ExamQuestion): boolean {
  return Boolean(
    question.solution?.length ||
    question.scoreMarks?.length ||
    question.solutionAnnotations?.length ||
    question.subQuestionGroup?.items.some(subQuestionHasTeacherContent),
  );
}

function subQuestionHasTeacherContent(item: SubQuestion): boolean {
  return Boolean(
    item.solution?.length || item.scoreMarks?.length || item.solutionAnnotations?.length,
  );
}

function renderBlocks(
  blocks: RichContentBlock[],
  ctx: ExportContext,
  question?: ExamQuestion,
  teacherContent?: TeacherContentOwner,
): string {
  return blocks.map((block) => renderBlock(block, ctx, question, teacherContent)).join('\n\n');
}

function renderBlock(
  block: RichContentBlock,
  ctx: ExportContext,
  question?: ExamQuestion,
  teacherContent?: TeacherContentOwner,
): string {
  switch (block.type) {
    case 'paragraph':
      return block.children
        .map((content) => renderInlineContent(content, ctx, question, teacherContent))
        .join('');
    case 'displayMath':
      return `\\[${block.latex}\\]`;
    case 'image':
      return renderImageBlock(block, ctx);
    case 'figureGroup':
      return renderFigureGroupBlock(block, ctx);
    case 'textFigure':
      return renderTextFigureBlock(block, ctx, teacherContent);
    case 'list':
      return renderListBlock(block, ctx, teacherContent);
    case 'rawLatex':
      return block.latex;
  }
}

function renderInlineContent(
  content: InlineContent,
  ctx: ExportContext,
  question?: ExamQuestion,
  teacherContent?: TeacherContentOwner,
): string {
  switch (content.type) {
    case 'text':
      return escapeLatexText(normalizeInlineText(content.text));
    case 'inlineMath':
      return `$${content.latex}$`;
    case 'rawLatex':
      return content.latex;
    case 'blankRef':
      return renderBlankRef(content.blankId, ctx, question);
    case 'choiceParenRef':
      return question
        ? renderParen(question, ctx, 'inline')
        : '{\\examsetup{paren/type = none}\\paren}';
    case 'judgementRef':
      return question?.type === 'judgement' ? renderJudgement(question, ctx, 'inline') : '';
    case 'scoreRef': {
      const scoreMark = teacherContent?.scoreMarks?.find((item) => item.id === content.scoreMarkId);
      return scoreMark ? `\\score{${scoreMark.points}}` : '';
    }
    case 'annotationRef': {
      const annotation = teacherContent?.solutionAnnotations?.find(
        (item) => item.id === content.annotationId,
      );
      return annotation ? renderSolutionAnnotation(annotation) : '';
    }
    case 'stemLine':
      return '\\underline{\\hspace{3em}}';
  }
}

function normalizeInlineText(text: string): string {
  return text.replace(/[ \t]*\r?\n[ \t]*/gu, ' ');
}

function renderBlankRef(
  blankId: string,
  ctx: ExportContext,
  question: ExamQuestion | undefined,
): string {
  const blank = question?.blanks?.find((item) => item.id === blankId);

  if (!blank || !question) {
    addDiagnostic(ctx, {
      severity: 'error',
      code: 'missing_blank_ref',
      message: `填空引用“${blankId}”没有对应的填空项。`,
      path: `questions.${question?.id ?? 'unknown'}.stem`,
    });
    return '';
  }

  return renderBlank(blank, ctx);
}

function renderListBlock(
  block: ListBlock,
  ctx: ExportContext,
  teacherContent?: TeacherContentOwner,
): string {
  const environment = block.kind;

  addOptionDiagnostics(ctx, 'list', 'environment', block.examZhOptions, 'richContent.list');

  if (block.kind !== 'enumerate' && block.kind !== 'itemize') {
    addDiagnostic(ctx, {
      severity: 'warning',
      code: 'list_environment_passthrough',
      message: `列表环境“${block.kind}”会按环境名透传导出。`,
    });
  }

  const options = renderEnvironmentOptions(block.examZhOptions ?? {});
  const lines = [`\\begin{${environment}}${options}`];

  for (const item of block.items) {
    lines.push(`\\item ${renderBlocks(item, ctx, undefined, teacherContent).trim()}`);
  }

  lines.push(`\\end{${environment}}`);
  return lines.join('\n');
}

function renderImageBlock(block: ImageBlock, ctx: ExportContext): string {
  const asset = ctx.assets.get(block.assetId);
  const path = asset?.exportPath ?? asset?.sourcePath;

  if (!asset || !path) {
    addDiagnostic(ctx, {
      severity: 'warning',
      code: 'missing_image_path',
      message: `图片资源“${block.assetId}”没有 exportPath 或 sourcePath。`,
      path: `assets.${block.assetId}`,
    });
  }

  const options = block.includeGraphicsOptions
    ? `[${formatOptionalArgument(block.includeGraphicsOptions)}]`
    : '';
  const image = `\\includegraphics${options}{${path ?? block.assetId}}`;

  if (block.caption) {
    return `${image}\n\\caption{${escapeLatexText(block.caption)}}`;
  }

  return image;
}

function renderFigureGroupBlock(block: FigureGroupBlock, ctx: ExportContext): string {
  addOptionDiagnostics(ctx, 'multifigures', 'environment', block.examZhOptions, 'figureGroup');

  const lines = ['\\begin{multifigures}'];

  for (const item of block.items) {
    const figure = renderFigureGroupItem(item.figure, ctx);
    const label = item.label ? `[${escapeLatexText(item.label)}]` : '';
    lines.push(`\\item${label} ${figure}`);
  }

  lines.push('\\end{multifigures}');
  return lines.join('\n');
}

function renderFigureGroupItem(figure: ImageBlock | RawLatexBlock, ctx: ExportContext): string {
  if (figure.type === 'rawLatex') {
    return figure.latex;
  }

  return renderImageBlock(figure, ctx);
}

function renderTextFigureBlock(
  block: TextFigureBlock,
  ctx: ExportContext,
  teacherContent?: TeacherContentOwner,
): string {
  addOptionDiagnostics(ctx, 'textfigure', 'command', block.examZhOptions, 'textFigure');

  const text = renderBlocks(block.text, ctx, undefined, teacherContent).trim();
  const figure = renderTextFigureFigure(block.figure, ctx).trim();
  return `\\textfigure{${text}}{${figure}}`;
}

function renderTextFigureFigure(
  figure: ImageBlock | FigureGroupBlock | RawLatexBlock,
  ctx: ExportContext,
): string {
  if (figure.type === 'rawLatex') {
    return figure.latex;
  }

  if (figure.type === 'figureGroup') {
    return renderFigureGroupBlock(figure, ctx);
  }

  return renderImageBlock(figure, ctx);
}

function renderEnvironmentOptions(options: ExamZhOptionBag): string {
  return isEmptyOptionBag(options) ? '' : `[${formatOptionalArgument(options)}]`;
}

function blocksContainFillin(blocks: RichContentBlock[]): boolean {
  return blocks.some(blockContainsFillin);
}

function blockContainsFillin(block: RichContentBlock): boolean {
  switch (block.type) {
    case 'paragraph':
      return block.children.some(
        (child) => child.type === 'rawLatex' && child.latex.includes('\\fillin'),
      );
    case 'rawLatex':
      return block.latex.includes('\\fillin');
    case 'list':
      return block.items.some((item) => blocksContainFillin(item));
    case 'textFigure':
      return blocksContainFillin(block.text) || blockContainsFillin(block.figure);
    case 'figureGroup':
      return block.items.some((item) => blockContainsFillin(item.figure));
    case 'image':
    case 'displayMath':
      return false;
  }
}

function blocksContainBlankRef(blocks: RichContentBlock[]): boolean {
  return blocks.some(blockContainsBlankRef);
}

function blockContainsBlankRef(block: RichContentBlock): boolean {
  switch (block.type) {
    case 'paragraph':
      return block.children.some((child) => child.type === 'blankRef');
    case 'list':
      return block.items.some((item) => blocksContainBlankRef(item));
    case 'textFigure':
      return blocksContainBlankRef(block.text) || blockContainsBlankRef(block.figure);
    case 'figureGroup':
      return block.items.some((item) => blockContainsBlankRef(item.figure));
    case 'image':
    case 'displayMath':
    case 'rawLatex':
      return false;
  }
}

function blocksContainChoiceParenRef(blocks: RichContentBlock[]): boolean {
  return blocks.some(blockContainsChoiceParenRef);
}

function blocksContainJudgementRef(blocks: RichContentBlock[]): boolean {
  return blocks.some(blockContainsJudgementRef);
}

function blockContainsJudgementRef(block: RichContentBlock): boolean {
  switch (block.type) {
    case 'paragraph':
      return block.children.some((child) => child.type === 'judgementRef');
    case 'list':
      return block.items.some((item) => blocksContainJudgementRef(item));
    case 'textFigure':
      return blocksContainJudgementRef(block.text);
    case 'displayMath':
    case 'image':
    case 'figureGroup':
    case 'rawLatex':
      return false;
  }
}

function blockContainsChoiceParenRef(block: RichContentBlock): boolean {
  switch (block.type) {
    case 'paragraph':
      return block.children.some((child) => child.type === 'choiceParenRef');
    case 'list':
      return block.items.some((item) => blocksContainChoiceParenRef(item));
    case 'textFigure':
      return blocksContainChoiceParenRef(block.text);
    case 'displayMath':
    case 'image':
    case 'figureGroup':
    case 'rawLatex':
      return false;
  }
}

function addOptionDiagnostics(
  ctx: ExportContext,
  namespace: ExamZhOptionNamespace,
  target: ExamZhOptionTarget,
  options: ExamZhOptionBag | undefined,
  path?: string,
): void {
  const result = validateExamZhOptions(namespace, target, options);

  for (const diagnostic of result.diagnostics) {
    addDiagnostic(ctx, {
      severity: diagnostic.severity,
      code: `exam_zh_${diagnostic.code}`,
      message: diagnostic.message,
      path,
    });
  }
}

function addDiagnostic(ctx: ExportContext, diagnostic: TexExportDiagnostic): void {
  ctx.diagnostics.push(diagnostic);
}

function addDiagnosticOnce(ctx: ExportContext, key: string, diagnostic: TexExportDiagnostic): void {
  if (ctx.diagnosticKeys.has(key)) {
    return;
  }

  ctx.diagnosticKeys.add(key);
  addDiagnostic(ctx, diagnostic);
}

function addSourceMapEntry(lines: string[], ctx: ExportContext, path: string, label: string): void {
  ctx.sourceMap.push({
    line: getNextOutputLine(lines),
    path,
    label,
  });
}

function getNextOutputLine(lines: string[]): number {
  if (lines.length === 0) {
    return 1;
  }

  return lines.reduce((lineCount, line) => lineCount + line.split('\n').length, 0) + 1;
}

function getQuestionTypeLabel(type: ExamQuestion['type']): string {
  switch (type) {
    case 'singleChoice':
      return '单选题';
    case 'multipleChoice':
      return '多选题';
    case 'blank':
      return '填空题';
    case 'judgement':
      return '判断题';
    case 'problem':
      return '解答题';
    case 'rawLatex':
      return '原始 LaTeX';
  }
}

function normalizeTex(lines: string[]): string {
  return `${lines.join('\n').replace(/\r\n/g, '\n').replace(/\n+$/u, '')}\n`;
}
