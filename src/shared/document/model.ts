export const PHASE1_SCHEMA_VERSION = '0.1.0' as const;
export const PHASE2_SCHEMA_VERSION = '0.2.0' as const;
export const PHASE3_SCHEMA_VERSION = '0.3.0' as const;
export const PHASE4_SCHEMA_VERSION = '0.4.0' as const;
export const PHASE5_SCHEMA_VERSION = '0.5.0' as const;
export const PHASE6_SCHEMA_VERSION = '0.6.0' as const;
export const PHASE7_SCHEMA_VERSION = '0.7.0' as const;
export const PHASE8_SCHEMA_VERSION = '0.8.0' as const;
export const PHASE9_SCHEMA_VERSION = '0.9.0' as const;
export const PHASE10_SCHEMA_VERSION = '0.10.0' as const;
export const PHASE11_SCHEMA_VERSION = '0.11.0' as const;
export const PHASE12_SCHEMA_VERSION = '0.12.0' as const;
export const CURRENT_SCHEMA_VERSION = '0.13.0' as const;

export type ExamDocumentSchemaVersion = typeof CURRENT_SCHEMA_VERSION;
export type LegacyExamDocumentSchemaVersion =
  | typeof PHASE1_SCHEMA_VERSION
  | typeof PHASE2_SCHEMA_VERSION
  | typeof PHASE3_SCHEMA_VERSION
  | typeof PHASE4_SCHEMA_VERSION
  | typeof PHASE5_SCHEMA_VERSION
  | typeof PHASE6_SCHEMA_VERSION
  | typeof PHASE7_SCHEMA_VERSION
  | typeof PHASE8_SCHEMA_VERSION
  | typeof PHASE9_SCHEMA_VERSION
  | typeof PHASE10_SCHEMA_VERSION
  | typeof PHASE11_SCHEMA_VERSION
  | typeof PHASE12_SCHEMA_VERSION;

export type ExamZhOptionValue = string | number | boolean | ExamZhOptionBag | ExamZhOptionValue[];

export interface ExamZhOptionBag {
  [key: string]: ExamZhOptionValue;
}

export interface ExamDocument {
  schemaVersion: ExamDocumentSchemaVersion;
  documentId: string;
  metadata: ExamMetadata;
  setup: ExamSetup;
  frontMatter: FrontMatter;
  sections: ExamSection[];
  assets: Asset[];
  examZh?: ExamZhDocumentOptions;
}

export interface ExamMetadata {
  title: string;
  subject: string;
  grade?: string;
  semester?: string;
  durationMinutes?: number;
  totalPoints?: number;
  author?: string;
  notes?: string;
}

export interface ExamSetup {
  answerMode: 'student' | 'teacher';
  choices?: ChoicesSetup;
  fillin?: FillinSetup;
  judgement?: JudgementSetup;
  page?: PageSetup;
  examZhOptions?: ExamZhOptionBag;
}

export interface PageSetup {
  size?: 'a4paper' | 'a3paper';
  showFooter?: boolean;
  footerMode?: 'subject' | 'pageOnly' | 'custom';
  footerTemplate?: string;
  a3FooterType?: 'separate' | 'common';
  showColumnLine?: boolean;
  examZhOptions?: ExamZhOptionBag;
}

export interface JudgementSetup {
  answerColor?: 'black' | 'red';
}

export interface ChoicesSetup {
  maxColumns?: number;
  examZhOptions?: ExamZhOptionBag;
}

export interface FillinSetup {
  type?: BlankSlotType;
  width?: string;
  answerColor?: 'black' | 'red';
  examZhOptions?: ExamZhOptionBag;
}

export interface NumberingSetup {
  start?: number;
  reset?: boolean;
  examZhOptions?: ExamZhOptionBag;
}

export interface FrontMatter {
  secret?: boolean;
  showTitleBlock?: boolean;
  warning?: string;
  informationFields: InformationField[];
  informationPlacement?: InformationPlacement;
  informationSeparator?: InformationSeparatorSetup;
  informationSpacing?: FrontMatterSpacing;
  warningSpacing?: FrontMatterSpacing;
  notices: RichContentBlock[];
  preface?: RichContentBlock[];
}

export type InformationPlacement = 'top' | 'belowSubject';

export type InformationSeparatorMode =
  'compactSpace' | 'wideSpace' | 'comma' | 'middleDot' | 'verticalBar' | 'none' | 'custom';

export interface InformationSeparatorSetup {
  mode: InformationSeparatorMode;
  text?: string;
}

export interface FrontMatterSpacing {
  top: string;
  bottom: string;
}

export type InformationField =
  InformationLineField | InformationSquaresField | InformationTextField;

export interface InformationLineField {
  label: string;
  kind: 'line';
  width?: string;
}

export interface InformationSquaresField {
  label: string;
  kind: 'squares';
  length: number;
}

export interface InformationTextField {
  label: string;
  kind: 'text';
}

export interface ExamSection {
  id: string;
  title: string;
  kind: ExamSectionKind;
  defaultPoints?: number;
  summaryMode?: 'hidden' | 'questionCount' | 'questionCountAndPoints';
  numbering?: NumberingSetup;
  questions: ExamQuestion[];
}

export type ExamSectionKind =
  'singleChoice' | 'multipleChoice' | 'blank' | 'judgement' | 'problem' | 'custom';

export type QuestionType =
  'singleChoice' | 'multipleChoice' | 'blank' | 'judgement' | 'problem' | 'rawLatex';
export type ScoreMode = 'additive' | 'levels';

export interface JudgementQuestionSetup {
  correctAnswer?: boolean;
  answerStyle?: 'text' | 'symbol';
  placement?: 'lineEnd' | 'inline';
}

export interface ExamQuestion {
  id: string;
  type: QuestionType;
  environment?: 'question' | 'problem';
  index?: number;
  points?: number;
  stem: RichContentBlock[];
  choices?: ChoiceOption[];
  choicesSetup?: ChoicesSetup;
  correctChoiceIds?: string[];
  blanks?: BlankSlot[];
  judgement?: JudgementQuestionSetup;
  subQuestionGroup?: SubQuestionGroup;
  solution?: RichContentBlock[];
  scoreMode?: ScoreMode;
  scoreMarks?: ScoreMark[];
  solutionAnnotations?: SolutionAnnotation[];
  rawLatex?: string;
  examZhOptions?: ExamZhOptionBag;
}

export interface ChoiceOption {
  id: string;
  label?: string;
  content: RichContentBlock[];
}

export interface BlankSlot {
  id: string;
  command?: 'fillin' | 'fillin*';
  answer?: RichContentBlock[];
  width?: string;
  type?: BlankSlotType;
  noAnswerType?: 'blacktriangle' | 'counter' | 'none';
  widthType?: 'fill' | 'normal';
  parenType?: 'banjiao' | 'quanjiao';
  examZhOptions?: ExamZhOptionBag;
}

export type BlankSlotType = 'line' | 'paren' | 'circle' | 'rectangle' | 'blank';

export interface SubQuestion {
  id: string;
  label?: string;
  stem: RichContentBlock[];
  solution?: RichContentBlock[];
  scoreMode?: ScoreMode;
  scoreMarks?: ScoreMark[];
  solutionAnnotations?: SolutionAnnotation[];
  examZhOptions?: ExamZhOptionBag;
}

export interface SubQuestionGroup {
  items: SubQuestion[];
  exportAs?: 'enumerate' | 'examZhList' | 'rawLatex';
  listKind?: ListKind;
  rawLatex?: string;
}

export interface ScoreMark {
  id: string;
  points: number;
  description?: InlineRichText;
  placement?: 'summary' | 'inline';
}

export interface SolutionAnnotation {
  id: string;
  content: InlineRichText;
}

export type InlineRichText = InlineRichTextContent[];

export type InlineRichTextContent =
  | { type: 'text'; text: string }
  | { type: 'inlineMath'; latex: string }
  | { type: 'rawLatex'; latex: string };

export type RichContentBlock =
  | ParagraphBlock
  | DisplayMathBlock
  | ImageBlock
  | FigureGroupBlock
  | TextFigureBlock
  | ListBlock
  | RawLatexBlock;

export interface ParagraphBlock {
  type: 'paragraph';
  children: InlineContent[];
}

export type InlineContent =
  | InlineRichTextContent
  | { type: 'blankRef'; blankId: string }
  | { type: 'choiceParenRef' }
  | { type: 'judgementRef' }
  | { type: 'scoreRef'; scoreMarkId: string }
  | { type: 'annotationRef'; annotationId: string }
  | { type: 'stemLine' };

export interface DisplayMathBlock {
  type: 'displayMath';
  latex: string;
}

export type ListKind = 'enumerate' | 'itemize' | 'step' | 'method' | 'case';

export interface ListBlock {
  type: 'list';
  kind: ListKind;
  items: RichContentBlock[][];
  examZhOptions?: ExamZhOptionBag;
}

export interface RawLatexBlock {
  type: 'rawLatex';
  latex: string;
}

export interface Asset {
  id: string;
  kind: 'image';
  sourcePath?: string;
  exportPath?: string;
  alt?: string;
}

export interface ImageBlock {
  type: 'image';
  assetId: string;
  includeGraphicsOptions?: ExamZhOptionBag;
  caption?: string;
  examZhOptions?: ExamZhOptionBag;
}

export interface FigureGroupBlock {
  type: 'figureGroup';
  items: FigureGroupItem[];
  layout?: FigureGroupLayout;
  examZhOptions?: ExamZhOptionBag;
}

export interface FigureGroupLayout {
  kind: 'multifigures';
  columns?: number;
  figPos?: 'top' | 'above' | 'bottom' | 'below' | 'left' | 'right';
}

export interface FigureGroupItem {
  label?: string;
  figure: ImageBlock | RawLatexBlock;
}

export interface TextFigureBlock {
  type: 'textFigure';
  text: RichContentBlock[];
  figure: ImageBlock | FigureGroupBlock | RawLatexBlock;
  layout?: TextFigureLayout;
  examZhOptions?: ExamZhOptionBag;
}

export interface TextFigureLayout {
  kind: 'textfigure';
  figPos?: string;
  textWidth?: string;
  figureWidth?: string;
  ratio?: string;
  top?: number;
}

export interface ExamZhDocumentOptions {
  documentClass?: ExamZhOptionBag;
  rawPreamble?: string[];
}
