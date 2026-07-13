import type { ExamZhOptionBag, ExamZhOptionValue } from '../document/model';

export type ExamZhOptionNamespace =
  | 'documentClass'
  | 'examsetup'
  | 'page'
  | 'draft'
  | 'title'
  | 'notice'
  | 'question'
  | 'problem'
  | 'choices'
  | 'paren'
  | 'fillin'
  | 'solution'
  | 'list'
  | 'textfigure'
  | 'multifigures';

export type ExamZhOptionValueKind =
  'boolean' | 'number' | 'string' | 'dimension' | 'choice' | 'list' | 'object';

export type ExamZhOptionStatus = 'core' | 'advanced' | 'passthrough' | 'planned' | 'unsupported';
export type ExamZhGuiStatus = ExamZhOptionStatus;

export type ExamZhOptionTarget = 'documentClass' | 'examsetup' | 'environment' | 'command';

export interface ExamZhOptionDefinition {
  key: string;
  namespace: ExamZhOptionNamespace;
  valueKind: ExamZhOptionValueKind;
  allowedValues?: string[];
  defaultValue?: ExamZhOptionValue;
  description?: string;
  status: ExamZhOptionStatus;
  target: ExamZhOptionTarget;
  validTargets?: ExamZhOptionTarget[];
  manualRef?: string;
  sourceFile?: string;
  modelPaths?: string[];
  exporterPaths?: string[];
  guiEntry?: string;
  notes?: string;
}

export type ExamZhOptionDiagnosticSeverity = 'warning' | 'error';

export interface ExamZhOptionDiagnostic {
  severity: ExamZhOptionDiagnosticSeverity;
  code: 'unknown_option' | 'wrong_target' | 'invalid_value';
  namespace: string;
  key: string;
  message: string;
}

export interface ExamZhOptionValidationResult {
  ok: boolean;
  diagnostics: ExamZhOptionDiagnostic[];
}

const choicesOptionModelPaths = [
  'setup.choices.examZhOptions',
  'ExamQuestion.choicesSetup.examZhOptions',
  'setup.examZhOptions',
];

const choicesOptionExporterPaths = ['buildChoiceExamSetup', 'renderChoices'];

export const examZhOptionRegistry: ExamZhOptionDefinition[] = [
  {
    namespace: 'documentClass',
    key: 'answers',
    valueKind: 'boolean',
    status: 'advanced',
    target: 'documentClass',
    description: 'Document class answer mode switch placeholder.',
    notes:
      'Phase 8.1 audit keeps this placeholder; verify against upstream document-class options in Phase 8.2.',
  },
  {
    namespace: 'documentClass',
    key: 'twoside',
    valueKind: 'boolean',
    status: 'advanced',
    target: 'documentClass',
  },
  {
    namespace: 'documentClass',
    key: 'fontset',
    valueKind: 'choice',
    allowedValues: ['fandol', 'mac', 'windows', 'ubuntu', 'founder', 'none'],
    status: 'advanced',
    target: 'documentClass',
    description: 'ctex fontset option used by exam-zh document class.',
    sourceFile: 'exam-zh.cls',
    exporterPaths: ['buildDocumentClassOptions'],
    guiEntry: 'No direct GUI control; Tectonic exports may inject fontset=fandol.',
  },
  {
    namespace: 'examsetup',
    key: 'font',
    valueKind: 'choice',
    allowedValues: [
      'garamond',
      'libertinus',
      'lm',
      'newcm',
      'pala',
      'stix',
      'termes',
      'times',
      'xits',
      'none',
    ],
    status: 'advanced',
    target: 'examsetup',
    manualRef: 'exam-zh-doc.pdf v0.2.6, font 设置',
    sourceFile: 'exam-zh-font.sty',
    modelPaths: ['setup.examZhOptions'],
    guiEntry: 'No direct Phase 8.2 GUI control; use examZhOptions.',
    notes: 'Top-level exam-zh key stored through the canonical global passthrough bag.',
  },
  {
    namespace: 'examsetup',
    key: 'math-font',
    valueKind: 'choice',
    allowedValues: [
      'asana',
      'cambria',
      'garamond',
      'libertinus',
      'lm',
      'newcm',
      'pala',
      'stix',
      'termes',
      'xits',
      'none',
    ],
    status: 'advanced',
    target: 'examsetup',
    manualRef: 'exam-zh-doc.pdf v0.2.6, font 设置',
    sourceFile: 'exam-zh-font.sty',
    modelPaths: ['setup.examZhOptions'],
    guiEntry: 'No direct Phase 8.2 GUI control; use examZhOptions.',
    notes: 'Top-level exam-zh key stored through the canonical global passthrough bag.',
  },
  {
    namespace: 'page',
    key: 'size',
    valueKind: 'choice',
    allowedValues: ['a3paper', 'a4paper'],
    defaultValue: 'a4paper',
    status: 'advanced',
    target: 'examsetup',
    manualRef: 'exam-zh-doc.pdf v0.2.6, 页面设置',
    sourceFile: 'exam-zh.cls',
    modelPaths: ['setup.page.size', 'setup.page.examZhOptions', 'setup.examZhOptions'],
    exporterPaths: ['buildPageExamSetup'],
    guiEntry: '试卷设置 > 页面与输出 > 纸张与版式',
    notes: 'A3 selects the upstream landscape two-column layout, not only a larger sheet.',
  },
  {
    namespace: 'page',
    key: 'show-foot',
    valueKind: 'boolean',
    defaultValue: true,
    status: 'advanced',
    target: 'examsetup',
    manualRef: 'exam-zh-doc.pdf v0.2.6, 页眉和页脚',
    sourceFile: 'exam-zh.cls',
    modelPaths: ['setup.page.showFooter', 'setup.page.examZhOptions', 'setup.examZhOptions'],
    exporterPaths: ['buildPageExamSetup'],
    guiEntry: '试卷设置 > 页面与输出 > 页脚',
  },
  {
    namespace: 'page',
    key: 'foot-type',
    valueKind: 'choice',
    allowedValues: ['common', 'separate'],
    defaultValue: 'separate',
    status: 'advanced',
    target: 'examsetup',
    manualRef: 'exam-zh-doc.pdf v0.2.6, 页面设置',
    sourceFile: 'exam-zh.cls',
    modelPaths: ['setup.page.a3FooterType', 'setup.page.examZhOptions'],
    exporterPaths: ['buildPageExamSetup'],
    guiEntry: '试卷设置 > 页面与输出 > A3 页脚',
    notes: 'Only affects A3 output.',
  },
  {
    namespace: 'page',
    key: 'foot-content',
    valueKind: 'string',
    defaultValue: '{数学试题第;页（共~;页）}',
    status: 'advanced',
    target: 'examsetup',
    manualRef: 'exam-zh-doc.pdf v0.2.6, 页眉和页脚',
    sourceFile: 'exam-zh.cls',
    modelPaths: [
      'metadata.subject',
      'setup.page.footerMode',
      'setup.page.footerTemplate',
      'setup.page.examZhOptions',
    ],
    exporterPaths: ['buildPageExamSetup'],
    guiEntry: '试卷设置 > 页面与输出 > 页脚内容',
    notes: 'The GUI stores teacher-facing placeholders and converts them to semicolon syntax.',
  },
  {
    namespace: 'page',
    key: 'show-columnline',
    valueKind: 'boolean',
    defaultValue: false,
    status: 'advanced',
    target: 'examsetup',
    manualRef: 'exam-zh-doc.pdf v0.2.6, 页面设置',
    sourceFile: 'exam-zh.cls',
    modelPaths: ['setup.page.showColumnLine', 'setup.page.examZhOptions'],
    exporterPaths: ['buildPageExamSetup'],
    guiEntry: '试卷设置 > 页面与输出 > A3 中间分隔线',
    notes: 'Only affects A3 output.',
  },
  {
    namespace: 'page',
    key: 'columnline-width',
    valueKind: 'dimension',
    defaultValue: '0.4pt',
    status: 'passthrough',
    target: 'examsetup',
    manualRef: 'exam-zh-doc.pdf v0.2.6, 页面设置',
    sourceFile: 'exam-zh.cls',
    modelPaths: ['setup.page.examZhOptions'],
    exporterPaths: ['buildPageExamSetup'],
    guiEntry: 'No direct GUI control; the A3 line uses the upstream default width.',
  },
  {
    namespace: 'page',
    key: 'show-head',
    valueKind: 'boolean',
    defaultValue: false,
    status: 'passthrough',
    target: 'examsetup',
    manualRef: 'exam-zh-doc.pdf v0.2.6, 页眉和页脚',
    sourceFile: 'exam-zh.cls',
    modelPaths: ['setup.page.examZhOptions'],
    exporterPaths: ['buildPageExamSetup'],
    guiEntry: 'No direct GUI control in Phase 8.11.1.1.',
  },
  {
    namespace: 'page',
    key: 'head-content',
    valueKind: 'string',
    status: 'passthrough',
    target: 'examsetup',
    manualRef: 'exam-zh-doc.pdf v0.2.6, 页眉和页脚',
    sourceFile: 'exam-zh.cls',
    modelPaths: ['setup.page.examZhOptions'],
    exporterPaths: ['buildPageExamSetup'],
    guiEntry: 'No direct GUI control in Phase 8.11.1.1.',
  },
  {
    namespace: 'page',
    key: 'show-chapter',
    valueKind: 'boolean',
    defaultValue: true,
    status: 'passthrough',
    target: 'examsetup',
    manualRef: 'exam-zh-doc.pdf v0.2.6, 页面设置',
    sourceFile: 'exam-zh.cls',
    modelPaths: ['setup.page.examZhOptions'],
    exporterPaths: ['buildPageExamSetup'],
    guiEntry: 'No direct GUI control in Phase 8.11.1.1.',
  },
  {
    namespace: 'draft',
    key: 'show-draft',
    valueKind: 'choice',
    allowedValues: ['auto', 'manual'],
    status: 'passthrough',
    target: 'examsetup',
    manualRef: 'exam-zh-doc.pdf v0.2.6, 草稿纸',
    sourceFile: 'exam-zh.cls',
    modelPaths: ['setup.examZhOptions'],
    guiEntry: 'No direct Phase 8.2 GUI control; use examZhOptions.',
  },
  {
    namespace: 'draft',
    key: 'show-watermark',
    valueKind: 'boolean',
    status: 'passthrough',
    target: 'examsetup',
    manualRef: 'exam-zh-doc.pdf v0.2.6, 草稿纸',
    sourceFile: 'exam-zh.cls',
    modelPaths: ['setup.examZhOptions'],
    guiEntry: 'No direct Phase 8.2 GUI control; use examZhOptions.',
  },
  {
    namespace: 'draft',
    key: 'watermark-size',
    valueKind: 'dimension',
    status: 'passthrough',
    target: 'examsetup',
    manualRef: 'exam-zh-doc.pdf v0.2.6, 草稿纸',
    sourceFile: 'exam-zh.cls',
    modelPaths: ['setup.examZhOptions'],
    guiEntry: 'No direct Phase 8.2 GUI control; use examZhOptions.',
  },
  {
    namespace: 'title',
    key: 'title-format',
    valueKind: 'string',
    defaultValue: '\\Large',
    status: 'passthrough',
    target: 'examsetup',
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.4.4 抬头',
    sourceFile: 'exam-zh.cls',
    modelPaths: ['metadata.title', 'setup.examZhOptions'],
    exporterPaths: ['appendDocumentPreamble'],
    guiEntry: 'Title text has a GUI field; title formatting remains examZhOptions passthrough.',
    notes: 'Registers the upstream title formatting key without changing title export behavior.',
  },
  {
    namespace: 'title',
    key: 'subject-format',
    valueKind: 'string',
    defaultValue: '\\sffamily \\bfseries \\huge',
    status: 'passthrough',
    target: 'examsetup',
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.4.4 抬头',
    sourceFile: 'exam-zh.cls',
    modelPaths: ['metadata.subject', 'setup.examZhOptions'],
    exporterPaths: ['appendDocumentPreamble'],
    guiEntry: 'Subject text has a GUI field; subject formatting remains examZhOptions passthrough.',
    notes: 'Registers the upstream subject formatting key without adding a subject-width model.',
  },
  {
    namespace: 'title',
    key: 'top-sep',
    valueKind: 'dimension',
    defaultValue: '-.5em plus 0.3em minus 0.2em',
    status: 'advanced',
    target: 'examsetup',
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.4.4 抬头',
    sourceFile: 'exam-zh.cls',
    modelPaths: ['setup.examZhOptions'],
    exporterPaths: ['appendDocumentPreamble'],
    guiEntry: 'Advanced front matter spacing preset/custom control.',
  },
  {
    namespace: 'title',
    key: 'bottom-sep',
    valueKind: 'dimension',
    defaultValue: '0em plus 0.3em minus 0.2em',
    status: 'advanced',
    target: 'examsetup',
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.4.4 抬头',
    sourceFile: 'exam-zh.cls',
    modelPaths: ['setup.examZhOptions'],
    exporterPaths: ['appendDocumentPreamble'],
    guiEntry: 'Advanced front matter spacing preset/custom control.',
  },
  {
    namespace: 'notice',
    key: 'label',
    valueKind: 'string',
    defaultValue: '注意事项：',
    status: 'advanced',
    target: 'examsetup',
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.4.4 抬头',
    sourceFile: 'exam-zh.cls',
    modelPaths: ['frontMatter.notices', 'setup.examZhOptions'],
    exporterPaths: ['appendDocumentBody'],
    guiEntry: 'Advanced front matter notice label preset/custom control.',
    notes: 'Registers the upstream notice label key without changing notice list export behavior.',
  },
  {
    namespace: 'notice',
    key: 'label-format',
    valueKind: 'string',
    defaultValue: '\\sffamily \\bfseries',
    status: 'advanced',
    target: 'examsetup',
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.4.4 抬头',
    sourceFile: 'exam-zh.cls',
    modelPaths: ['setup.examZhOptions'],
    exporterPaths: ['appendDocumentBody'],
    guiEntry: 'Advanced front matter notice label-format preset/custom control.',
  },
  {
    namespace: 'notice',
    key: 'top-sep',
    valueKind: 'dimension',
    defaultValue: '.25em plus .25em minus .1em',
    status: 'advanced',
    target: 'examsetup',
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.4.4 抬头',
    sourceFile: 'exam-zh.cls',
    modelPaths: ['setup.examZhOptions'],
    exporterPaths: ['appendDocumentBody'],
    guiEntry: 'Advanced front matter spacing preset/custom control.',
  },
  {
    namespace: 'notice',
    key: 'bottom-sep',
    valueKind: 'dimension',
    defaultValue: '.25em plus .25em minus .1em',
    status: 'advanced',
    target: 'examsetup',
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.4.4 抬头',
    sourceFile: 'exam-zh.cls',
    modelPaths: ['setup.examZhOptions'],
    exporterPaths: ['appendDocumentBody'],
    guiEntry: 'Advanced front matter spacing preset/custom control.',
  },
  {
    namespace: 'question',
    key: 'index',
    valueKind: 'number',
    status: 'advanced',
    target: 'environment',
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.9 题干',
    sourceFile: 'exam-zh-question.sty',
    modelPaths: ['ExamQuestion.index'],
    exporterPaths: ['buildQuestionEnvironmentOptions'],
  },
  {
    namespace: 'question',
    key: 'points',
    valueKind: 'number',
    defaultValue: 0,
    status: 'advanced',
    target: 'environment',
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.9 题干',
    sourceFile: 'exam-zh-question.sty',
    modelPaths: ['ExamQuestion.points', 'ExamSection.defaultPoints'],
    exporterPaths: ['buildQuestionEnvironmentOptions'],
    guiEntry: 'Question points input.',
  },
  {
    namespace: 'question',
    key: 'show-points',
    valueKind: 'choice',
    allowedValues: ['auto', 'true', 'false'],
    defaultValue: 'auto',
    status: 'passthrough',
    target: 'environment',
    validTargets: ['examsetup', 'environment'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.9 题干',
    sourceFile: 'exam-zh-question.sty',
    modelPaths: ['ExamQuestion.examZhOptions', 'setup.examZhOptions'],
  },
  {
    namespace: 'question',
    key: 'label',
    valueKind: 'string',
    defaultValue: '\\arabic*.',
    status: 'advanced',
    target: 'environment',
    validTargets: ['examsetup', 'environment'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.9 题干',
    sourceFile: 'exam-zh-question.sty',
    modelPaths: [
      'ExamSection.numbering.examZhOptions',
      'ExamQuestion.examZhOptions',
      'setup.examZhOptions',
    ],
    exporterPaths: ['buildQuestionEnvironmentOptions'],
    guiEntry: 'Section-level question numbering style presets.',
    notes:
      'Built-in label counters include arabic, alph, Alph, roman, Roman, circlednumber, and tikzcirclednumber. Custom label counters require \\AddQuestionCounter in examZh.rawPreamble.',
  },
  {
    namespace: 'question',
    key: 'show-answer',
    valueKind: 'boolean',
    defaultValue: false,
    status: 'passthrough',
    target: 'environment',
    validTargets: ['examsetup', 'environment'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.9 题干',
    sourceFile: 'exam-zh-question.sty',
    modelPaths: ['setup.answerMode', 'ExamQuestion.judgement'],
    exporterPaths: ['buildAnswerModeExamSetup', 'renderJudgement'],
    notes:
      'Upstream defines true/false choices; registry accepts booleans to preserve existing JSON. Judgement questions reuse the more specific paren/fillin answer switches rather than emitting this key.',
  },
  {
    namespace: 'problem',
    key: 'index',
    valueKind: 'number',
    status: 'advanced',
    target: 'environment',
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.9 题干',
    sourceFile: 'exam-zh-question.sty',
    modelPaths: ['ExamQuestion.index'],
    exporterPaths: ['buildQuestionEnvironmentOptions'],
  },
  {
    namespace: 'problem',
    key: 'points',
    valueKind: 'number',
    defaultValue: 0,
    status: 'advanced',
    target: 'environment',
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.9 题干',
    sourceFile: 'exam-zh-question.sty',
    modelPaths: ['ExamQuestion.points', 'ExamSection.defaultPoints'],
    exporterPaths: ['buildQuestionEnvironmentOptions'],
    guiEntry: 'Question points input.',
  },
  {
    namespace: 'problem',
    key: 'show-points',
    valueKind: 'choice',
    allowedValues: ['auto', 'true', 'false'],
    defaultValue: 'auto',
    status: 'passthrough',
    target: 'environment',
    validTargets: ['examsetup', 'environment'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.9 题干',
    sourceFile: 'exam-zh-question.sty',
    modelPaths: ['ExamQuestion.examZhOptions', 'setup.examZhOptions'],
  },
  {
    namespace: 'problem',
    key: 'label',
    valueKind: 'string',
    defaultValue: '\\arabic*.',
    status: 'advanced',
    target: 'environment',
    validTargets: ['examsetup', 'environment'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.9 题干',
    sourceFile: 'exam-zh-question.sty',
    modelPaths: [
      'ExamSection.numbering.examZhOptions',
      'ExamQuestion.examZhOptions',
      'setup.examZhOptions',
    ],
    exporterPaths: ['buildQuestionEnvironmentOptions'],
    guiEntry: 'Section-level question numbering style presets.',
    notes:
      'Uses the same built-in label counters as question. Custom label counters require \\AddQuestionCounter in examZh.rawPreamble.',
  },
  {
    namespace: 'choices',
    key: 'index',
    valueKind: 'number',
    defaultValue: 1,
    status: 'advanced',
    target: 'environment',
    validTargets: ['examsetup', 'environment'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.10 选择题',
    sourceFile: 'exam-zh-choices.sty',
    modelPaths: choicesOptionModelPaths,
    exporterPaths: choicesOptionExporterPaths,
    guiEntry: 'Per-question choice starting index with built-in counter previews.',
    notes:
      'The advanced GUI accepts positive integers and leaves unknown existing values untouched. Registry validation remains number-only.',
  },
  {
    namespace: 'choices',
    key: 'column-sep',
    valueKind: 'dimension',
    defaultValue: '1em',
    status: 'advanced',
    target: 'environment',
    validTargets: ['examsetup', 'environment'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.10 选择题',
    sourceFile: 'exam-zh-choices.sty',
    modelPaths: choicesOptionModelPaths,
    exporterPaths: choicesOptionExporterPaths,
    guiEntry: 'Global and per-question horizontal-density presets and custom values.',
  },
  {
    namespace: 'choices',
    key: 'columns',
    valueKind: 'number',
    defaultValue: 0,
    status: 'advanced',
    target: 'environment',
    validTargets: ['examsetup', 'environment'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.10 选择题',
    sourceFile: 'exam-zh-choices.sty',
    modelPaths: choicesOptionModelPaths,
    exporterPaths: choicesOptionExporterPaths,
    guiEntry: 'Global and per-question auto/fixed choice column controls.',
    notes:
      'Zero is the upstream internal automatic state; positive values force an exact column count. The exporter repeats a global fixed value only for inheriting choices environments because upstream clears columns before measuring and reapplies only local options. Per-question automatic layout omits columns entirely.',
  },
  {
    namespace: 'choices',
    key: 'label',
    valueKind: 'string',
    defaultValue: '\\Alph*.',
    status: 'advanced',
    target: 'environment',
    validTargets: ['examsetup', 'environment'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.10 选择题',
    sourceFile: 'exam-zh-choices.sty',
    modelPaths: choicesOptionModelPaths,
    exporterPaths: choicesOptionExporterPaths,
    guiEntry: 'Global and per-question built-in choice label presets, including circlednumber.',
    notes:
      'Built-in counters are arabic, alph, Alph, roman, Roman, and circlednumber. Additional counters require \\AddChoicesCounter in examZh.rawPreamble.',
  },
  {
    namespace: 'choices',
    key: 'max-columns',
    valueKind: 'number',
    defaultValue: 4,
    status: 'advanced',
    target: 'environment',
    validTargets: ['examsetup', 'environment'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.10 选择题',
    sourceFile: 'exam-zh-choices.sty',
    modelPaths: [
      'setup.choices.maxColumns',
      'ExamQuestion.choicesSetup.maxColumns',
      ...choicesOptionModelPaths,
    ],
    exporterPaths: choicesOptionExporterPaths,
    guiEntry: 'Global and per-question automatic choice column cap controls.',
    notes:
      'Global and per-question semantic maxColumns values export at their matching scopes. Explicit examZhOptions override the semantic value.',
  },
  {
    namespace: 'choices',
    key: 'label-pos',
    valueKind: 'choice',
    allowedValues: ['auto', 'top-left', 'left', 'bottom'],
    defaultValue: 'auto',
    status: 'advanced',
    target: 'environment',
    validTargets: ['examsetup', 'environment'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.10 选择题',
    sourceFile: 'exam-zh-choices.sty',
    modelPaths: choicesOptionModelPaths,
    exporterPaths: choicesOptionExporterPaths,
    guiEntry: 'Global and per-question choice label position controls.',
    notes:
      'The v0.2.6 manual repeats top-left in the prose and says auto selects bottom for tall content. Bundled source is authoritative: auto selects left for content taller than two baselines and top-left otherwise.',
  },
  {
    namespace: 'choices',
    key: 'label-align',
    valueKind: 'choice',
    allowedValues: ['left', 'center', 'right'],
    defaultValue: 'left',
    status: 'advanced',
    target: 'environment',
    validTargets: ['examsetup', 'environment'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.10 选择题',
    sourceFile: 'exam-zh-choices.sty',
    modelPaths: choicesOptionModelPaths,
    exporterPaths: choicesOptionExporterPaths,
    guiEntry: 'Global and per-question choice-label alignment controls.',
  },
  {
    namespace: 'choices',
    key: 'label-sep',
    valueKind: 'dimension',
    defaultValue: '.5em',
    status: 'advanced',
    target: 'environment',
    validTargets: ['examsetup', 'environment'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.10 选择题',
    sourceFile: 'exam-zh-choices.sty',
    modelPaths: choicesOptionModelPaths,
    exporterPaths: choicesOptionExporterPaths,
    guiEntry: 'Global and per-question horizontal-density presets and custom values.',
  },
  {
    namespace: 'choices',
    key: 'label-width',
    valueKind: 'dimension',
    defaultValue: '0pt',
    status: 'advanced',
    target: 'environment',
    validTargets: ['examsetup', 'environment'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.10 选择题',
    sourceFile: 'exam-zh-choices.sty',
    modelPaths: choicesOptionModelPaths,
    exporterPaths: choicesOptionExporterPaths,
    guiEntry: 'Global and per-question minimum label-width presets and custom values.',
    notes: 'Upstream expands an undersized value to the widest generated label.',
  },
  {
    namespace: 'choices',
    key: 'top-sep',
    valueKind: 'dimension',
    defaultValue: '0pt',
    status: 'advanced',
    target: 'environment',
    validTargets: ['examsetup', 'environment'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.10 选择题',
    sourceFile: 'exam-zh-choices.sty',
    modelPaths: choicesOptionModelPaths,
    exporterPaths: choicesOptionExporterPaths,
    guiEntry: 'Global and per-question vertical-spacing presets and custom values.',
  },
  {
    namespace: 'choices',
    key: 'bottom-sep',
    valueKind: 'dimension',
    defaultValue: '0pt',
    status: 'advanced',
    target: 'environment',
    validTargets: ['examsetup', 'environment'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.10 选择题',
    sourceFile: 'exam-zh-choices.sty',
    modelPaths: choicesOptionModelPaths,
    exporterPaths: choicesOptionExporterPaths,
    guiEntry: 'Global and per-question vertical-spacing presets and custom values.',
  },
  {
    namespace: 'choices',
    key: 'linesep',
    valueKind: 'dimension',
    defaultValue: '0pt plus .5ex',
    status: 'advanced',
    target: 'environment',
    validTargets: ['examsetup', 'environment'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.10 选择题',
    sourceFile: 'exam-zh-choices.sty',
    modelPaths: choicesOptionModelPaths,
    exporterPaths: choicesOptionExporterPaths,
    guiEntry: 'Global and per-question vertical-spacing presets and custom values.',
  },
  {
    namespace: 'paren',
    key: 'type',
    valueKind: 'choice',
    allowedValues: ['hfill', 'none'],
    defaultValue: 'hfill',
    status: 'advanced',
    target: 'command',
    validTargets: ['examsetup', 'command'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.10 选择题',
    sourceFile: 'exam-zh-question.sty',
    modelPaths: [
      'InlineContent.choiceParenRef',
      'ExamQuestion.judgement.placement',
      'setup.examZhOptions',
    ],
    exporterPaths: ['renderParen', 'renderJudgement'],
    guiEntry: 'Choice-stem "选择括号" snippet for explicit inline placement.',
    notes:
      'Automatic parentheses keep the upstream hfill default. Explicit choiceParenRef placeholders locally force type=none without changing global setup.',
  },
  {
    namespace: 'paren',
    key: 'show-answer',
    valueKind: 'boolean',
    defaultValue: false,
    status: 'advanced',
    target: 'command',
    validTargets: ['examsetup', 'command'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.10 选择题',
    sourceFile: 'exam-zh-question.sty',
    modelPaths: ['setup.answerMode', 'ExamQuestion.judgement'],
    exporterPaths: ['buildAnswerModeExamSetup', 'renderJudgement'],
    guiEntry: 'Student/teacher answer mode switch.',
  },
  {
    namespace: 'paren',
    key: 'show-paren',
    valueKind: 'boolean',
    defaultValue: true,
    status: 'passthrough',
    target: 'command',
    validTargets: ['examsetup', 'command'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.10 选择题',
    sourceFile: 'exam-zh-question.sty',
  },
  {
    namespace: 'paren',
    key: 'text-color',
    valueKind: 'string',
    defaultValue: 'black',
    status: 'advanced',
    target: 'command',
    validTargets: ['examsetup', 'command'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.10 选择题',
    sourceFile: 'exam-zh-question.sty',
    modelPaths: ['setup.examZhOptions', 'setup.judgement.answerColor'],
    exporterPaths: ['appendDocumentPreamble', 'renderJudgement'],
    guiEntry: 'Black/red teacher choice-answer color swatches.',
    notes: 'Only colors the answer text inside the parentheses; the parentheses remain black.',
  },
  {
    namespace: 'fillin',
    key: 'type',
    valueKind: 'choice',
    allowedValues: ['line', 'paren', 'circle', 'rectangle', 'blank'],
    status: 'core',
    target: 'command',
    validTargets: ['examsetup', 'command'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.11 填空题',
    sourceFile: 'exam-zh-question.sty',
    modelPaths: ['setup.fillin.type', 'BlankSlot.type', 'ExamQuestion.judgement.placement'],
    exporterPaths: ['buildFillinExamSetup', 'buildBlankOptions', 'renderJudgement'],
    guiEntry: 'Fill-in style control.',
  },
  {
    namespace: 'fillin',
    key: 'show-answer',
    valueKind: 'boolean',
    defaultValue: false,
    status: 'advanced',
    target: 'command',
    validTargets: ['examsetup', 'command'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.11 填空题',
    sourceFile: 'exam-zh-question.sty',
    modelPaths: [
      'setup.answerMode',
      'setup.fillin.examZhOptions',
      'BlankSlot.examZhOptions',
      'ExamQuestion.judgement',
    ],
    exporterPaths: ['buildAnswerModeExamSetup', 'renderBlank', 'renderJudgement'],
    guiEntry: 'Student/teacher answer mode switch.',
  },
  {
    namespace: 'fillin',
    key: 'width',
    valueKind: 'dimension',
    defaultValue: '3em',
    status: 'core',
    target: 'command',
    validTargets: ['examsetup', 'command'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.11 填空题',
    sourceFile: 'exam-zh-question.sty',
    modelPaths: ['setup.fillin.width', 'BlankSlot.width'],
    exporterPaths: ['buildFillinExamSetup', 'buildBlankOptions'],
    guiEntry: 'Fill-in length preset and custom width controls.',
  },
  {
    namespace: 'fillin',
    key: 'width-type',
    valueKind: 'choice',
    allowedValues: ['fill', 'normal'],
    defaultValue: 'normal',
    status: 'advanced',
    target: 'command',
    validTargets: ['examsetup', 'command'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.11 填空题',
    sourceFile: 'exam-zh-question.sty',
    modelPaths: ['setup.fillin.examZhOptions', 'BlankSlot.widthType'],
    exporterPaths: ['buildFillinExamSetup', 'buildBlankOptions'],
    guiEntry: 'Global advanced fill-in layout and per-blank override controls.',
  },
  {
    namespace: 'fillin',
    key: 'box-color',
    valueKind: 'string',
    defaultValue: 'black',
    status: 'advanced',
    target: 'command',
    validTargets: ['examsetup', 'command'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.11 填空题',
    sourceFile: 'exam-zh-question.sty',
    modelPaths: [
      'setup.fillin.examZhOptions',
      'BlankSlot.examZhOptions',
      'setup.judgement.answerColor',
    ],
    exporterPaths: ['buildFillinExamSetup', 'buildBlankOptions', 'renderJudgement'],
    guiEntry: 'Black/red circle and rectangle border swatches in fill-in layout.',
    notes: 'Controls the border color for circle and rectangle fill-in styles.',
  },
  {
    namespace: 'fillin',
    key: 'text-color',
    valueKind: 'string',
    defaultValue: 'black',
    status: 'advanced',
    target: 'command',
    validTargets: ['examsetup', 'command'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.11 填空题',
    sourceFile: 'exam-zh-question.sty',
    modelPaths: ['setup.fillin.examZhOptions', 'BlankSlot.examZhOptions'],
    exporterPaths: ['buildFillinExamSetup', 'buildBlankOptions'],
    guiEntry: 'Black/red teacher fill-in answer color swatches.',
    notes: 'Colors the displayed answer text.',
  },
  {
    namespace: 'fillin',
    key: 'no-answer-type',
    valueKind: 'choice',
    allowedValues: ['blacktriangle', 'counter', 'none'],
    defaultValue: 'blacktriangle',
    status: 'advanced',
    target: 'command',
    validTargets: ['examsetup', 'command'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.11 填空题',
    sourceFile: 'exam-zh-question.sty',
    modelPaths: ['setup.fillin.examZhOptions', 'BlankSlot.noAnswerType'],
    exporterPaths: ['buildFillinExamSetup', 'buildBlankOptions'],
    guiEntry: 'Student answer-sheet, paper-writing, and sequential-counter presets.',
    notes:
      'The v0.2.6 source declares hidden but has no rendering branch for it. Current migrations convert legacy hidden values to none.',
  },
  {
    namespace: 'fillin',
    key: 'no-answer-counter-index',
    valueKind: 'number',
    defaultValue: 1,
    status: 'advanced',
    target: 'command',
    validTargets: ['examsetup', 'command'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.11 填空题',
    sourceFile: 'exam-zh-question.sty',
    modelPaths: ['setup.fillin.examZhOptions', 'BlankSlot.examZhOptions'],
    exporterPaths: ['buildFillinExamSetup', 'buildBlankOptions'],
    guiEntry: 'Sequential fill-in first-number control.',
  },
  {
    namespace: 'fillin',
    key: 'no-answer-counter-label',
    valueKind: 'string',
    defaultValue: '\\arabic*',
    status: 'advanced',
    target: 'command',
    validTargets: ['examsetup', 'command'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.11 填空题',
    sourceFile: 'exam-zh-question.sty',
    modelPaths: ['setup.fillin.examZhOptions', 'BlankSlot.examZhOptions'],
    exporterPaths: ['buildFillinExamSetup', 'buildBlankOptions'],
    guiEntry: 'Seven built-in sequential fill-in label presets.',
    notes: 'Accepts built-in or raw-preamble-registered fill-in counter commands.',
  },
  {
    namespace: 'fillin',
    key: 'paren-type',
    valueKind: 'choice',
    allowedValues: ['banjiao', 'quanjiao'],
    defaultValue: 'banjiao',
    status: 'advanced',
    target: 'command',
    validTargets: ['examsetup', 'command'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.11 填空题',
    sourceFile: 'exam-zh-question.sty',
    modelPaths: ['setup.fillin.examZhOptions', 'BlankSlot.parenType'],
    exporterPaths: ['buildFillinExamSetup', 'buildBlankOptions'],
    guiEntry: 'Global half/full-width parentheses and per-blank override controls.',
  },
  {
    namespace: 'fillin',
    key: 'depth',
    valueKind: 'dimension',
    defaultValue: '.4em',
    status: 'passthrough',
    target: 'command',
    validTargets: ['examsetup', 'command'],
    manualRef: 'exam-zh-question.sty v0.2.6 source only; omitted from manual 3.5.11',
    sourceFile: 'exam-zh-question.sty',
    modelPaths: ['setup.fillin.examZhOptions', 'BlankSlot.examZhOptions'],
    exporterPaths: ['buildFillinExamSetup', 'buildBlankOptions'],
    notes: 'Source-only baseline depth tuning; keep out of the teacher-facing main path.',
  },
  {
    namespace: 'solution',
    key: 'show-solution',
    valueKind: 'choice',
    allowedValues: ['hide', 'show-stay', 'show-move'],
    defaultValue: 'hide',
    status: 'advanced',
    target: 'environment',
    validTargets: ['examsetup', 'environment'],
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.12 解答题',
    sourceFile: 'exam-zh-question.sty',
    modelPaths: ['setup.answerMode'],
    exporterPaths: ['buildAnswerModeExamSetup'],
    guiEntry: 'Student/teacher answer mode switch.',
  },
  {
    namespace: 'list',
    key: 'label',
    valueKind: 'string',
    status: 'passthrough',
    target: 'environment',
    sourceFile: 'exam-zh.cls',
    modelPaths: ['ListBlock.examZhOptions'],
    exporterPaths: ['renderListBlock'],
  },
  {
    namespace: 'textfigure',
    key: 'fig-pos',
    valueKind: 'choice',
    allowedValues: [
      'left',
      'right',
      'top',
      'bottom',
      'top-left',
      'top-right',
      'top-center',
      'top-flushright',
      'bottom-flushright',
      'bottom-left',
      'bottom-right',
      'bottom-center',
      'right-top',
      'right-bottom',
      'right-center',
      'left-top',
      'left-bottom',
      'left-center',
    ],
    defaultValue: 'bottom-right',
    status: 'advanced',
    target: 'command',
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.19 图文排版',
    sourceFile: 'exam-zh-textfigure.sty',
    modelPaths: ['TextFigureBlock.layout.figPos', 'TextFigureBlock.examZhOptions'],
    exporterPaths: ['renderTextFigureBlock'],
  },
  {
    namespace: 'multifigures',
    key: 'columns',
    valueKind: 'number',
    status: 'advanced',
    target: 'environment',
    manualRef: 'exam-zh-doc.pdf v0.2.6, 3.5.19 图文排版',
    sourceFile: 'exam-zh-textfigure.sty',
    modelPaths: ['FigureGroupBlock.layout.columns', 'FigureGroupBlock.examZhOptions'],
    exporterPaths: ['renderFigureGroupBlock'],
  },
];

export function findExamZhOptionDefinition(
  namespace: string,
  key: string,
): ExamZhOptionDefinition | undefined {
  const exact = examZhOptionRegistry.find(
    (definition) => definition.namespace === namespace && definition.key === key,
  );

  if (exact) {
    return exact;
  }

  const resolved = resolveOptionLookup(namespace, key);

  return examZhOptionRegistry.find(
    (definition) => definition.namespace === resolved.namespace && definition.key === resolved.key,
  );
}

export function validateExamZhOptions(
  namespace: ExamZhOptionNamespace,
  target: ExamZhOptionTarget,
  options: ExamZhOptionBag | undefined,
): ExamZhOptionValidationResult {
  if (!options) {
    return { ok: true, diagnostics: [] };
  }

  const diagnostics = Object.entries(options).flatMap(([key, value]) =>
    validateExamZhOption(namespace, target, key, value),
  );

  return {
    ok: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
    diagnostics,
  };
}

function validateExamZhOption(
  namespace: ExamZhOptionNamespace,
  target: ExamZhOptionTarget,
  key: string,
  value: ExamZhOptionValue,
): ExamZhOptionDiagnostic[] {
  const definition = findExamZhOptionDefinition(namespace, key);
  const lookup = resolveOptionLookup(namespace, key);

  if (!definition) {
    return [
      {
        severity: 'warning',
        code: 'unknown_option',
        namespace: lookup.namespace,
        key: lookup.key,
        message: `Unregistered exam-zh option "${lookup.namespace}/${lookup.key}" is preserved as passthrough.`,
      },
    ];
  }

  const diagnostics: ExamZhOptionDiagnostic[] = [];

  const validTargets = definition.validTargets ?? [definition.target];

  if (!validTargets.includes(target)) {
    diagnostics.push({
      severity: 'error',
      code: 'wrong_target',
      namespace: definition.namespace,
      key: definition.key,
      message: `Option "${definition.namespace}/${definition.key}" targets ${validTargets.join(' or ')}, not ${target}.`,
    });
  }

  if (!isOptionValueKind(value, definition)) {
    diagnostics.push({
      severity: 'error',
      code: 'invalid_value',
      namespace: definition.namespace,
      key: definition.key,
      message: `Option "${definition.namespace}/${definition.key}" does not match value kind ${definition.valueKind}.`,
    });
  }

  return diagnostics;
}

function resolveOptionLookup(namespace: string, key: string): { namespace: string; key: string } {
  const separatorIndex = key.indexOf('/');

  if (separatorIndex === -1) {
    return { namespace, key };
  }

  return {
    namespace: key.slice(0, separatorIndex),
    key: key.slice(separatorIndex + 1),
  };
}

function isOptionValueKind(value: ExamZhOptionValue, definition: ExamZhOptionDefinition): boolean {
  switch (definition.valueKind) {
    case 'boolean':
      return typeof value === 'boolean';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'string':
    case 'dimension':
      return typeof value === 'string';
    case 'choice':
      return typeof value === 'string' && definition.allowedValues?.includes(value) === true;
    case 'list':
      return Array.isArray(value);
    case 'object':
      return isOptionBag(value);
  }
}

function isOptionBag(value: ExamZhOptionValue): value is ExamZhOptionBag {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
