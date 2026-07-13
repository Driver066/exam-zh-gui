import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleX,
  Eye,
  FileCode2,
  FilePlus2,
  FileText,
  FolderSearch,
  FolderOpen,
  Info,
  ListTree,
  LoaderCircle,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelRightClose,
  Palette,
  Plus,
  RefreshCw,
  Save,
  SaveAll,
  SearchCheck,
  Settings2,
  Trash2,
  TriangleAlert,
  TextCursorInput,
  X,
} from 'lucide-react';
import {
  Fragment,
  createContext,
  useCallback,
  useContext,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type ReactNode,
} from 'react';

import { MathPreview } from './math/MathPreview';
import { MathSnippetToolbar } from './math/MathSnippetToolbar';
import { PageOutputSettings } from './PageOutputSettings';
import { PdfExportMenu } from './PdfExportMenu';
import { PdfReader, type PdfReaderController, type PdfReaderStatus } from './PdfReader';
import {
  FrontMatterSpacingControl,
  InformationSeparatorControl,
} from './FrontMatterLayoutControls';
import { TemplatePicker } from './TemplatePicker';
import { TooltipAnchor } from './TooltipAnchor';
import { SectionActionsMenu } from './SectionActionsMenu';
import { QuestionAddMenu } from './QuestionAddMenu';
import { EditorObjectHeader } from './EditorObjectHeader';
import { QuestionActionsMenu } from './QuestionActionsMenu';
import { ChoiceAnswerPicker } from './ChoiceAnswerPicker';
import { ChoiceLabelButton } from './ChoiceLabelButton';
import { CompactRichContent } from './CompactRichContent';
import {
  RepeatableEditorHeading,
  RepeatableItemHeader,
  RepeatableItemMenu,
} from './RepeatableEditor';
import { getRepeatableDeleteFocusTarget } from './repeatable-editor-state';
import { useCollapsedRepeatableItems } from './use-collapsed-repeatable-items';
import { QuestionCollapsedSummary } from './QuestionEditorSummary';
import { QuestionEditorTabs } from './QuestionEditorTabs';
import { ScoringSchemeTable, SolutionAnnotationTable } from './TeacherContentTables';
import {
  buildQuestionEditorSummary,
  buildQuestionEditorTabDescriptors,
  getNewQuestionStemSelection,
  removeQuestionEditorTabState,
  resolveQuestionEditorTab,
  setQuestionEditorTab,
  toggleExpandedQuestionId,
  type QuestionEditorTabId,
  type QuestionEditorTabState,
} from './question-editor-state';
import {
  expandSectionProperties,
  getNewSectionTitleSelection,
  getSectionEditorSummary,
  getSectionEditorTitle,
  getSectionKindForQuestionType,
  getSectionKindHint,
  getSectionQuestionAddMode,
  getSelectableSectionKinds,
  isSectionPropertiesExpanded,
  questionTypeLabels,
  removeSectionPropertiesState,
  sectionKindLabels,
  teacherCreatableSectionKinds,
  toggleSectionProperties,
} from './section-editor-state';
import {
  readAppearancePreference,
  writeAppearancePreference,
  type AppAppearance,
} from './appearance-preference';
import {
  getQuestionTeacherContentLabel,
  getSubQuestionTeacherContentLabel,
} from './draft-preview-labels';
import { resolvePreviewScorePresentation } from './teacher-preview';
import { resolveDraftPreviewChoiceColumns } from './draft-preview-layout';
import {
  applyBlankLengthPreset,
  blankLengthPresets,
  blankStyleOptions,
  getBlankLengthPreset,
  getBlankLengthPresetById,
  getBlankStyleOption,
  type BlankLengthPresetId,
} from './blank-ui-options';
import {
  choiceHorizontalDensityPresets,
  choiceLabelAlignmentOptions,
  choiceLabelPositionOptions,
  choiceLabelPresets as choiceOptionLabelPresets,
  choiceLabelWidthPresets,
  choiceVerticalSpacingPresets,
  getChoiceIndexExample,
  getChoiceIndexRangeWarning,
  getChoiceArrangementMode,
  getEffectiveChoiceLabelPosition,
  getGlobalChoiceArrangementSelection,
  getGlobalChoiceHorizontalDensitySelection,
  getGlobalChoiceLabelAlignmentSelection,
  getGlobalChoiceLabelPositionSelection,
  getGlobalChoiceLabelSelection,
  getGlobalChoiceLabelWidthSelection,
  getGlobalChoiceVerticalSpacingSelection,
  getQuestionChoiceArrangementSelection,
  getQuestionChoiceHorizontalDensitySelection,
  getQuestionChoiceIndexSelection,
  getQuestionChoiceIndexValue,
  getQuestionChoiceLabelAlignmentSelection,
  getQuestionChoiceLabelPositionSelection,
  getQuestionChoiceLabelSelection,
  getQuestionChoiceLabelWidthSelection,
  getQuestionChoiceOptions,
  getQuestionChoiceVerticalSpacingSelection,
  getResolvedChoiceAnswerLabel,
  getResolvedChoiceDisplayLabel,
  hasGlobalChoiceAdvancedOverrides,
  hasQuestionChoiceAdvancedOverrides,
  hasCustomChoiceDisplayLabels,
  latexDimensionToCssLength,
  resetChoiceDisplayLabels,
  resolveChoiceLayout,
  resolveGlobalChoiceAdvancedLayout,
  setGlobalChoiceArrangement,
  setGlobalChoiceHorizontalDensity,
  setGlobalChoiceHorizontalDensityCustom,
  setGlobalChoiceLabelAlignment,
  setGlobalChoiceLabelPosition,
  setGlobalChoiceLabelPreset,
  setGlobalChoiceLabelWidth,
  setGlobalChoiceLabelWidthCustom,
  setGlobalChoiceVerticalSpacing,
  setGlobalChoiceVerticalSpacingCustom,
  setQuestionChoiceArrangement,
  setQuestionChoiceHorizontalDensity,
  setQuestionChoiceHorizontalDensityCustom,
  setQuestionChoiceIndex,
  setQuestionChoiceLabelAlignment,
  setQuestionChoiceLabelPosition,
  setQuestionChoiceLabelPreset,
  setQuestionChoiceLabelWidth,
  setQuestionChoiceLabelWidthCustom,
  setQuestionChoiceVerticalSpacing,
  setQuestionChoiceVerticalSpacingCustom,
  type ChoiceArrangementMode,
  type ChoiceArrangementSelection,
  type ChoiceHorizontalDensitySelection,
  type ChoiceHorizontalDensityValues,
  type ChoiceIndexSelection,
  type ChoiceLabelAlignmentSelection,
  type ChoiceLabelPosition,
  type ChoiceLabelPositionSelection,
  type ChoiceLabelSelection,
  type ChoiceLabelWidthSelection,
  type ChoiceVerticalSpacingSelection,
  type ChoiceVerticalSpacingValues,
  type ResolvedGlobalChoiceAdvancedLayout,
} from './choice-layout-options';
import {
  fillinCounterLabelPresets,
  consumeFillinCounterPreviewLabel,
  getBlankFillinNoAnswerSelection,
  getBlankFillinParenSelection,
  getBlankFillinWidthSelection,
  getFillinCounterExample,
  getFillinCounterRangeWarning,
  getGlobalFillinBoxColorSelection,
  getGlobalFillinCounterIndex,
  getGlobalFillinCounterLabelSelection,
  getGlobalFillinNoAnswerSelection,
  getGlobalFillinParenSelection,
  getGlobalFillinTextColorSelection,
  getGlobalFillinWidthSelection,
  hasGlobalFillinAdvancedOverrides,
  resolveFillinLayout,
  setBlankFillinNoAnswerType,
  setBlankFillinParenType,
  setBlankFillinWidthType,
  setGlobalFillinBoxColor,
  setGlobalFillinCounterIndex,
  setGlobalFillinCounterLabel,
  setGlobalFillinNoAnswerType,
  setGlobalFillinParenType,
  setGlobalFillinTextColor,
  setGlobalFillinWidthType,
  type FillinColorSelection,
  type FillinCounterLabelPresetId,
  type FillinNoAnswerSelection,
  type FillinParenSelection,
  type FillinWidthSelection,
} from './fillin-layout-options';
import {
  getGlobalKeyboardShortcutAction,
  getRichContentInputKeyAction,
  getSingleLineInputKeyAction,
} from './keyboard';
import {
  getGlobalJudgementAnswerColor,
  getJudgementAnswerSelection,
  getJudgementAnswerStyleSelection,
  insertJudgementPlaceholder,
  removeJudgementPlaceholders,
  setGlobalJudgementAnswerColor,
  setJudgementAnswerSelection,
  setJudgementAnswerStyle,
  setJudgementPlacementAndStem,
  type JudgementAnswerColorSelection,
} from './judgement-ui-options';
import {
  readScoreModePreference,
  resolveScoreMode,
  writeScoreModePreference,
} from './score-mode-preference';
import {
  normalizeAvailableCompilerPreference,
  readCompilerPreference,
  resolvePreferredProviderLabel,
  writeCompilerPreference,
} from './compiler-preference';
import {
  calculateEffectivePaneWidths,
  closeActiveNarrowPane,
  closePreviewFocusMode,
  editorPaneMinWidth,
  formatAppSignature,
  readLayoutPreferences,
  resolveLayoutPaneResize,
  resolveLayoutPaneResizeCommit,
  togglePreviewFocusMode,
  writeLayoutPaneCollapsed,
  writeLayoutPaneWidth,
  type ActiveNarrowPane,
  type LayoutPane,
  type LayoutPaneWidths,
} from './layout-preferences';
import {
  buildOutlineNavigation,
  getVisibleOutlineBadges,
  type OutlineNavigationModel,
  type OutlineQuestionItem,
} from './outline-navigation';
import {
  expandSectionId,
  getSectionMenuAvailability,
  resolveSectionSelectionAfterDelete,
  toggleCollapsedSectionId,
  type DocumentSettingsGroup,
  type LeftWorkbenchMode,
} from './left-workbench';
import {
  applyPdfExportProgress,
  buildDocumentCheckItems,
  getPdfExportItemPresentation,
  getPdfSessionIssueCount,
  getRightWorkbenchScrollKey,
  getSuccessfulPdfArtifacts,
  queuePdfExportRetry,
  resolvePdfExportRoute,
  shouldPreservePdfPreviewFocus,
  type DocumentCheckItem,
  type PdfExportItemView,
  type PdfExportItemTone,
  type PdfExportSessionView,
  type RightWorkbenchMode,
  type RightWorkbenchScrollKey,
} from './right-workbench';
import {
  createPdfReaderPositions,
  getAdjacentPdfPage,
  getFocusedPdfKeyboardAction,
  normalizePdfPageInput,
  resolveFocusedPdfViewMode,
  updatePdfReaderPosition,
  type FocusedPdfViewMode,
  type PdfReaderPositions,
} from './pdf-reader-state';
import {
  applyEditorPreviewDraft,
  clearNoticePreviewDraft,
  clearNumberPreviewDraft,
  clearRichContentPreviewDraft,
  clearTextPreviewDraft,
  createEditorPreviewDraft,
  setNoticePreviewDraft,
  setNumberPreviewDraft,
  setRichContentPreviewDraft,
  setTextPreviewDraft,
  type MetadataTextPreviewField,
  type NumberPreviewDraftTarget,
  type RichContentPreviewDraftTarget,
  type TextPreviewDraftTarget,
} from './editor-preview-draft';
import {
  findMathSnippet,
  insertMathSnippetAtSelection,
  moveMathSnippetSlot,
  updateMathSnippetSlotStateForEdit,
  updateRecentMathSnippetIds,
  type MathSnippet,
  type MathSnippetContext,
  type MathSnippetSlotState,
} from './math/symbols';
import {
  addInformationField,
  addNotice,
  addQuestion as addQuestionToDocument,
  addSection as addSectionToDocument,
  addSubQuestionToProblem,
  appendBlankRefToStem,
  calculateTotalPointsMismatch,
  commitChoiceLabelDraft,
  commitNoticeDraft,
  commitNumberDraft,
  collectAnnotationReferenceIds,
  createBlankSlot,
  createChoiceOption,
  createDefaultQuestion,
  createDefaultSection,
  createExamDocumentFromTemplate,
  createInformationField,
  createNoticeBlock,
  createSubQuestion,
  duplicateChoiceOptionWithResult,
  duplicateQuestionWithResult,
  duplicateSection as duplicateSectionInDocument,
  duplicateSubQuestionWithResult,
  formatQuestionLabel,
  formatSectionSummary,
  formatJudgementAnswer,
  getQuestionLabelPreset,
  getQuestionLabelPresetValue,
  getScoreItemLabel,
  findTeacherReferenceTextRange,
  insertTeacherReferenceAtSelection,
  getSectionNumberingMode,
  getSectionQuestionLabel,
  insertSectionAt as insertSectionAtDocument,
  moveInformationField,
  moveNotice,
  moveChoiceOption,
  moveQuestion as moveQuestionInDocument,
  moveSection as moveSectionInDocument,
  moveSubQuestion,
  nextChoiceLabel,
  parseRichContentInput,
  parseTeacherSolutionInput,
  questionLabelPresets,
  removeInformationField,
  removeNotice,
  removeChoiceParenRefs,
  removeBlankFromQuestion,
  removeChoiceOption,
  replaceInformationField,
  reviewQuestionScoreMarks,
  resolveQuestionSelectionAfterDelete,
  removeQuestion as removeQuestionFromDocument,
  removeSection as removeSectionFromDocument,
  removeSubQuestion,
  removeAnnotationReferences,
  removeScoreReferences,
  setBlankAnswer,
  stringifyRichContentBlocks,
  stringifyInlineRichText,
  resolveQuestionNumbers,
  resolveJudgementSetup,
  informationSpacingPresets,
  warningSpacingPresets,
  updateQuestion as updateQuestionInDocument,
  updateSection as updateSectionInDocument,
  updateSubQuestion,
  type CreateId,
  type ExamDocumentTemplateId,
  type NumberDraftCommitMode,
  type ParseTeacherSolutionResult,
  type QuestionLabelPresetId,
  type SectionNumberingMode,
  type TeacherReference,
} from '../../shared/document';
import type {
  BlankSlot,
  ChoiceOption,
  ExamDocument,
  ExamQuestion,
  ExamSection,
  ExamSectionKind,
  ExamZhOptionBag,
  InformationField,
  InformationPlacement,
  FrontMatterSpacing,
  InformationSeparatorSetup,
  InlineContent,
  QuestionType,
  RichContentBlock,
  ScoreMark,
  ScoreMode,
  SolutionAnnotation,
  SubQuestion,
} from '../../shared/document/model';
import type { CompilerCapabilities, CompilerPreference } from '../../shared/compile/types';
import type {
  AppEnvironment,
  ExportPdfArtifactResult,
  PdfExportVariant,
} from '../../shared/ipc/contracts';
import type { ExternalLinkTarget } from '../../shared/ipc/external-links';
import {
  getParenAnswerColorSelection,
  getPreviewParenAnswerColor,
  summarizeRichContent,
} from './question-ui-options';

type SaveState = 'clean' | 'dirty' | 'saving' | 'error';
type ExportState = 'idle' | 'exporting' | 'success' | 'warning' | 'error' | 'canceled';
type PdfState = 'idle' | 'compiling' | 'success' | 'error' | 'canceled';
type PreviewMode = 'draft' | 'pdf';
type ToastKind = 'error' | 'warning' | 'success';
const documentSettingsGroups: Array<{ id: DocumentSettingsGroup; label: string }> = [
  { id: 'basic', label: '基本信息' },
  { id: 'frontMatter', label: '卷首与信息' },
  { id: 'questionDefaults', label: '题型默认' },
  { id: 'pageOutput', label: '页面与输出' },
];
type EditorScrollTarget =
  | { kind: 'section'; sectionId: string }
  | { kind: 'question'; sectionId: string; questionId: string };

interface ToastNotification {
  id: string;
  kind: ToastKind;
  title: string;
  message: string;
}

function mergePdfSessionResults(
  current: PdfExportSessionView | null,
  jobId: string,
  artifacts: ExportPdfArtifactResult[],
): PdfExportSessionView {
  const variants = new Set(artifacts.map((artifact) => artifact.variant));
  const retained =
    current?.jobId === jobId ? current.items.filter((item) => !variants.has(item.variant)) : [];
  const completed = artifacts.map((result) => ({
    variant: result.variant,
    phase: 'complete' as const,
    result,
  }));
  const order: PdfExportVariant[] = ['student', 'teacher'];
  return {
    jobId,
    items: [...retained, ...completed].sort(
      (left, right) => order.indexOf(left.variant) - order.indexOf(right.variant),
    ),
  };
}

function createRendererPdfFailure(
  variant: PdfExportVariant,
  message: string,
): ExportPdfArtifactResult {
  return {
    variant,
    success: false,
    diagnostics: [{ severity: 'error', code: 'renderer_export_failed', message }],
    durationMs: 0,
    log: '',
  };
}

interface KeyboardShortcutHandlers {
  newDocument(): void;
  openDocument(): void;
  save(): void;
  saveAs(): void;
}

const informationFieldKindLabels: Record<InformationField['kind'], string> = {
  line: '横线',
  squares: '方框',
  text: '纯文本',
};

const informationPlacementLabels: Record<InformationPlacement, string> = {
  top: '卷首顶端',
  belowSubject: '科目下方居中',
};

const informationFieldWidthOptions = [
  { id: 'short', label: '短', width: '4em' },
  { id: 'standard', label: '标准', width: '6em' },
  { id: 'long', label: '长', width: '8em' },
  { id: 'extraLong', label: '很长', width: '10em' },
] as const;

type InformationFieldWidthOptionId = (typeof informationFieldWidthOptions)[number]['id'];
type InformationFieldWidthSelectValue = InformationFieldWidthOptionId | 'custom';

const upstreamHeaderDefaults = {
  noticeLabel: '注意事项：',
  noticeLabelFormat: '\\sffamily \\bfseries',
  titleTopSep: '-.5em plus 0.3em minus 0.2em',
  titleBottomSep: '0em plus 0.3em minus 0.2em',
  noticeTopSep: '.25em plus .25em minus .1em',
  noticeBottomSep: '.25em plus .25em minus .1em',
} as const;

const noticeLabelOptions = [
  { id: 'default', label: '默认（注意事项：）' },
  { id: 'answerGuide', label: '答题须知：' },
  { id: 'instructions', label: '说明：' },
  { id: 'tip', label: '温馨提示：' },
  { id: 'custom', label: '自定义' },
] as const;

const noticeLabelFormatOptions = [
  { id: 'default', label: '默认' },
  { id: 'normal', label: '正文' },
  { id: 'bold', label: '加粗' },
  { id: 'custom', label: '自定义' },
] as const;

const spacingPresetOptions = [
  { id: 'default', label: '默认' },
  { id: 'compact', label: '紧凑' },
  { id: 'loose', label: '宽松' },
  { id: 'custom', label: '自定义' },
] as const;

type NoticeLabelOptionId = (typeof noticeLabelOptions)[number]['id'];
type NoticeLabelFormatOptionId = (typeof noticeLabelFormatOptions)[number]['id'];
type SpacingPresetOptionId = (typeof spacingPresetOptions)[number]['id'];
type FrontMatterEditorPanelId = 'display' | 'information' | 'notices' | 'advanced';

const defaultFrontMatterEditorCollapseState: Record<FrontMatterEditorPanelId, boolean> = {
  display: false,
  information: true,
  notices: true,
  advanced: true,
};

function createFrontMatterEditorCollapseState(): Record<FrontMatterEditorPanelId, boolean> {
  return { ...defaultFrontMatterEditorCollapseState };
}

const createId: CreateId = (prefix) => `${prefix}-${crypto.randomUUID()}`;

function isOptionalMetadataTextField(field: MetadataTextPreviewField): boolean {
  return field === 'grade' || field === 'semester' || field === 'author' || field === 'notes';
}

interface MathSnippetRecentContextValue {
  recentSnippetIds: string[];
  onSnippetUsed(snippet: MathSnippet): void;
}

const MathSnippetRecentContext = createContext<MathSnippetRecentContextValue>({
  recentSnippetIds: [],
  onSnippetUsed: () => undefined,
});

interface EditorPreviewDraftContextValue {
  onRichContentDraftChange(target: RichContentPreviewDraftTarget, blocks: RichContentBlock[]): void;
  onRichContentDraftEnd(target: RichContentPreviewDraftTarget): void;
}

const EditorPreviewDraftContext = createContext<EditorPreviewDraftContextValue>({
  onRichContentDraftChange: () => undefined,
  onRichContentDraftEnd: () => undefined,
});

export function App() {
  const documentInitializedRef = useRef(false);
  const notificationTimeoutsRef = useRef<Map<string, number>>(new Map());
  const keyboardShortcutHandlersRef = useRef<KeyboardShortcutHandlers | null>(null);
  const workspaceRef = useRef<HTMLElement>(null);
  const outlinePaneRef = useRef<HTMLElement>(null);
  const previewPaneRef = useRef<HTMLElement>(null);
  const narrowPaneOpenerRef = useRef<HTMLElement | null>(null);
  const rightWorkbenchScrollRef = useRef<HTMLDivElement>(null);
  const leftWorkbenchScrollPositionsRef = useRef<Record<LeftWorkbenchMode, number>>({
    navigation: 0,
    settings: 0,
  });
  const rightWorkbenchScrollPositionsRef = useRef<Record<RightWorkbenchScrollKey, number>>({
    'preview-draft': 0,
    'preview-pdf': 0,
    check: 0,
  });
  const sectionElementRefs = useRef<Map<string, HTMLElement>>(new Map());
  const sectionTitleInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const questionElementRefs = useRef<Map<string, HTMLElement>>(new Map());
  const questionStemInputRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());
  const pendingEditorScrollTargetRef = useRef<EditorScrollTarget | null>(null);
  const pendingSectionTitleFocusRef = useRef<{
    sectionId: string;
    selection: { start: number; end: number };
  } | null>(null);
  const pendingQuestionStemFocusRef = useRef<{
    questionId: string;
    selection: { start: number; end: number };
  } | null>(null);
  const [document, setDocument] = useState<ExamDocument | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [activeQuestionTabById, setActiveQuestionTabById] = useState<QuestionEditorTabState>({});
  const [saveState, setSaveState] = useState<SaveState>('clean');
  const [exportState, setExportState] = useState<ExportState>('idle');
  const [exportMessage, setExportMessage] = useState<string>('未导出');
  const [pdfState, setPdfState] = useState<PdfState>('idle');
  const [pdfResult, setPdfResult] = useState<ExportPdfArtifactResult | null>(null);
  const [pdfSession, setPdfSession] = useState<PdfExportSessionView | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('draft');
  const [rightWorkbenchMode, setRightWorkbenchMode] = useState<RightWorkbenchMode>('preview');
  const [pdfRenderErrors, setPdfRenderErrors] = useState<Partial<Record<PdfExportVariant, string>>>(
    {},
  );
  const [editorPreviewDraft, setEditorPreviewDraft] = useState(createEditorPreviewDraft);
  const [contentWarnings, setContentWarnings] = useState<Record<string, string>>({});
  const [frontMatterEditorCollapsed, setFrontMatterEditorCollapsed] = useState(
    createFrontMatterEditorCollapseState,
  );
  const [leftWorkbenchMode, setLeftWorkbenchMode] = useState<LeftWorkbenchMode>('navigation');
  const [documentSettingsGroup, setDocumentSettingsGroup] =
    useState<DocumentSettingsGroup>('basic');
  const [collapsedOutlineSectionIds, setCollapsedOutlineSectionIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [expandedSectionNumberingIds, setExpandedSectionNumberingIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [expandedSectionPropertyIds, setExpandedSectionPropertyIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [recentSnippetIds, setRecentSnippetIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [environment, setEnvironment] = useState<AppEnvironment | null>(null);
  const [preferredScoreMode, setPreferredScoreMode] = useState<ScoreMode>(() =>
    readScoreModePreference(window.localStorage),
  );
  const [appearance, setAppearance] = useState<AppAppearance>(() =>
    readAppearancePreference(window.localStorage),
  );
  const [compilerPreference, setCompilerPreference] = useState<CompilerPreference>(() =>
    readCompilerPreference(window.localStorage),
  );
  const [compilerCapabilities, setCompilerCapabilities] = useState<CompilerCapabilities | null>(
    null,
  );
  const [compilerDetecting, setCompilerDetecting] = useState(true);
  const [outlineCollapsed, setOutlineCollapsed] = useState(
    () => readLayoutPreferences(window.localStorage).outlineCollapsed,
  );
  const [previewCollapsed, setPreviewCollapsed] = useState(
    () => readLayoutPreferences(window.localStorage).previewCollapsed,
  );
  const [outlineWidth, setOutlineWidth] = useState(
    () => readLayoutPreferences(window.localStorage).outlineWidth,
  );
  const [previewWidth, setPreviewWidth] = useState(
    () => readLayoutPreferences(window.localStorage).previewWidth,
  );
  const [resizeDraftWidths, setResizeDraftWidths] = useState<LayoutPaneWidths | null>(null);
  const [paneWidthPriority, setPaneWidthPriority] = useState<LayoutPane | null>(null);
  const [workspaceWidth, setWorkspaceWidth] = useState(() => window.innerWidth);
  const [activeNarrowPane, setActiveNarrowPane] = useState<ActiveNarrowPane>(null);
  const [previewFocused, setPreviewFocused] = useState(false);
  const [isNarrowWorkspace, setIsNarrowWorkspace] = useState(
    () => window.matchMedia('(max-width: 1119px)').matches,
  );

  const dismissNotification = useCallback((id: string): void => {
    const timeoutId = notificationTimeoutsRef.current.get(id);

    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      notificationTimeoutsRef.current.delete(id);
    }

    setNotifications((current) => current.filter((notification) => notification.id !== id));
  }, []);

  const showNotification = useCallback(
    (kind: ToastKind, title: string, message: string): void => {
      const id = `toast-${crypto.randomUUID()}`;

      setNotifications((current) => [...current, { id, kind, title, message }].slice(-3));

      const timeoutId = window.setTimeout(() => dismissNotification(id), 5000);
      notificationTimeoutsRef.current.set(id, timeoutId);
    },
    [dismissNotification],
  );

  const showInputWarning = useCallback(
    (message: string): void => {
      showNotification('warning', '输入提示', message);
    },
    [showNotification],
  );

  const resetLeftWorkbenchState = useCallback((): void => {
    setCollapsedOutlineSectionIds(new Set());
    leftWorkbenchScrollPositionsRef.current = { navigation: 0, settings: 0 };
    setLeftWorkbenchMode('navigation');
    setDocumentSettingsGroup('basic');
  }, []);

  const resetQuestionEditorState = useCallback((): void => {
    pendingSectionTitleFocusRef.current = null;
    sectionTitleInputRefs.current.clear();
    pendingQuestionStemFocusRef.current = null;
    questionStemInputRefs.current.clear();
    setExpandedSectionPropertyIds(new Set());
    setExpandedSectionNumberingIds(new Set());
    setExpandedQuestionId(null);
    setActiveQuestionTabById({});
  }, []);

  const restoreRightWorkbenchScroll = useCallback((key: RightWorkbenchScrollKey): void => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (rightWorkbenchScrollRef.current) {
          rightWorkbenchScrollRef.current.scrollTop = rightWorkbenchScrollPositionsRef.current[key];
        }
      });
    });
  }, []);

  useEffect(() => {
    restoreRightWorkbenchScroll(getRightWorkbenchScrollKey(rightWorkbenchMode, previewMode));
  }, [previewMode, restoreRightWorkbenchScroll, rightWorkbenchMode]);

  const switchRightWorkbenchMode = useCallback(
    (mode: RightWorkbenchMode): void => {
      const currentKey = getRightWorkbenchScrollKey(rightWorkbenchMode, previewMode);
      if (rightWorkbenchScrollRef.current) {
        rightWorkbenchScrollPositionsRef.current[currentKey] =
          rightWorkbenchScrollRef.current.scrollTop;
      }

      if (mode === 'check') {
        setPreviewFocused(false);
      }
      setRightWorkbenchMode(mode);
    },
    [previewMode, rightWorkbenchMode, setPreviewFocused],
  );

  const switchPreviewMode = useCallback(
    (mode: PreviewMode): void => {
      const currentKey = getRightWorkbenchScrollKey('preview', previewMode);
      if (rightWorkbenchScrollRef.current) {
        rightWorkbenchScrollPositionsRef.current[currentKey] =
          rightWorkbenchScrollRef.current.scrollTop;
      }

      setPreviewMode(mode);
    },
    [previewMode],
  );

  const resetRightWorkbenchState = useCallback((): void => {
    rightWorkbenchScrollPositionsRef.current = {
      'preview-draft': 0,
      'preview-pdf': 0,
      check: 0,
    };
    setRightWorkbenchMode('preview');
    setPreviewMode('draft');
    setPreviewFocused(false);
    setPdfRenderErrors({});
  }, []);

  const updatePdfRenderError = useCallback(
    (variant: PdfExportVariant, error: string | null): void => {
      setPdfRenderErrors((current) => {
        const next = { ...current };
        if (error) next[variant] = error;
        else delete next[variant];
        return next;
      });
    },
    [],
  );

  const toggleFrontMatterEditorPanel = useCallback((panelId: FrontMatterEditorPanelId): void => {
    setFrontMatterEditorCollapsed((current) => ({
      ...current,
      [panelId]: !current[panelId],
    }));
  }, []);

  const switchLeftWorkbenchMode = useCallback(
    (mode: LeftWorkbenchMode): void => {
      const pane = outlinePaneRef.current;

      if (pane) {
        leftWorkbenchScrollPositionsRef.current[leftWorkbenchMode] = pane.scrollTop;
      }

      setLeftWorkbenchMode(mode);
      window.requestAnimationFrame(() => {
        if (outlinePaneRef.current) {
          outlinePaneRef.current.scrollTop = leftWorkbenchScrollPositionsRef.current[mode];
        }
      });
    },
    [leftWorkbenchMode],
  );

  const openExternalLink = useCallback(
    async (target: ExternalLinkTarget): Promise<void> => {
      const result = await window.examZhGui.app.openExternal(target);

      if (!result.ok) {
        showNotification('error', '无法打开链接', result.error.message);
      }
    },
    [showNotification],
  );

  const updatePreferredScoreMode = useCallback((scoreMode: ScoreMode): void => {
    setPreferredScoreMode(scoreMode);
    writeScoreModePreference(window.localStorage, scoreMode);
  }, []);

  const updateAppearance = useCallback((nextAppearance: AppAppearance): void => {
    setAppearance(nextAppearance);
    writeAppearancePreference(window.localStorage, nextAppearance);
  }, []);

  const updateCompilerPreference = useCallback((preference: CompilerPreference): void => {
    setCompilerPreference(preference);
    writeCompilerPreference(window.localStorage, preference);
  }, []);

  const closeNarrowWorkbench = useCallback((restoreFocus: boolean): void => {
    const opener = narrowPaneOpenerRef.current;
    narrowPaneOpenerRef.current = null;
    setActiveNarrowPane(closeActiveNarrowPane());

    if (restoreFocus && opener) {
      requestAnimationFrame(() => opener.focus());
    }
  }, []);

  const refreshCompilerCapabilities = useCallback(async (): Promise<void> => {
    setCompilerDetecting(true);
    const result = await window.examZhGui.app.getCompilerCapabilities();
    setCompilerDetecting(false);

    if (!result.ok) {
      showNotification('error', '编译器检测失败', result.error.message);
      return;
    }

    setCompilerCapabilities(result.data);
    setCompilerPreference((current) => {
      const normalized = normalizeAvailableCompilerPreference(current, result.data);
      if (normalized.fellBack) {
        writeCompilerPreference(window.localStorage, normalized.preference);
        showNotification(
          'warning',
          '本机 LaTeX 不可用',
          '已切换为自动选择，生成 PDF 时将尝试内置 Tectonic。',
        );
      }
      return normalized.preference;
    });
  }, [showNotification]);

  const setPaneCollapsed = useCallback((pane: LayoutPane, collapsed: boolean): void => {
    if (pane === 'outline') {
      setOutlineCollapsed(collapsed);
    } else {
      setPreviewCollapsed(collapsed);
    }

    writeLayoutPaneCollapsed(window.localStorage, pane, collapsed);
    setActiveNarrowPane((current) => (current === pane ? closeActiveNarrowPane() : current));
  }, []);

  const openLeftWorkbench = useCallback(
    (
      mode: LeftWorkbenchMode,
      options?: { opener?: HTMLElement; focusSelectedTab?: boolean },
    ): void => {
      switchLeftWorkbenchMode(mode);

      if (isNarrowWorkspace) {
        narrowPaneOpenerRef.current = options?.opener ?? null;
        setActiveNarrowPane('outline');
        if (options?.focusSelectedTab) {
          requestAnimationFrame(() =>
            outlinePaneRef.current
              ?.querySelector<HTMLButtonElement>(
                '.left-workbench-tabs [role="tab"][aria-selected="true"]',
              )
              ?.focus(),
          );
        }
      } else {
        setPaneCollapsed('outline', false);
      }
    },
    [isNarrowWorkspace, setPaneCollapsed, switchLeftWorkbenchMode],
  );

  const openRightWorkbench = useCallback(
    (
      mode: RightWorkbenchMode,
      options?: { opener?: HTMLElement; focusSelectedTab?: boolean },
    ): void => {
      switchRightWorkbenchMode(mode);

      if (isNarrowWorkspace) {
        narrowPaneOpenerRef.current = options?.opener ?? null;
        setActiveNarrowPane('preview');
        if (options?.focusSelectedTab) {
          requestAnimationFrame(() =>
            previewPaneRef.current
              ?.querySelector<HTMLButtonElement>('[role="tab"][aria-selected="true"]')
              ?.focus(),
          );
        }
      } else {
        setPaneCollapsed('preview', false);
      }
    },
    [isNarrowWorkspace, setPaneCollapsed, switchRightWorkbenchMode],
  );

  const setPaneWidthState = useCallback((pane: LayoutPane, width: number): void => {
    if (pane === 'outline') {
      setOutlineWidth(width);
    } else {
      setPreviewWidth(width);
    }
  }, []);

  const setPaneWidth = useCallback(
    (pane: LayoutPane, width: number): void => {
      setPaneWidthState(pane, width);
      writeLayoutPaneWidth(window.localStorage, pane, width);
    },
    [setPaneWidthState],
  );

  const togglePreviewFocus = useCallback((): void => {
    closeNarrowWorkbench(false);
    setPreviewFocused((current) => togglePreviewFocusMode(current));
  }, [closeNarrowWorkbench]);

  const scrollEditorTargetIntoView = useCallback((target: EditorScrollTarget): boolean => {
    const element =
      target.kind === 'section'
        ? sectionElementRefs.current.get(target.sectionId)
        : questionElementRefs.current.get(target.questionId);

    if (!element) {
      return false;
    }

    element.scrollIntoView({ block: 'start', behavior: 'smooth' });
    return true;
  }, []);

  const requestEditorScroll = useCallback(
    (target: EditorScrollTarget): void => {
      pendingEditorScrollTargetRef.current = target;
      window.requestAnimationFrame(() => {
        const pendingTarget = pendingEditorScrollTargetRef.current;

        if (pendingTarget && scrollEditorTargetIntoView(pendingTarget)) {
          pendingEditorScrollTargetRef.current = null;
        }
      });
    },
    [scrollEditorTargetIntoView],
  );

  const selectOutlineSection = useCallback(
    (sectionId: string): void => {
      setSelectedSectionId(sectionId);
      setSelectedQuestionId(null);
      setExpandedQuestionId(null);
      requestEditorScroll({ kind: 'section', sectionId });
    },
    [requestEditorScroll],
  );

  const selectOutlineQuestion = useCallback(
    (sectionId: string, questionId: string): void => {
      setCollapsedOutlineSectionIds((current) => expandSectionId(current, sectionId));
      setExpandedSectionPropertyIds((current) => removeSectionPropertiesState(current, sectionId));
      setSelectedSectionId(sectionId);
      setSelectedQuestionId(questionId);
      setExpandedQuestionId(questionId);
      requestEditorScroll({ kind: 'question', sectionId, questionId });
    },
    [requestEditorScroll],
  );

  const startPaneResize = useCallback(
    (pane: LayoutPane, event: ReactPointerEvent<HTMLDivElement>): void => {
      if (isNarrowWorkspace || previewFocused) {
        return;
      }

      const workspace = workspaceRef.current;

      if (!workspace) {
        return;
      }

      event.preventDefault();

      const workspaceRect = workspace.getBoundingClientRect();
      const initialWidth = pane === 'outline' ? outlineWidth : previewWidth;
      let draftWidth = initialWidth;
      let effectiveDraftWidths: LayoutPaneWidths | null = null;
      let isCollapsedDraft = pane === 'outline' ? outlineCollapsed : previewCollapsed;

      window.document.body.classList.add('is-resizing-pane');

      const handlePointerMove = (moveEvent: PointerEvent): void => {
        const proposedWidth =
          pane === 'outline'
            ? moveEvent.clientX - workspaceRect.left
            : workspaceRect.right - moveEvent.clientX;
        const resizeResult = resolveLayoutPaneResize(pane, proposedWidth, draftWidth);

        if (resizeResult.collapsed) {
          isCollapsedDraft = true;
          setResizeDraftWidths(null);
          setPaneCollapsed(pane, true);
          return;
        }

        isCollapsedDraft = false;
        draftWidth = resizeResult.width;
        setPaneCollapsed(pane, false);
        effectiveDraftWidths = calculateEffectivePaneWidths({
          workspaceWidth: workspaceRect.width,
          outlineWidth: pane === 'outline' ? resizeResult.width : outlineWidth,
          previewWidth: pane === 'preview' ? resizeResult.width : previewWidth,
          outlineCollapsed: pane === 'outline' ? false : outlineCollapsed,
          previewCollapsed: pane === 'preview' ? false : previewCollapsed,
          priorityPane: pane,
        });
        setResizeDraftWidths(effectiveDraftWidths);
      };

      const handlePointerUp = (): void => {
        window.document.body.classList.remove('is-resizing-pane');
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        setResizeDraftWidths(null);

        if (isCollapsedDraft || !effectiveDraftWidths) {
          return;
        }

        const committedWidths = resolveLayoutPaneResizeCommit({
          pane,
          requestedWidth: draftWidth,
          currentWidths: { outlineWidth, previewWidth },
          effectiveWidths: effectiveDraftWidths,
          outlineCollapsed,
          previewCollapsed,
        });
        setPaneWidthPriority(pane);
        setPaneWidth('outline', committedWidths.outlineWidth);
        setPaneWidth('preview', committedWidths.previewWidth);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [
      isNarrowWorkspace,
      outlineCollapsed,
      outlineWidth,
      previewCollapsed,
      previewFocused,
      previewWidth,
      setPaneCollapsed,
      setPaneWidth,
    ],
  );

  const resetPdfState = useCallback((): void => {
    setPdfState('idle');
    setPdfResult(null);
    setPdfSession(null);
    setPreviewMode('draft');
    setPdfRenderErrors({});
    rightWorkbenchScrollPositionsRef.current['preview-pdf'] = 0;
  }, []);

  const routePdfSessionToRightWorkbench = useCallback(
    (session: PdfExportSessionView): void => {
      const route = resolvePdfExportRoute(session);
      const preservePreviewFocus = shouldPreservePdfPreviewFocus(previewFocused, route);
      const focusedArtifact = preservePreviewFocus
        ? getSuccessfulPdfArtifacts(session).find(
            (artifact) => artifact.variant === pdfResult?.variant,
          )
        : null;

      setPdfResult(focusedArtifact ?? route.selectedArtifact);
      setPreviewMode(route.previewMode);
      setRightWorkbenchMode(route.mode);
      if (!preservePreviewFocus) setPreviewFocused(false);
      if (route.mode === 'preview' && route.previewMode === 'pdf') {
        rightWorkbenchScrollPositionsRef.current['preview-pdf'] = 0;
      }
      restoreRightWorkbenchScroll(
        route.mode === 'check'
          ? 'check'
          : route.previewMode === 'pdf'
            ? 'preview-pdf'
            : 'preview-draft',
      );

      if (preservePreviewFocus) return;

      if (isNarrowWorkspace) {
        narrowPaneOpenerRef.current = null;
        setActiveNarrowPane('preview');
      } else {
        setPaneCollapsed('preview', false);
      }
    },
    [
      isNarrowWorkspace,
      pdfResult?.variant,
      previewFocused,
      restoreRightWorkbenchScroll,
      setPaneCollapsed,
    ],
  );

  useEffect(
    () =>
      window.examZhGui.documents.onPdfExportProgress((progress) => {
        setPdfSession((current) => applyPdfExportProgress(current, progress));
      }),
    [],
  );

  function commitEditorPreviewDraftForCommand(): ExamDocument | null {
    if (!document) {
      return null;
    }

    const nextDocument = applyEditorPreviewDraft(document, editorPreviewDraft);

    if (nextDocument !== document) {
      setDocument(nextDocument);
      setEditorPreviewDraft(createEditorPreviewDraft());
      setSaveState('dirty');
    }

    return nextDocument;
  }

  useEffect(() => {
    const notificationTimeouts = notificationTimeoutsRef.current;

    return () => {
      notificationTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
      notificationTimeouts.clear();
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1119px)');

    function handleChange(event: MediaQueryListEvent): void {
      setIsNarrowWorkspace(event.matches);

      if (!event.matches) {
        closeNarrowWorkbench(false);
      }
    }

    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [closeNarrowWorkbench]);

  useEffect(() => {
    const workspace = workspaceRef.current;

    if (!workspace) {
      return;
    }

    const updateWorkspaceWidth = (): void => {
      setWorkspaceWidth(workspace.getBoundingClientRect().width);
    };
    const resizeObserver = new ResizeObserver(updateWorkspaceWidth);

    updateWorkspaceWidth();
    resizeObserver.observe(workspace);
    window.addEventListener('resize', updateWorkspaceWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateWorkspaceWidth);
    };
  }, []);

  useEffect(() => {
    let canceled = false;

    void window.examZhGui.documents.createEmpty().then((result) => {
      if (canceled || documentInitializedRef.current) {
        return;
      }

      if (!result.ok) {
        showNotification('error', '新建失败', result.error.message);
        setSaveState('error');
        return;
      }

      documentInitializedRef.current = true;
      setEditorPreviewDraft(createEditorPreviewDraft());
      setFrontMatterEditorCollapsed(createFrontMatterEditorCollapseState());
      resetLeftWorkbenchState();
      resetRightWorkbenchState();
      resetQuestionEditorState();
      setDocument(result.data);
      setFilePath(null);
      setSelectedSectionId(result.data.sections[0]?.id ?? null);
      setSelectedQuestionId(null);
      setContentWarnings({});
      setExportState('idle');
      setExportMessage('未导出');
      resetPdfState();
      setSaveState('clean');
    });
    void window.examZhGui.app.getEnvironment().then((result) => {
      if (result.ok) {
        setEnvironment(result.data);
      }
    });
    const compilerDetectionTimeout = window.setTimeout(() => {
      void refreshCompilerCapabilities();
    }, 0);

    return () => {
      canceled = true;
      window.clearTimeout(compilerDetectionTimeout);
    };
  }, [
    refreshCompilerCapabilities,
    resetLeftWorkbenchState,
    resetPdfState,
    resetQuestionEditorState,
    resetRightWorkbenchState,
    showNotification,
  ]);

  const selectedSection = useMemo(() => {
    if (!document) {
      return null;
    }

    return (
      document.sections.find((section) => section.id === selectedSectionId) ??
      document.sections[0] ??
      null
    );
  }, [document, selectedSectionId]);

  const previewDocument = useMemo(
    () => applyEditorPreviewDraft(document, editorPreviewDraft),
    [document, editorPreviewDraft],
  );
  const deferredCheckDocument = useDeferredValue(previewDocument);
  const documentCheckItems = useMemo(
    () =>
      rightWorkbenchMode === 'check' && deferredCheckDocument
        ? buildDocumentCheckItems(deferredCheckDocument)
        : [],
    [deferredCheckDocument, rightWorkbenchMode],
  );
  const documentCheckPending =
    rightWorkbenchMode === 'check' && deferredCheckDocument !== previewDocument;
  const successfulPdfArtifacts = useMemo(() => getSuccessfulPdfArtifacts(pdfSession), [pdfSession]);
  const pdfSessionIssueCount = useMemo(() => getPdfSessionIssueCount(pdfSession), [pdfSession]);
  const selectedPreviewSection = useMemo(() => {
    if (!previewDocument) {
      return null;
    }

    return (
      previewDocument.sections.find((section) => section.id === selectedSectionId) ??
      previewDocument.sections[0] ??
      null
    );
  }, [previewDocument, selectedSectionId]);
  const outlineNavigation = useMemo(
    () => (previewDocument ? buildOutlineNavigation(previewDocument) : null),
    [previewDocument],
  );

  const activeSelectedQuestionId = useMemo(() => {
    if (!previewDocument || !selectedQuestionId) {
      return null;
    }

    return previewDocument.sections.some((section) =>
      section.questions.some((question) => question.id === selectedQuestionId),
    )
      ? selectedQuestionId
      : null;
  }, [previewDocument, selectedQuestionId]);
  const totalPointsMismatch = useMemo(
    () => (previewDocument ? calculateTotalPointsMismatch(previewDocument) : null),
    [previewDocument],
  );

  useEffect(() => {
    const pendingTarget = pendingEditorScrollTargetRef.current;

    if (!pendingTarget) {
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      const currentTarget = pendingEditorScrollTargetRef.current;

      if (currentTarget && scrollEditorTargetIntoView(currentTarget)) {
        pendingEditorScrollTargetRef.current = null;
      }
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [scrollEditorTargetIntoView, selectedPreviewSection?.id, selectedQuestionId]);

  useEffect(() => {
    const pendingFocus = pendingSectionTitleFocusRef.current;

    if (!pendingFocus || !expandedSectionPropertyIds.has(pendingFocus.sectionId)) {
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      const input = sectionTitleInputRefs.current.get(pendingFocus.sectionId);

      if (!input) return;

      input.focus();
      input.setSelectionRange(pendingFocus.selection.start, pendingFocus.selection.end);
      pendingSectionTitleFocusRef.current = null;
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [expandedSectionPropertyIds, selectedPreviewSection?.id]);

  useEffect(() => {
    const pendingFocus = pendingQuestionStemFocusRef.current;

    if (!pendingFocus || expandedQuestionId !== pendingFocus.questionId) {
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      const textarea = questionStemInputRefs.current.get(pendingFocus.questionId);

      if (!textarea) {
        return;
      }

      textarea.focus();
      textarea.setSelectionRange(pendingFocus.selection.start, pendingFocus.selection.end);
      pendingQuestionStemFocusRef.current = null;
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [expandedQuestionId, selectedPreviewSection?.id]);

  const handleSnippetUsed = useCallback((snippet: MathSnippet) => {
    setRecentSnippetIds((current) => updateRecentMathSnippetIds(current, snippet.id));
  }, []);

  const snippetRecentContextValue = useMemo(
    () => ({
      recentSnippetIds,
      onSnippetUsed: handleSnippetUsed,
    }),
    [handleSnippetUsed, recentSnippetIds],
  );

  const handleRichContentDraftChange = useCallback(
    (target: RichContentPreviewDraftTarget, blocks: RichContentBlock[]): void => {
      setEditorPreviewDraft((current) => setRichContentPreviewDraft(current, { target, blocks }));
    },
    [],
  );

  const handleRichContentDraftEnd = useCallback((target: RichContentPreviewDraftTarget): void => {
    setEditorPreviewDraft((current) => clearRichContentPreviewDraft(current, target));
  }, []);

  const setTextDraft = useCallback((target: TextPreviewDraftTarget, value: string): void => {
    setEditorPreviewDraft((current) => setTextPreviewDraft(current, { target, value }));
  }, []);

  const clearTextDraft = useCallback((target: TextPreviewDraftTarget): void => {
    setEditorPreviewDraft((current) => clearTextPreviewDraft(current, target));
  }, []);

  const editorPreviewDraftContextValue = useMemo(
    () => ({
      onRichContentDraftChange: handleRichContentDraftChange,
      onRichContentDraftEnd: handleRichContentDraftEnd,
    }),
    [handleRichContentDraftChange, handleRichContentDraftEnd],
  );

  function resetExportState(): void {
    setExportState('idle');
    setExportMessage('未导出');
  }

  async function createBlankDocument(markDirty = true): Promise<void> {
    const result = await window.examZhGui.documents.createEmpty();

    if (!result.ok) {
      showNotification('error', '新建失败', result.error.message);
      setSaveState('error');
      return;
    }

    documentInitializedRef.current = true;
    setEditorPreviewDraft(createEditorPreviewDraft());
    setFrontMatterEditorCollapsed(createFrontMatterEditorCollapseState());
    resetLeftWorkbenchState();
    resetRightWorkbenchState();
    resetQuestionEditorState();
    setDocument(result.data);
    setFilePath(null);
    setSelectedSectionId(result.data.sections[0]?.id ?? null);
    setSelectedQuestionId(null);
    setContentWarnings({});
    resetExportState();
    resetPdfState();
    setSaveState(markDirty ? 'dirty' : 'clean');
  }

  function createDocumentFromTemplate(templateId: ExamDocumentTemplateId): void {
    const nextDocument = createExamDocumentFromTemplate(templateId, createId);

    documentInitializedRef.current = true;
    setEditorPreviewDraft(createEditorPreviewDraft());
    setFrontMatterEditorCollapsed(createFrontMatterEditorCollapseState());
    resetLeftWorkbenchState();
    resetRightWorkbenchState();
    resetQuestionEditorState();
    setDocument(nextDocument);
    setFilePath(null);
    setSelectedSectionId(nextDocument.sections[0]?.id ?? null);
    setSelectedQuestionId(null);
    setContentWarnings({});
    resetExportState();
    resetPdfState();
    setSaveState('dirty');
  }

  async function openDocument(): Promise<void> {
    const result = await window.examZhGui.documents.open();

    if (!result.ok) {
      showNotification('error', '打开失败', result.error.message);
      setSaveState('error');
      return;
    }

    if (!result.data) {
      return;
    }

    documentInitializedRef.current = true;
    setEditorPreviewDraft(createEditorPreviewDraft());
    setFrontMatterEditorCollapsed(createFrontMatterEditorCollapseState());
    resetLeftWorkbenchState();
    resetRightWorkbenchState();
    resetQuestionEditorState();
    setDocument(result.data.document);
    setFilePath(result.data.filePath);
    setSelectedSectionId(result.data.document.sections[0]?.id ?? null);
    setSelectedQuestionId(null);
    setContentWarnings({});
    resetExportState();
    resetPdfState();
    setSaveState('clean');
  }

  async function saveDocument(): Promise<void> {
    const documentForCommand = commitEditorPreviewDraftForCommand();

    if (!documentForCommand) {
      return;
    }

    setSaveState('saving');
    const result = await window.examZhGui.documents.save(documentForCommand, filePath);

    if (!result.ok) {
      showNotification('error', '保存失败', result.error.message);
      setSaveState('error');
      return;
    }

    if (!result.data) {
      setSaveState('dirty');
      return;
    }

    setDocument(result.data.document);
    setFilePath(result.data.filePath);
    setEditorPreviewDraft(createEditorPreviewDraft());
    setSaveState('clean');
  }

  async function saveDocumentAs(): Promise<void> {
    const documentForCommand = commitEditorPreviewDraftForCommand();

    if (!documentForCommand) {
      return;
    }

    setSaveState('saving');
    const result = await window.examZhGui.documents.saveAs(documentForCommand);

    if (!result.ok) {
      showNotification('error', '另存失败', result.error.message);
      setSaveState('error');
      return;
    }

    if (!result.data) {
      setSaveState('dirty');
      return;
    }

    setDocument(result.data.document);
    setFilePath(result.data.filePath);
    setEditorPreviewDraft(createEditorPreviewDraft());
    setSaveState('clean');
  }

  useEffect(() => {
    keyboardShortcutHandlersRef.current = {
      newDocument: () => void createBlankDocument(),
      openDocument: () => void openDocument(),
      save: () => void saveDocument(),
      saveAs: () => void saveDocumentAs(),
    };
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const action = getGlobalKeyboardShortcutAction(event);

      if (!action) {
        return;
      }

      event.preventDefault();

      const handlers = keyboardShortcutHandlersRef.current;

      if (!handlers) {
        return;
      }

      switch (action) {
        case 'newDocument':
          handlers.newDocument();
          break;
        case 'openDocument':
          handlers.openDocument();
          break;
        case 'save':
          handlers.save();
          break;
        case 'saveAs':
          handlers.saveAs();
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!activeNarrowPane) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (previewFocused || event.defaultPrevented || event.isComposing || event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      closeNarrowWorkbench(true);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeNarrowPane, closeNarrowWorkbench, previewFocused]);

  useEffect(() => {
    if (!previewFocused) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.defaultPrevented || event.isComposing || event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      setPreviewFocused(closePreviewFocusMode());
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewFocused]);

  async function exportTex(): Promise<void> {
    const documentForCommand = commitEditorPreviewDraftForCommand();

    if (!documentForCommand) {
      return;
    }

    setExportState('exporting');
    setExportMessage('导出中');

    const result = await window.examZhGui.documents.exportTex(documentForCommand, filePath);

    if (!result.ok) {
      showNotification('error', '导出失败', result.error.message);
      setExportState('error');
      setExportMessage('导出失败');
      return;
    }

    if (!result.data) {
      setExportState('canceled');
      setExportMessage('已取消导出');
      return;
    }

    const warningCount = result.data.diagnostics.filter(
      (diagnostic) => diagnostic.severity === 'warning',
    ).length;

    setExportState(warningCount > 0 ? 'warning' : 'success');
    setExportMessage(warningCount > 0 ? `已导出 .tex，${warningCount} 个提示` : '已导出 .tex');

    if (warningCount > 0) {
      const firstWarning = result.data.diagnostics.find(
        (diagnostic) => diagnostic.severity === 'warning',
      );
      showNotification('warning', '导出完成但有提示', firstWarning?.message ?? '请检查导出提示。');
    }
  }

  async function exportPdf(variants: PdfExportVariant[], retry = false): Promise<void> {
    const documentForCommand = commitEditorPreviewDraftForCommand();

    if (!documentForCommand) return;

    const jobId = retry && pdfSession ? pdfSession.jobId : `pdf-${crypto.randomUUID()}`;
    if (retry && !pdfSession) return;

    setPdfSession((current) => {
      if (retry && current?.jobId === jobId) {
        return queuePdfExportRetry(current, variants);
      }
      return {
        jobId,
        items: variants.map((variant) => ({ variant, phase: 'queued' as const })),
      };
    });

    setPdfState('compiling');
    const result = await window.examZhGui.documents.exportPdf({
      document: documentForCommand,
      sourceFilePath: filePath,
      jobId,
      variants,
      compilerPreference,
      retry,
    });

    if (!result.ok) {
      showNotification('error', 'PDF 生成失败', result.error.message);
      setPdfState('error');
      const failureResults = variants.map((variant) =>
        createRendererPdfFailure(variant, result.error.message),
      );
      const failureSession = mergePdfSessionResults(pdfSession, jobId, failureResults);
      setPdfSession(failureSession);
      routePdfSessionToRightWorkbench(failureSession);
      return;
    }

    if (!result.data) {
      setPdfState('canceled');
      if (!retry) setPdfSession(null);
      return;
    }

    const nextSession = mergePdfSessionResults(
      pdfSession,
      result.data.jobId,
      result.data.artifacts,
    );
    setPdfSession(nextSession);
    const successful = result.data.artifacts.filter((artifact) => artifact.success);
    const route = resolvePdfExportRoute(nextSession);
    const selected = route.selectedArtifact;
    routePdfSessionToRightWorkbench(nextSession);

    if (successful.length === 0) {
      setPdfState('error');
      showNotification(
        'error',
        'PDF 生成失败',
        selected?.diagnostics[0]?.message ?? '请查看编译日志。',
      );
      return;
    }

    setPdfState('success');
    const failedCount = result.data.artifacts.length - successful.length;
    const warningCount = successful.reduce(
      (count, artifact) =>
        count + artifact.diagnostics.filter((diagnostic) => diagnostic.severity !== 'error').length,
      0,
    );

    if (failedCount > 0) {
      showNotification(
        'warning',
        'PDF 部分生成',
        `${successful.length} 份成功，${failedCount} 份失败。`,
      );
    } else if (warningCount > 0) {
      showNotification('warning', 'PDF 已生成但有提示', `共 ${warningCount} 个排版提示。`);
    } else {
      showNotification('success', 'PDF 已生成', `已生成 ${successful.length} 份 PDF。`);
    }
  }

  function previewPdfArtifact(artifact: ExportPdfArtifactResult): void {
    if (!artifact.success || !artifact.pdfDataBase64) {
      inspectPdfArtifact(artifact);
      return;
    }

    setPdfResult(artifact);
    setPreviewMode('pdf');
    openRightWorkbench('preview');
  }

  function inspectPdfArtifact(artifact: ExportPdfArtifactResult): void {
    setPdfResult(artifact);
    openRightWorkbench('check');
  }

  async function revealPdfArtifact(artifact: ExportPdfArtifactResult): Promise<void> {
    if (!artifact.pdfPath) return;
    const result = await window.examZhGui.documents.revealExportedPdf(artifact.pdfPath);
    if (!result.ok) showNotification('error', '无法定位 PDF', result.error.message);
  }

  function locateDocumentCheck(check: DocumentCheckItem): void {
    if (check.sectionId && check.questionId) {
      selectOutlineQuestion(check.sectionId, check.questionId);
      return;
    }

    if (check.sectionId) {
      selectOutlineSection(check.sectionId);
    }
  }

  function updateDocument(updater: (current: ExamDocument) => ExamDocument): void {
    setDocument((current) => (current ? updater(current) : current));
    setSaveState('dirty');
    resetExportState();
    resetPdfState();
  }

  function updateMetadata(field: MetadataTextPreviewField, value: string): void {
    updateDocument((current) => {
      const metadata = { ...current.metadata };

      if (isOptionalMetadataTextField(field) && value.trim() === '') {
        delete metadata[field];
      } else {
        metadata[field] = value;
      }

      return {
        ...current,
        metadata,
      };
    });
  }

  function updateMetadataNumber(
    field: 'durationMinutes' | 'totalPoints',
    value: number | undefined,
  ): void {
    updateDocument((current) => {
      const metadata = { ...current.metadata };

      if (value === undefined) {
        delete metadata[field];
      } else {
        metadata[field] = value;
      }

      return {
        ...current,
        metadata,
      };
    });
  }

  function updateFrontMatterSecret(secret: boolean): void {
    updateDocument((current) => ({
      ...current,
      frontMatter: {
        ...current.frontMatter,
        secret,
      },
    }));
  }

  function updateFrontMatterShowTitleBlock(showTitleBlock: boolean): void {
    updateDocument((current) => ({
      ...current,
      frontMatter: {
        ...current.frontMatter,
        showTitleBlock,
      },
    }));
  }

  function updateFrontMatterWarning(warning: string): void {
    setEditorPreviewDraft((current) =>
      clearTextPreviewDraft(current, { kind: 'frontMatterWarning' }),
    );
    updateDocument((current) => {
      const frontMatter = { ...current.frontMatter };
      const trimmedWarning = warning.trim();

      if (trimmedWarning.length === 0) {
        delete frontMatter.warning;
      } else {
        frontMatter.warning = warning;
      }

      return {
        ...current,
        frontMatter,
      };
    });
  }

  function updateFrontMatterInformationFields(informationFields: InformationField[]): void {
    updateDocument((current) => ({
      ...current,
      frontMatter: {
        ...current.frontMatter,
        informationFields,
      },
    }));
  }

  function updateFrontMatterInformationPlacement(informationPlacement: InformationPlacement): void {
    updateDocument((current) => ({
      ...current,
      frontMatter: {
        ...current.frontMatter,
        informationPlacement,
      },
    }));
  }

  function updateFrontMatterInformationSeparator(
    informationSeparator: InformationSeparatorSetup | undefined,
  ): void {
    updateDocument((current) => {
      const frontMatter = { ...current.frontMatter };
      if (informationSeparator) frontMatter.informationSeparator = informationSeparator;
      else delete frontMatter.informationSeparator;
      return { ...current, frontMatter };
    });
  }

  function updateFrontMatterSpacing(
    key: 'informationSpacing' | 'warningSpacing',
    spacing: FrontMatterSpacing | undefined,
  ): void {
    updateDocument((current) => {
      const frontMatter = { ...current.frontMatter };
      if (spacing) frontMatter[key] = spacing;
      else delete frontMatter[key];
      return { ...current, frontMatter };
    });
  }

  function updateSetupExamZhOptions(
    updates: Record<string, ExamZhOptionBag[string] | undefined>,
  ): void {
    updateDocument((current) => {
      const examZhOptions: ExamZhOptionBag = { ...(current.setup.examZhOptions ?? {}) };

      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || (typeof value === 'string' && value.trim().length === 0)) {
          delete examZhOptions[key];
        } else {
          examZhOptions[key] = value;
        }
      }

      const setup = { ...current.setup };

      if (Object.keys(examZhOptions).length === 0) {
        delete setup.examZhOptions;
      } else {
        setup.examZhOptions = examZhOptions;
      }

      return {
        ...current,
        setup,
      };
    });
  }

  function updateFrontMatterNotices(notices: RichContentBlock[]): void {
    setEditorPreviewDraft(clearNoticePreviewDraft);
    updateDocument((current) => ({
      ...current,
      frontMatter: {
        ...current.frontMatter,
        notices,
      },
    }));
  }

  function insertSectionAt(index: number, kind: ExamSectionKind = 'custom'): void {
    const section = createDefaultSection(createId, kind);
    pendingSectionTitleFocusRef.current = {
      sectionId: section.id,
      selection: getNewSectionTitleSelection(section),
    };
    updateDocument((current) => insertSectionAtDocument(current, section, index));
    setCollapsedOutlineSectionIds((current) => expandSectionId(current, section.id));
    setExpandedSectionPropertyIds((current) => expandSectionProperties(current, section.id));
    setSelectedSectionId(section.id);
    setSelectedQuestionId(null);
    setExpandedQuestionId(null);
    requestEditorScroll({ kind: 'section', sectionId: section.id });
  }

  function addSection(kind: ExamSectionKind = 'custom'): void {
    insertSectionAt(document?.sections.length ?? 0, kind);
  }

  function updateSelectedSection(updater: (section: ExamSection) => ExamSection): void {
    if (!selectedSection) {
      return;
    }

    updateDocument((current) => updateSectionInDocument(current, selectedSection.id, updater));
  }

  function moveOutlineSection(sectionId: string, direction: 'up' | 'down'): void {
    updateDocument((current) => moveSectionInDocument(current, sectionId, direction));

    if (sectionId === selectedSectionId) {
      if (activeSelectedQuestionId) {
        requestEditorScroll({
          kind: 'question',
          sectionId,
          questionId: activeSelectedQuestionId,
        });
      } else {
        requestEditorScroll({ kind: 'section', sectionId });
      }
    }
  }

  function duplicateOutlineSection(sectionId: string): void {
    updateDocument((current) => duplicateSectionInDocument(current, sectionId, createId));
  }

  function deleteSection(sectionId: string): void {
    if (!document) {
      return;
    }

    const nextSelection = resolveSectionSelectionAfterDelete(
      document,
      sectionId,
      selectedSectionId,
    );

    updateDocument((current) => removeSectionFromDocument(current, sectionId));
    setCollapsedOutlineSectionIds((current) => {
      const next = new Set(current);
      next.delete(sectionId);
      return next;
    });
    setExpandedSectionPropertyIds((current) => removeSectionPropertiesState(current, sectionId));
    setExpandedSectionNumberingIds((current) => {
      const next = new Set(current);
      next.delete(sectionId);
      return next;
    });

    if (sectionId === selectedSectionId) {
      setSelectedSectionId(nextSelection);
      setSelectedQuestionId(null);
      setExpandedQuestionId(null);

      if (nextSelection) {
        requestEditorScroll({ kind: 'section', sectionId: nextSelection });
      }
    }
  }

  function deleteSelectedSection(): void {
    if (selectedSection) {
      deleteSection(selectedSection.id);
    }
  }

  function addQuestion(type: QuestionType): void {
    const question = createQuestionWithPreferredScoreMode(type, preferredScoreMode);
    pendingQuestionStemFocusRef.current = {
      questionId: question.id,
      selection: getNewQuestionStemSelection(question),
    };

    if (!selectedSection) {
      const section = createDefaultSection(createId, getSectionKindForQuestionType(type));
      updateDocument((current) =>
        addQuestionToDocument(addSectionToDocument(current, section), section.id, question),
      );
      setSelectedSectionId(section.id);
      setSelectedQuestionId(question.id);
      setExpandedQuestionId(question.id);
      setExpandedSectionPropertyIds((current) => removeSectionPropertiesState(current, section.id));
      requestEditorScroll({ kind: 'question', sectionId: section.id, questionId: question.id });
      return;
    }

    updateDocument((current) => addQuestionToDocument(current, selectedSection.id, question));
    setSelectedQuestionId(question.id);
    setExpandedQuestionId(question.id);
    setExpandedSectionPropertyIds((current) =>
      removeSectionPropertiesState(current, selectedSection.id),
    );
    requestEditorScroll({
      kind: 'question',
      sectionId: selectedSection.id,
      questionId: question.id,
    });
  }

  function updateQuestion(
    sectionId: string,
    questionId: string,
    updater: (question: ExamQuestion) => ExamQuestion,
  ): void {
    updateDocument((current) => updateQuestionInDocument(current, sectionId, questionId, updater));
  }

  function toggleQuestionEditor(questionId: string): void {
    setSelectedQuestionId(questionId);
    if (selectedSection) {
      setExpandedSectionPropertyIds((current) =>
        removeSectionPropertiesState(current, selectedSection.id),
      );
    }
    setExpandedQuestionId((current) => toggleExpandedQuestionId(current, questionId));
  }

  function changeQuestionEditorTab(question: ExamQuestion, tabId: QuestionEditorTabId): void {
    setActiveQuestionTabById((current) => setQuestionEditorTab(current, question, tabId));
  }

  function moveQuestion(questionId: string, direction: 'up' | 'down'): void {
    if (!selectedSection) return;

    updateDocument((current) =>
      moveQuestionInDocument(current, selectedSection.id, questionId, direction),
    );
    requestEditorScroll({
      kind: 'question',
      sectionId: selectedSection.id,
      questionId,
    });
  }

  function duplicateQuestion(questionId: string): void {
    if (!document || !selectedSection) return;

    const result = duplicateQuestionWithResult(document, selectedSection.id, questionId, createId);

    if (!result.duplicatedQuestionId) return;

    updateDocument(() => result.document);
    setSelectedQuestionId(result.duplicatedQuestionId);
    setExpandedQuestionId(result.duplicatedQuestionId);
    setExpandedSectionPropertyIds((current) =>
      removeSectionPropertiesState(current, selectedSection.id),
    );
    requestEditorScroll({
      kind: 'question',
      sectionId: selectedSection.id,
      questionId: result.duplicatedQuestionId,
    });
  }

  function deleteQuestion(questionId: string): void {
    if (!document || !selectedSection) return;

    const nextQuestionId = resolveQuestionSelectionAfterDelete(selectedSection, questionId);
    updateDocument((current) =>
      removeQuestionFromDocument(current, selectedSection.id, questionId),
    );
    setActiveQuestionTabById((current) => removeQuestionEditorTabState(current, questionId));

    if (selectedQuestionId === questionId || expandedQuestionId === questionId) {
      setSelectedQuestionId(nextQuestionId);
      setExpandedQuestionId(nextQuestionId);

      if (nextQuestionId) {
        requestEditorScroll({
          kind: 'question',
          sectionId: selectedSection.id,
          questionId: nextQuestionId,
        });
      } else {
        requestEditorScroll({ kind: 'section', sectionId: selectedSection.id });
      }
    }
  }

  function renderDocumentSettingsPanel(currentDocument: ExamDocument): ReactNode {
    return (
      <div className="document-settings-panel">
        <div className="left-workbench-mode-sticky">
          <div className="pane-heading document-settings-heading">
            <div className="pane-title">试卷设置</div>
            <TooltipAnchor text="收起左栏">
              <button
                type="button"
                className="icon-button pane-collapse-button"
                aria-label="收起左栏"
                onClick={() =>
                  isNarrowWorkspace ? closeNarrowWorkbench(true) : setPaneCollapsed('outline', true)
                }
              >
                <PanelLeftClose aria-hidden="true" size={16} />
              </button>
            </TooltipAnchor>
          </div>

          <div className="document-settings-groups" aria-label="试卷设置分组">
            {documentSettingsGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                className={
                  documentSettingsGroup === group.id ? 'document-settings-group-active' : ''
                }
                aria-pressed={documentSettingsGroup === group.id}
                onClick={() => setDocumentSettingsGroup(group.id)}
              >
                {group.label}
              </button>
            ))}
          </div>
        </div>

        <div className="document-settings-content">
          {documentSettingsGroup === 'basic' ? (
            <div className="document-settings-form">
              <section className="document-settings-field-group">
                <h3>试卷标识</h3>
                <div className="field-hint">标题和科目默认参与卷首标题区显示。</div>
                <TextField
                  label="标题（默认显示）"
                  value={currentDocument.metadata.title}
                  draftTarget={{ kind: 'metadataText', field: 'title' }}
                  onDraftChange={setTextDraft}
                  onDraftEnd={clearTextDraft}
                  onChange={(value) => updateMetadata('title', value)}
                />
                <TextField
                  label="科目（默认显示）"
                  value={currentDocument.metadata.subject}
                  draftTarget={{ kind: 'metadataText', field: 'subject' }}
                  onDraftChange={setTextDraft}
                  onDraftEnd={clearTextDraft}
                  onChange={(value) => updateMetadata('subject', value)}
                />
              </section>
              <section className="document-settings-field-group">
                <h3>考试安排</h3>
                <TextField
                  label="年级"
                  value={currentDocument.metadata.grade ?? ''}
                  draftTarget={{ kind: 'metadataText', field: 'grade' }}
                  onDraftChange={setTextDraft}
                  onDraftEnd={clearTextDraft}
                  onChange={(value) => updateMetadata('grade', value)}
                />
                <TextField
                  label="学期"
                  value={currentDocument.metadata.semester ?? ''}
                  draftTarget={{ kind: 'metadataText', field: 'semester' }}
                  onDraftChange={setTextDraft}
                  onDraftEnd={clearTextDraft}
                  onChange={(value) => updateMetadata('semester', value)}
                />
                <NumberField
                  label="考试时长（分钟）"
                  value={currentDocument.metadata.durationMinutes}
                  onChange={(value) => updateMetadataNumber('durationMinutes', value)}
                  onDraftChange={(value) =>
                    setEditorPreviewDraft((current) =>
                      setNumberPreviewDraft(current, {
                        target: { kind: 'metadata', field: 'durationMinutes' },
                        value,
                      }),
                    )
                  }
                  onDraftEnd={() =>
                    setEditorPreviewDraft((current) =>
                      clearNumberPreviewDraft(current, {
                        kind: 'metadata',
                        field: 'durationMinutes',
                      }),
                    )
                  }
                  onInvalidInput={showInputWarning}
                />
                <NumberField
                  label="标注总分"
                  value={currentDocument.metadata.totalPoints}
                  onChange={(value) => updateMetadataNumber('totalPoints', value)}
                  onDraftChange={(value) =>
                    setEditorPreviewDraft((current) =>
                      setNumberPreviewDraft(current, {
                        target: { kind: 'metadata', field: 'totalPoints' },
                        value,
                      }),
                    )
                  }
                  onDraftEnd={() =>
                    setEditorPreviewDraft((current) =>
                      clearNumberPreviewDraft(current, {
                        kind: 'metadata',
                        field: 'totalPoints',
                      }),
                    )
                  }
                  onInvalidInput={showInputWarning}
                />
                {totalPointsMismatch ? (
                  <div className="metadata-warning">
                    标注总分为 {totalPointsMismatch.configured} 分，当前题目合计为{' '}
                    {totalPointsMismatch.calculated} 分。
                  </div>
                ) : null}
              </section>
              <section className="document-settings-field-group">
                <h3>归档信息</h3>
                <TextField
                  label="作者"
                  value={currentDocument.metadata.author ?? ''}
                  draftTarget={{ kind: 'metadataText', field: 'author' }}
                  onDraftChange={setTextDraft}
                  onDraftEnd={clearTextDraft}
                  onChange={(value) => updateMetadata('author', value)}
                />
                <TextField
                  label="备注"
                  value={currentDocument.metadata.notes ?? ''}
                  draftTarget={{ kind: 'metadataText', field: 'notes' }}
                  onDraftChange={setTextDraft}
                  onDraftEnd={clearTextDraft}
                  onChange={(value) => updateMetadata('notes', value)}
                />
              </section>
            </div>
          ) : null}

          {documentSettingsGroup === 'frontMatter' ? (
            <div className="document-settings-subsections">
              <CollapsibleEditorSubsection
                title="卷首显示"
                summary="标题区、绝密标记和警告语"
                collapsed={frontMatterEditorCollapsed.display}
                onToggle={() => toggleFrontMatterEditorPanel('display')}
              >
                <div className="document-settings-form">
                  <label className="field checkbox-field">
                    <span>标题区</span>
                    <span className="checkbox-control">
                      <input
                        type="checkbox"
                        checked={currentDocument.frontMatter.showTitleBlock ?? true}
                        onChange={(event) => updateFrontMatterShowTitleBlock(event.target.checked)}
                      />
                      <span>显示标题和科目</span>
                    </span>
                  </label>
                  <label className="field checkbox-field">
                    <span>卷首标记</span>
                    <span className="checkbox-control">
                      <input
                        type="checkbox"
                        checked={currentDocument.frontMatter.secret ?? false}
                        onChange={(event) => updateFrontMatterSecret(event.target.checked)}
                      />
                      <span>绝密启用前</span>
                    </span>
                  </label>
                  <TextField
                    label="警告语"
                    value={currentDocument.frontMatter.warning ?? ''}
                    draftTarget={{ kind: 'frontMatterWarning' }}
                    onDraftChange={setTextDraft}
                    onDraftEnd={clearTextDraft}
                    onChange={updateFrontMatterWarning}
                  />
                  {(currentDocument.frontMatter.showTitleBlock ?? true) === false &&
                  currentDocument.frontMatter.informationPlacement === 'belowSubject' ? (
                    <div className="metadata-warning">
                      标题区隐藏时，科目下方信息栏会按卷首顶端导出。
                    </div>
                  ) : null}
                </div>
              </CollapsibleEditorSubsection>

              <CollapsibleEditorSubsection
                title="个人信息栏"
                summary={`${currentDocument.frontMatter.informationFields.length} 个字段`}
                collapsed={frontMatterEditorCollapsed.information}
                onToggle={() => toggleFrontMatterEditorPanel('information')}
              >
                <InformationFieldsEditor
                  fields={currentDocument.frontMatter.informationFields}
                  placement={currentDocument.frontMatter.informationPlacement ?? 'top'}
                  separator={currentDocument.frontMatter.informationSeparator}
                  onInputWarning={showInputWarning}
                  onLabelDraftChange={setTextDraft}
                  onLabelDraftEnd={clearTextDraft}
                  onChange={updateFrontMatterInformationFields}
                  onPlacementChange={updateFrontMatterInformationPlacement}
                  onSeparatorChange={updateFrontMatterInformationSeparator}
                />
              </CollapsibleEditorSubsection>

              <CollapsibleEditorSubsection
                title="注意事项"
                summary={`${currentDocument.frontMatter.notices.length} 条`}
                collapsed={frontMatterEditorCollapsed.notices}
                onToggle={() => toggleFrontMatterEditorPanel('notices')}
              >
                <NoticeListEditor
                  notices={currentDocument.frontMatter.notices}
                  contentWarnings={contentWarnings}
                  onSetWarning={setContentWarning}
                  onPreviewChange={(noticeIndex, blocks) =>
                    setEditorPreviewDraft((current) =>
                      setNoticePreviewDraft(current, { index: noticeIndex, blocks }),
                    )
                  }
                  onPreviewEnd={() => setEditorPreviewDraft(clearNoticePreviewDraft)}
                  onChange={updateFrontMatterNotices}
                />
              </CollapsibleEditorSubsection>

              <CollapsibleEditorSubsection
                title="高级卷首排版"
                summary="标题、信息栏、警告语和注意事项间距"
                collapsed={frontMatterEditorCollapsed.advanced}
                onToggle={() => toggleFrontMatterEditorPanel('advanced')}
              >
                <HeaderAdvancedOptionsEditor
                  examZhOptions={currentDocument.setup.examZhOptions}
                  informationSpacing={currentDocument.frontMatter.informationSpacing}
                  warningSpacing={currentDocument.frontMatter.warningSpacing}
                  onChange={updateSetupExamZhOptions}
                  onInformationSpacingChange={(spacing) =>
                    updateFrontMatterSpacing('informationSpacing', spacing)
                  }
                  onWarningSpacingChange={(spacing) =>
                    updateFrontMatterSpacing('warningSpacing', spacing)
                  }
                  onInputWarning={showInputWarning}
                />
              </CollapsibleEditorSubsection>
            </div>
          ) : null}

          {documentSettingsGroup === 'questionDefaults' ? (
            <div className="document-settings-question-defaults">
              <GlobalChoiceLayoutSection
                key={currentDocument.documentId}
                document={currentDocument}
                defaultCollapsed={false}
                onChange={updateDocument}
                onAnswerColorChange={(color) =>
                  updateSetupExamZhOptions({
                    'paren/text-color': color === 'red' ? 'red' : undefined,
                  })
                }
              />
              <GlobalFillinLayoutSection
                key={`fillin-${currentDocument.documentId}`}
                document={currentDocument}
                defaultCollapsed
                onChange={updateDocument}
                onInputWarning={showInputWarning}
              />
              <GlobalJudgementSettingsSection
                key={`judgement-${currentDocument.documentId}`}
                document={currentDocument}
                defaultCollapsed
                onChange={updateDocument}
              />
            </div>
          ) : null}

          {documentSettingsGroup === 'pageOutput' ? (
            <PageOutputSettings
              document={currentDocument}
              onChange={(document) => updateDocument(() => document)}
              onInputWarning={showInputWarning}
              compilerPreference={compilerPreference}
              compilerCapabilities={compilerCapabilities}
              compilerDetecting={compilerDetecting}
              onCompilerPreferenceChange={updateCompilerPreference}
              onRefreshCompilerCapabilities={() => void refreshCompilerCapabilities()}
            />
          ) : null}
        </div>
      </div>
    );
  }

  function setContentWarning(key: string, warning: string | null): void {
    setContentWarnings((current) => {
      const next = { ...current };

      if (warning) {
        next[key] = warning;
      } else {
        delete next[key];
      }

      return next;
    });
  }

  const statusText =
    saveState === 'clean' && !filePath
      ? '未保存到本地'
      : {
          clean: '已保存',
          dirty: '未保存',
          saving: '保存中',
          error: '需要处理',
        }[saveState];
  const pdfStatusText = {
    idle: 'PDF 未生成',
    compiling: 'PDF 生成中',
    success: 'PDF 已生成',
    error: 'PDF 需要处理',
    canceled: 'PDF 已取消',
  }[pdfState];
  const workspaceClassName = [
    'workspace',
    outlineCollapsed ? 'workspace-outline-collapsed' : '',
    previewCollapsed ? 'workspace-preview-collapsed' : '',
    activeNarrowPane ? `workspace-narrow-${activeNarrowPane}-active` : '',
    previewFocused ? 'workspace-preview-focused' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const effectivePaneWidths = useMemo(() => {
    const requestedWidths = resizeDraftWidths ?? { outlineWidth, previewWidth };

    return calculateEffectivePaneWidths({
      workspaceWidth,
      outlineWidth: requestedWidths.outlineWidth,
      previewWidth: requestedWidths.previewWidth,
      outlineCollapsed,
      previewCollapsed,
      priorityPane: paneWidthPriority,
    });
  }, [
    outlineCollapsed,
    outlineWidth,
    paneWidthPriority,
    previewCollapsed,
    previewWidth,
    resizeDraftWidths,
    workspaceWidth,
  ]);
  const workspaceStyle = {
    '--editor-pane-min-width': `${editorPaneMinWidth}px`,
    '--outline-pane-width': `${effectivePaneWidths.outlineWidth}px`,
    '--preview-pane-width': `${effectivePaneWidths.previewWidth}px`,
  } as CSSProperties;
  const fullSignature = formatAppSignature(environment, 'full');
  const compactSignature = formatAppSignature(environment, 'compact');

  return (
    <MathSnippetRecentContext.Provider value={snippetRecentContextValue}>
      <EditorPreviewDraftContext.Provider value={editorPreviewDraftContextValue}>
        <div className="app-shell" data-appearance={appearance}>
          <header className="toolbar">
            <div className="toolbar-brand-group">
              <div className="brand">
                <FileText aria-hidden="true" size={20} />
                <span>exam-zh GUI</span>
              </div>
              <label className="appearance-picker" title="应用主题">
                <Palette aria-hidden="true" size={16} />
                <select
                  aria-label="应用主题"
                  value={appearance}
                  onChange={(event) => updateAppearance(event.target.value as AppAppearance)}
                >
                  <option value="paper">柔和纸面</option>
                  <option value="clear">清晰工作台</option>
                </select>
              </label>
            </div>
            <div className="toolbar-actions" aria-label="文档命令">
              <div className="toolbar-command-group">
                <TooltipAnchor
                  text="新建"
                  className="toolbar-tooltip-anchor"
                  disabled={!isNarrowWorkspace}
                >
                  <button
                    type="button"
                    className="tool-button"
                    aria-label="新建"
                    onClick={() => void createBlankDocument()}
                  >
                    <FilePlus2 aria-hidden="true" size={17} />
                    <span>新建</span>
                  </button>
                </TooltipAnchor>
                <TemplatePicker compact={isNarrowWorkspace} onSelect={createDocumentFromTemplate} />
                <TooltipAnchor
                  text="打开"
                  className="toolbar-tooltip-anchor"
                  disabled={!isNarrowWorkspace}
                >
                  <button
                    type="button"
                    className="tool-button"
                    aria-label="打开"
                    onClick={() => void openDocument()}
                  >
                    <FolderOpen aria-hidden="true" size={17} />
                    <span>打开</span>
                  </button>
                </TooltipAnchor>
              </div>
              <div className="toolbar-command-group">
                <TooltipAnchor
                  text="保存"
                  className="toolbar-tooltip-anchor"
                  disabled={!isNarrowWorkspace}
                >
                  <button
                    type="button"
                    className={`tool-button ${saveState === 'dirty' ? 'tool-button-attention' : ''}`}
                    aria-label="保存"
                    onClick={() => void saveDocument()}
                  >
                    <Save aria-hidden="true" size={17} />
                    <span>保存</span>
                  </button>
                </TooltipAnchor>
                <TooltipAnchor
                  text="另存"
                  className="toolbar-tooltip-anchor"
                  disabled={!isNarrowWorkspace}
                >
                  <button
                    type="button"
                    className="tool-button"
                    aria-label="另存"
                    onClick={() => void saveDocumentAs()}
                  >
                    <SaveAll aria-hidden="true" size={17} />
                    <span>另存</span>
                  </button>
                </TooltipAnchor>
              </div>
              <div className="toolbar-command-group">
                <TooltipAnchor
                  text="导出 .tex"
                  className="toolbar-tooltip-anchor"
                  disabled={!isNarrowWorkspace}
                >
                  <button
                    type="button"
                    className="tool-button"
                    aria-label="导出 .tex"
                    disabled={!document || exportState === 'exporting'}
                    onClick={() => void exportTex()}
                  >
                    <FileCode2 aria-hidden="true" size={17} />
                    <span>导出 .tex</span>
                  </button>
                </TooltipAnchor>
                <PdfExportMenu
                  disabled={!document}
                  compact={isNarrowWorkspace}
                  defaultVariant={document?.setup.answerMode ?? 'student'}
                  compilerSummary={resolvePreferredProviderLabel(
                    compilerPreference,
                    compilerCapabilities,
                  )}
                  session={pdfSession}
                  selectedVariant={pdfResult?.variant}
                  onExport={(variants) => void exportPdf(variants)}
                  onPreview={previewPdfArtifact}
                  onInspect={inspectPdfArtifact}
                  onReveal={(artifact) => void revealPdfArtifact(artifact)}
                  onRetry={(variant) => void exportPdf([variant], true)}
                  onClearSession={resetPdfState}
                />
              </div>
            </div>
          </header>

          <main ref={workspaceRef} className={workspaceClassName} style={workspaceStyle}>
            <aside
              ref={outlinePaneRef}
              className={`outline-pane ${outlineCollapsed ? 'pane-collapsed' : ''}`}
              aria-label="试卷工作台"
            >
              <div className="left-workbench-rail" aria-label="展开试卷工作台">
                <TooltipAnchor text="展开试卷导航" className="left-workbench-rail-tooltip">
                  <button
                    type="button"
                    aria-label="展开试卷导航"
                    aria-expanded={
                      isNarrowWorkspace ? activeNarrowPane === 'outline' : !outlineCollapsed
                    }
                    aria-controls="outline-workbench"
                    onClick={(event) =>
                      openLeftWorkbench('navigation', {
                        opener: event.currentTarget,
                        focusSelectedTab: true,
                      })
                    }
                  >
                    <ListTree aria-hidden="true" size={17} />
                    <span>导航</span>
                  </button>
                </TooltipAnchor>
                <TooltipAnchor text="展开试卷设置" className="left-workbench-rail-tooltip">
                  <button
                    type="button"
                    aria-label="展开试卷设置"
                    aria-expanded={
                      isNarrowWorkspace ? activeNarrowPane === 'outline' : !outlineCollapsed
                    }
                    aria-controls="outline-workbench"
                    onClick={(event) =>
                      openLeftWorkbench('settings', {
                        opener: event.currentTarget,
                        focusSelectedTab: true,
                      })
                    }
                  >
                    <Settings2 aria-hidden="true" size={17} />
                    <span>设置</span>
                  </button>
                </TooltipAnchor>
              </div>
              <div id="outline-workbench" className="pane-content">
                <div className="left-workbench-tabs" role="tablist" aria-label="左栏模式">
                  <button
                    id="left-workbench-navigation-tab"
                    type="button"
                    role="tab"
                    aria-selected={leftWorkbenchMode === 'navigation'}
                    aria-controls="left-workbench-navigation-panel"
                    onClick={() => switchLeftWorkbenchMode('navigation')}
                  >
                    <ListTree aria-hidden="true" size={15} />
                    <span>导航</span>
                  </button>
                  <button
                    id="left-workbench-settings-tab"
                    type="button"
                    role="tab"
                    aria-selected={leftWorkbenchMode === 'settings'}
                    aria-controls="left-workbench-settings-panel"
                    onClick={() => switchLeftWorkbenchMode('settings')}
                  >
                    <Settings2 aria-hidden="true" size={15} />
                    <span>设置</span>
                  </button>
                </div>
                {leftWorkbenchMode === 'navigation' ? (
                  <div
                    id="left-workbench-navigation-panel"
                    role="tabpanel"
                    aria-labelledby="left-workbench-navigation-tab"
                  >
                    <OutlineNavigator
                      outline={outlineNavigation}
                      selectedSectionId={selectedSection?.id ?? null}
                      selectedQuestionId={activeSelectedQuestionId}
                      collapsedSectionIds={collapsedOutlineSectionIds}
                      onAddSection={() => addSection()}
                      onInsertSection={(index) => insertSectionAt(index)}
                      onMoveSection={moveOutlineSection}
                      onDuplicateSection={duplicateOutlineSection}
                      onDeleteSection={deleteSection}
                      onToggleSection={(sectionId) =>
                        setCollapsedOutlineSectionIds((current) =>
                          toggleCollapsedSectionId(current, sectionId),
                        )
                      }
                      onCollapse={() =>
                        isNarrowWorkspace
                          ? closeNarrowWorkbench(true)
                          : setPaneCollapsed('outline', true)
                      }
                      onSelectSection={selectOutlineSection}
                      onSelectQuestion={selectOutlineQuestion}
                    />
                  </div>
                ) : (
                  <div
                    id="left-workbench-settings-panel"
                    role="tabpanel"
                    aria-labelledby="left-workbench-settings-tab"
                  >
                    {document ? renderDocumentSettingsPanel(document) : null}
                  </div>
                )}
              </div>
            </aside>

            <section className="editor-pane" aria-label="编辑区">
              {document ? (
                <section className="editor-section">
                  {selectedSection ? (
                    <SectionEditor
                      document={document}
                      section={selectedSection}
                      previewSection={selectedPreviewSection}
                      sectionIndex={document.sections.findIndex(
                        (section) => section.id === selectedSection.id,
                      )}
                      selectedQuestionId={activeSelectedQuestionId}
                      expandedQuestionId={expandedQuestionId}
                      activeQuestionTabById={activeQuestionTabById}
                      sectionPropertiesExpanded={isSectionPropertiesExpanded(
                        expandedSectionPropertyIds,
                        selectedSection.id,
                      )}
                      onToggleSectionProperties={() => {
                        selectOutlineSection(selectedSection.id);
                        setExpandedSectionPropertyIds((current) =>
                          toggleSectionProperties(current, selectedSection.id),
                        );
                      }}
                      numberingCollapsed={!expandedSectionNumberingIds.has(selectedSection.id)}
                      onToggleNumbering={() =>
                        setExpandedSectionNumberingIds((current) => {
                          const next = new Set(current);

                          if (next.has(selectedSection.id)) {
                            next.delete(selectedSection.id);
                          } else {
                            next.add(selectedSection.id);
                          }

                          return next;
                        })
                      }
                      totalSections={document.sections.length}
                      sectionRef={(element) => {
                        if (element) {
                          sectionElementRefs.current.set(selectedSection.id, element);
                        } else {
                          sectionElementRefs.current.delete(selectedSection.id);
                        }
                      }}
                      sectionTitleRef={(element) => {
                        if (element) {
                          sectionTitleInputRefs.current.set(selectedSection.id, element);
                        } else {
                          sectionTitleInputRefs.current.delete(selectedSection.id);
                        }
                      }}
                      questionRef={(questionId, element) => {
                        if (element) {
                          questionElementRefs.current.set(questionId, element);
                        } else {
                          questionElementRefs.current.delete(questionId);
                        }
                      }}
                      questionStemRef={(questionId, element) => {
                        if (element) {
                          questionStemInputRefs.current.set(questionId, element);
                        } else {
                          questionStemInputRefs.current.delete(questionId);
                        }
                      }}
                      contentWarnings={contentWarnings}
                      onSetWarning={setContentWarning}
                      onInputWarning={showInputWarning}
                      onTeacherContentConverted={(message) =>
                        showNotification('success', '已整理解析标记', message)
                      }
                      onSetNumberDraft={(target, value) =>
                        setEditorPreviewDraft((current) =>
                          setNumberPreviewDraft(current, { target, value }),
                        )
                      }
                      onClearNumberDraft={(target) =>
                        setEditorPreviewDraft((current) => clearNumberPreviewDraft(current, target))
                      }
                      onSetTextDraft={setTextDraft}
                      onClearTextDraft={clearTextDraft}
                      preferredScoreMode={preferredScoreMode}
                      onPreferredScoreModeChange={updatePreferredScoreMode}
                      onUpdateSection={updateSelectedSection}
                      onMoveSection={(direction) =>
                        moveOutlineSection(selectedSection.id, direction)
                      }
                      onInsertSection={(position) => {
                        const sectionIndex = document.sections.findIndex(
                          (section) => section.id === selectedSection.id,
                        );
                        insertSectionAt(sectionIndex + (position === 'below' ? 1 : 0));
                      }}
                      onDuplicateSection={() => duplicateOutlineSection(selectedSection.id)}
                      onDeleteSection={deleteSelectedSection}
                      onDeleteSectionFocus={() => {
                        const targetId = getRepeatableDeleteFocusTarget(
                          document.sections.map((section) => section.id),
                          selectedSection.id,
                        );
                        const target = targetId ? sectionElementRefs.current.get(targetId) : null;
                        const disclosure =
                          target?.querySelector<HTMLButtonElement>('.editor-object-header-main') ??
                          workspaceRef.current?.querySelector<HTMLButtonElement>(
                            '.editor-pane .editor-object-header-main, .editor-empty-document button',
                          );
                        disclosure?.focus();
                      }}
                      onAddQuestion={addQuestion}
                      onToggleQuestion={toggleQuestionEditor}
                      onChangeQuestionTab={changeQuestionEditorTab}
                      onUpdateQuestion={updateQuestion}
                      onMoveQuestion={moveQuestion}
                      onDuplicateQuestion={duplicateQuestion}
                      onDeleteQuestion={deleteQuestion}
                    />
                  ) : (
                    <div className="editor-empty-document">
                      <div className="editor-empty-title">暂无试卷节</div>
                      <div className="field-hint">先建立试卷结构，再开始编写题目。</div>
                      <button type="button" className="tool-button" onClick={() => addSection()}>
                        <Plus aria-hidden="true" size={16} />
                        <span>添加第一个试卷节</span>
                      </button>
                    </div>
                  )}
                </section>
              ) : null}
            </section>

            <aside
              ref={previewPaneRef}
              className={`preview-pane ${previewCollapsed ? 'pane-collapsed' : ''}`}
              aria-label="预览与检查工作台"
            >
              <div className="right-workbench-rail" aria-label="展开预览与检查工作台">
                <TooltipAnchor text="展开预览" className="right-workbench-rail-tooltip">
                  <button
                    type="button"
                    aria-label="展开预览"
                    aria-expanded={
                      isNarrowWorkspace ? activeNarrowPane === 'preview' : !previewCollapsed
                    }
                    aria-controls="preview-workbench"
                    onClick={(event) =>
                      openRightWorkbench('preview', {
                        opener: event.currentTarget,
                        focusSelectedTab: true,
                      })
                    }
                  >
                    <Eye aria-hidden="true" size={17} />
                    <span>预览</span>
                  </button>
                </TooltipAnchor>
                <TooltipAnchor text="展开检查" className="right-workbench-rail-tooltip">
                  <button
                    type="button"
                    aria-label="展开检查"
                    aria-expanded={
                      isNarrowWorkspace ? activeNarrowPane === 'preview' : !previewCollapsed
                    }
                    aria-controls="preview-workbench"
                    onClick={(event) =>
                      openRightWorkbench('check', {
                        opener: event.currentTarget,
                        focusSelectedTab: true,
                      })
                    }
                  >
                    <SearchCheck aria-hidden="true" size={17} />
                    <span>检查</span>
                  </button>
                </TooltipAnchor>
              </div>
              <div id="preview-workbench" className="pane-content">
                <RightWorkbench
                  scrollRef={rightWorkbenchScrollRef}
                  document={previewDocument}
                  mode={rightWorkbenchMode}
                  documentChecks={documentCheckItems}
                  documentCheckPending={documentCheckPending}
                  pdfSession={pdfSession}
                  pdfResult={pdfResult}
                  successfulPdfArtifacts={successfulPdfArtifacts}
                  pdfSessionIssueCount={pdfSessionIssueCount}
                  pdfRenderErrors={pdfRenderErrors}
                  previewMode={previewMode}
                  previewFocused={previewFocused}
                  onModeChange={switchRightWorkbenchMode}
                  onPreviewModeChange={switchPreviewMode}
                  onSelectPdfArtifact={previewPdfArtifact}
                  onSelectCheckArtifact={setPdfResult}
                  onOpenChecks={() => openRightWorkbench('check')}
                  onLocateCheck={locateDocumentCheck}
                  onRevealPdf={(artifact) => void revealPdfArtifact(artifact)}
                  onRetryPdf={(variant) => void exportPdf([variant], true)}
                  onPdfRenderErrorChange={updatePdfRenderError}
                  onTogglePreviewFocus={togglePreviewFocus}
                  onCollapse={() =>
                    isNarrowWorkspace
                      ? closeNarrowWorkbench(true)
                      : setPaneCollapsed('preview', true)
                  }
                />
              </div>
            </aside>

            {!isNarrowWorkspace && !previewFocused && !outlineCollapsed ? (
              <div
                className="pane-resize-handle pane-resize-handle-outline"
                role="separator"
                aria-orientation="vertical"
                aria-label="调整大纲宽度"
                onPointerDown={(event) => startPaneResize('outline', event)}
              />
            ) : null}
            {!isNarrowWorkspace && !previewFocused && !previewCollapsed ? (
              <div
                className="pane-resize-handle pane-resize-handle-preview"
                role="separator"
                aria-orientation="vertical"
                aria-label="调整预览宽度"
                onPointerDown={(event) => startPaneResize('preview', event)}
              />
            ) : null}
          </main>

          <footer className="status-bar">
            <div className="status-group status-group-main">
              <span>{filePath ?? '未选择文件'}</span>
              <span>{statusText}</span>
              <span className={`export-status export-status-${exportState}`}>{exportMessage}</span>
              <span className={`pdf-status pdf-status-${pdfState}`}>{pdfStatusText}</span>
            </div>
            <div className="status-group status-group-signature">
              {environment ? (
                <>
                  <span
                    className="status-signature status-signature-full"
                    aria-label={fullSignature}
                  >
                    exam-zh GUI · 制作：朱孝诚 · GitHub:{' '}
                    <button
                      type="button"
                      className="status-link-button"
                      onClick={() => void openExternalLink('authorGitHub')}
                    >
                      Driver066
                    </button>{' '}
                    · Electron {environment.versions.electron}
                  </span>
                  <span
                    className="status-signature status-signature-compact"
                    aria-label={compactSignature}
                  >
                    朱孝诚 ·{' '}
                    <button
                      type="button"
                      className="status-link-button"
                      onClick={() => void openExternalLink('authorGitHub')}
                    >
                      Driver066
                    </button>
                  </span>
                </>
              ) : (
                <span className="status-signature">{fullSignature}</span>
              )}
              <button
                type="button"
                className="status-feedback-button"
                onClick={() => void openExternalLink('projectIssues')}
              >
                反馈
              </button>
            </div>
          </footer>

          <NotificationStack notifications={notifications} onDismiss={dismissNotification} />
        </div>
      </EditorPreviewDraftContext.Provider>
    </MathSnippetRecentContext.Provider>
  );
}

interface NotificationStackProps {
  notifications: ToastNotification[];
  onDismiss(id: string): void;
}

function NotificationStack({ notifications, onDismiss }: NotificationStackProps) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-stack" role="status" aria-live="polite">
      {notifications.map((notification) => (
        <div key={notification.id} className={`toast toast-${notification.kind}`}>
          <div className="toast-content">
            <div className="toast-title">{notification.title}</div>
            <div className="toast-message">{notification.message}</div>
          </div>
          <button
            type="button"
            className="toast-close"
            title="关闭通知"
            onClick={() => onDismiss(notification.id)}
          >
            <X aria-hidden="true" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function OutlineNavigator({
  outline,
  selectedSectionId,
  selectedQuestionId,
  collapsedSectionIds,
  onAddSection,
  onInsertSection,
  onMoveSection,
  onDuplicateSection,
  onDeleteSection,
  onToggleSection,
  onCollapse,
  onSelectSection,
  onSelectQuestion,
}: {
  outline: OutlineNavigationModel | null;
  selectedSectionId: string | null;
  selectedQuestionId: string | null;
  collapsedSectionIds: ReadonlySet<string>;
  onAddSection(): void;
  onInsertSection(index: number): void;
  onMoveSection(sectionId: string, direction: 'up' | 'down'): void;
  onDuplicateSection(sectionId: string): void;
  onDeleteSection(sectionId: string): void;
  onToggleSection(sectionId: string): void;
  onCollapse(): void;
  onSelectSection(sectionId: string): void;
  onSelectQuestion(sectionId: string, questionId: string): void;
}) {
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const addSectionButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="outline-navigator">
      <div className="left-workbench-mode-sticky">
        <div className="pane-heading">
          <div className="pane-title">试卷导航</div>
          <div className="pane-heading-actions">
            <TooltipAnchor text="在末尾添加试卷节">
              <button
                ref={addSectionButtonRef}
                type="button"
                className="icon-button"
                aria-label="在末尾添加试卷节"
                onClick={onAddSection}
              >
                <Plus aria-hidden="true" size={16} />
              </button>
            </TooltipAnchor>
            <TooltipAnchor text="收起左栏">
              <button
                type="button"
                className="icon-button pane-collapse-button"
                aria-label="收起左栏"
                onClick={onCollapse}
              >
                <PanelLeftClose aria-hidden="true" size={16} />
              </button>
            </TooltipAnchor>
          </div>
        </div>

        <div className="outline-document-stats" aria-label="试卷结构统计">
          <span>
            <strong>{outline?.stats.sectionCount ?? 0}</strong>
            <small>节</small>
          </span>
          <span>
            <strong>{outline?.stats.questionCount ?? 0}</strong>
            <small>题</small>
          </span>
          <span>
            <strong>{outline?.stats.totalPoints ?? 0}</strong>
            <small>分</small>
          </span>
        </div>
      </div>

      {!outline || outline.sections.length === 0 ? (
        <div className="outline-empty">
          <div className="muted">暂无试卷节</div>
          <button type="button" className="mini-button" onClick={onAddSection}>
            添加节
          </button>
        </div>
      ) : (
        <div className="outline-section-list">
          {outline.sections.map((section, sectionIndex) => {
            const sectionIsSelected = section.id === selectedSectionId;
            const sectionContainsSelectedQuestion = section.questions.some(
              (question) => question.id === selectedQuestionId,
            );
            const sectionIsCurrent = sectionIsSelected && !sectionContainsSelectedQuestion;
            const sectionIsContext = sectionIsSelected && sectionContainsSelectedQuestion;
            const collapsed = collapsedSectionIds.has(section.id);
            const availability = getSectionMenuAvailability(sectionIndex, outline.sections.length);

            return (
              <Fragment key={section.id}>
                <OutlineSectionInsert index={sectionIndex} onInsert={onInsertSection} />
                <section
                  ref={(element) => {
                    sectionRefs.current[section.id] = element;
                  }}
                  className="outline-section-group"
                >
                  <div
                    className={`outline-section-header ${
                      sectionIsCurrent ? 'outline-section-active' : ''
                    } ${sectionIsContext ? 'outline-section-context' : ''}`}
                  >
                    <button
                      type="button"
                      className="outline-section-toggle"
                      aria-label={collapsed ? `展开${section.title}` : `收起${section.title}`}
                      aria-expanded={!collapsed}
                      onClick={() => onToggleSection(section.id)}
                    >
                      <CollapseToggleIcon collapsed={collapsed} />
                    </button>
                    <button
                      type="button"
                      className="outline-section-button"
                      aria-current={sectionIsCurrent ? 'location' : undefined}
                      onClick={() => onSelectSection(section.id)}
                    >
                      <span className="outline-section-title">
                        <span className="outline-section-number">{section.numberLabel}</span>
                        <span>{section.title}</span>
                      </span>
                      <span className="outline-section-score">{section.scoreSummary}</span>
                    </button>
                    <SectionActionsMenu
                      sectionId={section.id}
                      canMoveUp={availability.canMoveUp}
                      canMoveDown={availability.canMoveDown}
                      onMove={(direction) => onMoveSection(section.id, direction)}
                      onInsert={(position) =>
                        onInsertSection(sectionIndex + (position === 'below' ? 1 : 0))
                      }
                      onDuplicate={() => onDuplicateSection(section.id)}
                      onDelete={() => onDeleteSection(section.id)}
                      onDeleteFocus={() => {
                        const targetId = getRepeatableDeleteFocusTarget(
                          outline.sections.map((item) => item.id),
                          section.id,
                        );
                        const target = targetId ? sectionRefs.current[targetId] : null;
                        const disclosure =
                          target?.querySelector<HTMLButtonElement>('.outline-section-toggle');
                        if (disclosure) disclosure.focus();
                        else addSectionButtonRef.current?.focus();
                      }}
                    />
                  </div>
                  {!collapsed && section.questions.length > 0 ? (
                    <ol className="outline-question-list">
                      {section.questions.map((question) => (
                        <li key={question.id}>
                          <OutlineQuestionButton
                            question={question}
                            active={question.id === selectedQuestionId}
                            onClick={() => onSelectQuestion(section.id, question.id)}
                          />
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </section>
              </Fragment>
            );
          })}
          <OutlineSectionInsert index={outline.sections.length} onInsert={onInsertSection} />
        </div>
      )}
    </div>
  );
}

function OutlineSectionInsert({
  index,
  onInsert,
}: {
  index: number;
  onInsert(index: number): void;
}) {
  return (
    <div className="outline-section-insert">
      <TooltipAnchor text="在此处插入试卷节" className="outline-section-insert-tooltip">
        <button type="button" aria-label="在此处插入试卷节" onClick={() => onInsert(index)}>
          <Plus aria-hidden="true" size={13} />
        </button>
      </TooltipAnchor>
    </div>
  );
}

function OutlineQuestionButton({
  question,
  active,
  onClick,
}: {
  question: OutlineQuestionItem;
  active: boolean;
  onClick(): void;
}) {
  const badges = getVisibleOutlineBadges(question.badges);

  return (
    <button
      type="button"
      className={`outline-question-button ${active ? 'outline-question-active' : ''}`}
      aria-current={active ? 'location' : undefined}
      onClick={onClick}
    >
      <span className="outline-question-main">
        <span className="outline-question-number">{question.number}.</span>
        <span className="outline-question-type">{question.typeLabel}</span>
        <span className="outline-question-points">{question.pointsLabel}</span>
      </span>
      {question.detailLabels.length > 0 || question.badges.length > 0 ? (
        <span className="outline-question-meta">
          {question.detailLabels.map((label) => (
            <span key={label} className="outline-detail">
              {label}
            </span>
          ))}
          {badges.visible.map((badge) => (
            <span key={badge.label} className={`outline-badge outline-badge-${badge.tone}`}>
              {badge.label}
            </span>
          ))}
          {badges.hiddenCount > 0 ? (
            <span className="outline-badge outline-badge-info">+{badges.hiddenCount}</span>
          ) : null}
        </span>
      ) : null}
    </button>
  );
}

interface SectionEditorProps {
  document: ExamDocument;
  section: ExamSection;
  previewSection: ExamSection | null;
  sectionIndex: number;
  selectedQuestionId: string | null;
  expandedQuestionId: string | null;
  activeQuestionTabById: QuestionEditorTabState;
  sectionPropertiesExpanded: boolean;
  onToggleSectionProperties(): void;
  numberingCollapsed: boolean;
  onToggleNumbering(): void;
  totalSections: number;
  sectionRef(element: HTMLDivElement | null): void;
  sectionTitleRef(element: HTMLInputElement | null): void;
  questionRef(questionId: string, element: HTMLElement | null): void;
  questionStemRef(questionId: string, element: HTMLTextAreaElement | null): void;
  contentWarnings: Record<string, string>;
  onSetWarning(key: string, warning: string | null): void;
  onInputWarning(message: string): void;
  onTeacherContentConverted(message: string): void;
  onSetNumberDraft(target: NumberPreviewDraftTarget, value: string): void;
  onClearNumberDraft(target: NumberPreviewDraftTarget): void;
  onSetTextDraft(target: TextPreviewDraftTarget, value: string): void;
  onClearTextDraft(target: TextPreviewDraftTarget): void;
  preferredScoreMode: ScoreMode;
  onPreferredScoreModeChange(scoreMode: ScoreMode): void;
  onUpdateSection(updater: (section: ExamSection) => ExamSection): void;
  onMoveSection(direction: 'up' | 'down'): void;
  onInsertSection(position: 'above' | 'below'): void;
  onDuplicateSection(): void;
  onDeleteSection(): void;
  onDeleteSectionFocus(): void;
  onAddQuestion(type: QuestionType): void;
  onToggleQuestion(questionId: string): void;
  onChangeQuestionTab(question: ExamQuestion, tabId: QuestionEditorTabId): void;
  onUpdateQuestion(
    sectionId: string,
    questionId: string,
    updater: (question: ExamQuestion) => ExamQuestion,
  ): void;
  onMoveQuestion(questionId: string, direction: 'up' | 'down'): void;
  onDuplicateQuestion(questionId: string): void;
  onDeleteQuestion(questionId: string): void;
}

function SectionEditor(props: SectionEditorProps) {
  const {
    document,
    section,
    previewSection,
    sectionIndex,
    selectedQuestionId,
    expandedQuestionId,
    activeQuestionTabById,
    sectionPropertiesExpanded,
    onToggleSectionProperties,
    numberingCollapsed,
    onToggleNumbering,
    totalSections,
    sectionRef,
    sectionTitleRef,
    questionRef,
    questionStemRef,
    contentWarnings,
    onSetWarning,
    onInputWarning,
    onTeacherContentConverted,
    onSetNumberDraft,
    onClearNumberDraft,
    onSetTextDraft,
    onClearTextDraft,
    preferredScoreMode,
    onPreferredScoreModeChange,
    onUpdateSection,
    onMoveSection,
    onInsertSection,
    onDuplicateSection,
    onDeleteSection,
    onDeleteSectionFocus,
    onAddQuestion,
    onToggleQuestion,
    onChangeQuestionTab,
    onUpdateQuestion,
    onMoveQuestion,
    onDuplicateQuestion,
    onDeleteQuestion,
  } = props;
  const questionAddMode = getSectionQuestionAddMode(section.kind);
  const selectableSectionKinds = getSelectableSectionKinds(section);
  const sectionKindHint = getSectionKindHint(section, selectableSectionKinds);
  const displayedSectionKinds = teacherCreatableSectionKinds;
  const sectionForSummary = previewSection ?? section;
  const questionNumbers = resolveQuestionNumbers(document);
  const sectionTitleId = `section-editor-title-${section.id}`;
  const sectionPropertiesId = `section-properties-${section.id}`;
  const questionListRef = useRef<HTMLDivElement>(null);
  const localQuestionRefs = useRef<Record<string, HTMLElement | null>>({});

  return (
    <div ref={sectionRef} className="section-editor">
      <section className="section-object-card" aria-labelledby={sectionTitleId}>
        <EditorObjectHeader
          titleId={sectionTitleId}
          controlsId={sectionPropertiesId}
          title={getSectionEditorTitle(section, sectionIndex)}
          selected
          expanded={sectionPropertiesExpanded}
          summary={getSectionEditorSummary(sectionForSummary)}
          onToggle={onToggleSectionProperties}
          actions={
            <SectionActionsMenu
              sectionId={section.id}
              variant="editor"
              canMoveUp={sectionIndex > 0}
              canMoveDown={sectionIndex < totalSections - 1}
              onMove={onMoveSection}
              onInsert={onInsertSection}
              onDuplicate={onDuplicateSection}
              onDelete={onDeleteSection}
              onDeleteFocus={onDeleteSectionFocus}
            />
          }
        />

        <div
          id={sectionPropertiesId}
          className="section-properties-panel"
          hidden={!sectionPropertiesExpanded}
        >
          {sectionPropertiesExpanded ? (
            <>
              <div className="section-properties-group">
                <div className="section-properties-heading">节信息</div>
                <div className="section-main-fields">
                  <TextField
                    label="节标题"
                    value={section.title}
                    inputRef={sectionTitleRef}
                    draftTarget={{ kind: 'sectionTitle', sectionId: section.id }}
                    onDraftChange={onSetTextDraft}
                    onDraftEnd={onClearTextDraft}
                    onChange={(value) =>
                      onUpdateSection((current) => ({ ...current, title: value }))
                    }
                  />
                  <label className="field">
                    <span className="field-label-row">
                      <span>节类型</span>
                      {sectionKindHint ? <InlineHelp text={sectionKindHint} /> : null}
                    </span>
                    <select
                      value={section.kind}
                      onChange={(event) =>
                        onUpdateSection((current) => ({
                          ...current,
                          kind: event.target.value as ExamSectionKind,
                        }))
                      }
                    >
                      {displayedSectionKinds.map((value) => (
                        <option
                          key={value}
                          value={value}
                          disabled={!selectableSectionKinds.includes(value)}
                        >
                          {sectionKindLabels[value]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field section-summary-field">
                    <span className="field-label-row">
                      <span>标题摘要</span>
                      <InlineHelp text="控制导出 PDF 的节标题是否附带题数和分值统计；空节不会显示统计。" />
                    </span>
                    <select
                      value={section.summaryMode ?? 'hidden'}
                      onChange={(event) =>
                        onUpdateSection((current) => {
                          const summaryMode = event.target.value as NonNullable<
                            ExamSection['summaryMode']
                          >;
                          return {
                            ...current,
                            summaryMode: summaryMode === 'hidden' ? undefined : summaryMode,
                          };
                        })
                      }
                    >
                      <option value="hidden">隐藏统计</option>
                      <option value="questionCount">仅显示题数</option>
                      <option value="questionCountAndPoints">显示题数与分值</option>
                    </select>
                  </label>
                </div>
              </div>

              <CollapsibleEditorSubsection
                title="题号与编号"
                summary={formatSectionNumberingSummary(section)}
                collapsed={numberingCollapsed}
                onToggle={onToggleNumbering}
              >
                <SectionNumberingEditor
                  section={section}
                  onInputWarning={onInputWarning}
                  onChange={onUpdateSection}
                />
              </CollapsibleEditorSubsection>
            </>
          ) : null}
        </div>
      </section>

      <div ref={questionListRef} className="question-list">
        {section.questions.length === 0 ? (
          <div className="question-empty-state">
            <div className="question-empty-copy">
              <div className="question-empty-title">本节暂无题目</div>
              <div className="field-hint">添加第一题后会直接聚焦题干。</div>
            </div>
            <QuestionAddControl mode={questionAddMode} onAdd={onAddQuestion} />
          </div>
        ) : (
          <>
            {section.questions.map((question, questionIndex) => {
              const previewQuestion =
                previewSection?.questions.find((item) => item.id === question.id) ?? question;

              return (
                <QuestionCard
                  key={question.id}
                  document={document}
                  questionRef={(element) => {
                    localQuestionRefs.current[question.id] = element;
                    questionRef(question.id, element);
                  }}
                  sectionId={section.id}
                  question={question}
                  previewQuestion={previewQuestion}
                  questionIndex={questionIndex}
                  questionNumber={questionNumbers.get(question.id)?.number ?? questionIndex + 1}
                  totalQuestions={section.questions.length}
                  selected={selectedQuestionId === question.id}
                  expanded={expandedQuestionId === question.id}
                  activeTab={resolveQuestionEditorTab(activeQuestionTabById, question)}
                  onToggle={() => onToggleQuestion(question.id)}
                  onChangeTab={(tabId) => onChangeQuestionTab(question, tabId)}
                  stemRef={(element) => questionStemRef(question.id, element)}
                  contentWarnings={contentWarnings}
                  onSetWarning={onSetWarning}
                  onInputWarning={onInputWarning}
                  onTeacherContentConverted={onTeacherContentConverted}
                  onSetNumberDraft={onSetNumberDraft}
                  onClearNumberDraft={onClearNumberDraft}
                  preferredScoreMode={preferredScoreMode}
                  onPreferredScoreModeChange={onPreferredScoreModeChange}
                  onUpdateQuestion={onUpdateQuestion}
                  onMoveQuestion={onMoveQuestion}
                  onDuplicateQuestion={onDuplicateQuestion}
                  onDeleteQuestion={onDeleteQuestion}
                  onDeleteFocus={() => {
                    const targetId = getRepeatableDeleteFocusTarget(
                      section.questions.map((item) => item.id),
                      question.id,
                    );
                    const target = targetId ? localQuestionRefs.current[targetId] : null;
                    const disclosure = target?.querySelector<HTMLButtonElement>(
                      '.editor-object-header-main',
                    );
                    if (disclosure) disclosure.focus();
                    else {
                      questionListRef.current
                        ?.querySelector<HTMLButtonElement>(
                          '.question-add-row button, .question-empty-state button',
                        )
                        ?.focus();
                    }
                  }}
                />
              );
            })}
            <div className="question-add-row">
              <QuestionAddControl mode={questionAddMode} onAdd={onAddQuestion} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function QuestionAddControl({
  mode,
  onAdd,
}: {
  mode: ReturnType<typeof getSectionQuestionAddMode>;
  onAdd(type: QuestionType): void;
}) {
  if (mode.kind === 'menu') {
    return <QuestionAddMenu questionTypes={mode.questionTypes} onAdd={onAdd} />;
  }

  return (
    <button type="button" className="tool-button" onClick={() => onAdd(mode.questionType)}>
      <Plus aria-hidden="true" size={16} />
      <span>添加{questionTypeLabels[mode.questionType]}</span>
    </button>
  );
}

function SectionNumberingEditor({
  section,
  onInputWarning,
  onChange,
}: {
  section: ExamSection;
  onInputWarning(message: string): void;
  onChange(updater: (section: ExamSection) => ExamSection): void;
}) {
  const mode = getSectionNumberingMode(section.numbering);
  const currentLabel = getSectionQuestionLabel(section);
  const labelPreset = getQuestionLabelPreset(currentLabel);

  const updateMode = (nextMode: SectionNumberingMode) => {
    onChange((current) => {
      const numbering = { ...(current.numbering ?? {}) };

      if (nextMode === 'continue') {
        delete numbering.reset;
        delete numbering.start;
      } else if (nextMode === 'restart') {
        numbering.reset = true;
        delete numbering.start;
      } else {
        numbering.reset = true;
        numbering.start = current.numbering?.start ?? 1;
      }

      return withSectionNumbering(current, numbering);
    });
  };

  const updateLabelPreset = (preset: QuestionLabelPresetId) => {
    onChange((current) => {
      const numbering = { ...(current.numbering ?? {}) };
      const examZhOptions = { ...(numbering.examZhOptions ?? {}) };
      const value = getQuestionLabelPresetValue(preset);

      if (value === undefined) {
        delete examZhOptions.label;
      } else {
        examZhOptions.label = value;
      }

      if (Object.keys(examZhOptions).length === 0) {
        delete numbering.examZhOptions;
      } else {
        numbering.examZhOptions = examZhOptions;
      }

      return withSectionNumbering(current, numbering);
    });
  };

  return (
    <div className="section-numbering-grid">
      <label className="field">
        <span>编号方式</span>
        <select
          value={mode}
          onChange={(event) => updateMode(event.target.value as SectionNumberingMode)}
        >
          <option value="continue">继续上一节</option>
          <option value="restart">从首项重新开始</option>
          <option value="customStart">从指定序号开始</option>
        </select>
      </label>
      <label className="field">
        <span>题号样式</span>
        <select
          value={labelPreset}
          onChange={(event) => updateLabelPreset(event.target.value as QuestionLabelPresetId)}
        >
          {labelPreset === 'custom' ? <option value="custom">自定义（保留）</option> : null}
          {questionLabelPresets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </label>
      {mode === 'customStart' ? (
        <label className="field">
          <span>起始序号</span>
          <DraftNumberInput
            value={section.numbering?.start ?? 1}
            mode="required"
            warningLabel="起始序号"
            onChange={(value) => {
              const normalized = Math.max(1, Math.trunc(value ?? 1));

              if (value !== normalized) {
                onInputWarning('起始序号：请输入大于或等于 1 的整数，已按有效整数处理。');
              }

              onChange((current) =>
                withSectionNumbering(current, {
                  ...(current.numbering ?? {}),
                  reset: true,
                  start: normalized,
                }),
              );
            }}
            onInvalidInput={onInputWarning}
          />
        </label>
      ) : null}
      {mode !== 'continue' ? (
        <div
          className={`section-numbering-result ${
            mode === 'restart' ? 'section-numbering-result-wide' : ''
          }`}
          aria-live="polite"
        >
          <span>首题显示</span>
          <strong>
            {formatQuestionLabel(
              mode === 'customStart' ? (section.numbering?.start ?? 1) : 1,
              currentLabel,
            )}
          </strong>
        </div>
      ) : null}
      {labelPreset === 'custom' ? (
        <div className="field-hint section-numbering-custom-hint">
          当前文档包含自定义 LaTeX 题号格式；选择其他预设前会保持原值。
        </div>
      ) : null}
    </div>
  );
}

function withSectionNumbering(
  section: ExamSection,
  numbering: NonNullable<ExamSection['numbering']>,
): ExamSection {
  const hasOptions = Object.keys(numbering.examZhOptions ?? {}).length > 0;

  if (numbering.start === undefined && !numbering.reset && !hasOptions) {
    const next = { ...section };
    delete next.numbering;
    return next;
  }

  return { ...section, numbering };
}

function formatSectionNumberingSummary(section: ExamSection): string {
  const mode = getSectionNumberingMode(section.numbering);
  const start = mode === 'customStart' ? (section.numbering?.start ?? 1) : 1;
  const modeLabel =
    mode === 'continue'
      ? '继续上一节'
      : `从第 ${start} 项开始 · 首题 ${formatQuestionLabel(
          start,
          getSectionQuestionLabel(section),
        )}`;
  const preset = getQuestionLabelPreset(getSectionQuestionLabel(section));
  const presetLabel =
    preset === 'custom'
      ? '自定义样式'
      : (questionLabelPresets.find((item) => item.id === preset)?.label ?? '默认（1.）');

  return `${modeLabel} · ${presetLabel}`;
}

interface QuestionCardProps {
  document: ExamDocument;
  sectionId: string;
  questionRef(element: HTMLElement | null): void;
  question: ExamQuestion;
  previewQuestion: ExamQuestion;
  questionIndex: number;
  questionNumber: number;
  totalQuestions: number;
  selected: boolean;
  expanded: boolean;
  activeTab: QuestionEditorTabId;
  onToggle(): void;
  onChangeTab(tabId: QuestionEditorTabId): void;
  stemRef(element: HTMLTextAreaElement | null): void;
  contentWarnings: Record<string, string>;
  onSetWarning(key: string, warning: string | null): void;
  onInputWarning(message: string): void;
  onTeacherContentConverted(message: string): void;
  onSetNumberDraft(target: NumberPreviewDraftTarget, value: string): void;
  onClearNumberDraft(target: NumberPreviewDraftTarget): void;
  preferredScoreMode: ScoreMode;
  onPreferredScoreModeChange(scoreMode: ScoreMode): void;
  onUpdateQuestion(
    sectionId: string,
    questionId: string,
    updater: (question: ExamQuestion) => ExamQuestion,
  ): void;
  onMoveQuestion(questionId: string, direction: 'up' | 'down'): void;
  onDuplicateQuestion(questionId: string): void;
  onDeleteQuestion(questionId: string): void;
  onDeleteFocus(): void;
}

function QuestionCard(props: QuestionCardProps) {
  const {
    document,
    sectionId,
    questionRef,
    question,
    previewQuestion,
    questionIndex,
    questionNumber,
    totalQuestions,
    selected,
    expanded,
    activeTab,
    onToggle,
    onChangeTab,
    stemRef,
    contentWarnings,
    onSetWarning,
    onInputWarning,
    onTeacherContentConverted,
    onSetNumberDraft,
    onClearNumberDraft,
    preferredScoreMode,
    onPreferredScoreModeChange,
    onUpdateQuestion,
    onMoveQuestion,
    onDuplicateQuestion,
    onDeleteQuestion,
    onDeleteFocus,
  } = props;
  const blankIds = question.blanks?.map((blank) => blank.id) ?? [];
  const solutionInputRef = useRef<HTMLTextAreaElement>(null);
  const solutionSelectionRef = useRef<{ start: number; end: number } | null>(null);
  const [pendingTeacherReference, setPendingTeacherReference] = useState<TeacherReference | null>(
    null,
  );
  const scoreReviewDiagnostics = reviewQuestionScoreMarks(previewQuestion);
  const update = (updater: (question: ExamQuestion) => ExamQuestion) =>
    onUpdateQuestion(sectionId, question.id, updater);
  const questionPointsTarget: NumberPreviewDraftTarget = {
    kind: 'questionPoints',
    questionId: question.id,
  };
  const subQuestionCount = question.subQuestionGroup?.items.length ?? 0;
  const hasSubQuestions = question.type === 'problem' && subQuestionCount > 0;
  const hasWholeScoreMarks = (question.scoreMarks?.length ?? 0) > 0;
  const isChoiceQuestion = question.type === 'singleChoice' || question.type === 'multipleChoice';
  const hasExplicitChoiceParen = isChoiceQuestion && blocksContainChoiceParenRef(question.stem);
  const isJudgementQuestion = question.type === 'judgement';
  const summary = buildQuestionEditorSummary(document, previewQuestion);
  const tabDescriptors = buildQuestionEditorTabDescriptors(
    document,
    previewQuestion,
    contentWarnings,
  ).map((descriptor) =>
    descriptor.id === 'settings' && isChoiceQuestion
      ? {
          ...descriptor,
          tooltip: `${descriptor.tooltip} 选项排版：${formatQuestionChoiceLayoutSummary(
            document,
            previewQuestion,
          )}。`,
        }
      : descriptor,
  );

  useEffect(() => {
    if (!pendingTeacherReference) return;

    const frame = window.requestAnimationFrame(() => {
      const input = solutionInputRef.current;
      if (!input) return;
      const saved = solutionSelectionRef.current ?? {
        start: input.value.length,
        end: input.value.length,
      };
      const start = Math.min(saved.start, input.value.length);
      const end = Math.min(Math.max(saved.end, start), input.value.length);
      input.focus();
      input.setSelectionRange(start, end);
      input.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pendingTeacherReference]);

  useEffect(() => {
    if (expanded && activeTab === 'teacher') return;

    const frame = window.requestAnimationFrame(() => setPendingTeacherReference(null));
    return () => window.cancelAnimationFrame(frame);
  }, [activeTab, expanded]);

  const commitTeacherContent = (result: ParseTeacherSolutionResult) =>
    update((current) => ({
      ...current,
      solution: result.solution,
      scoreMarks: result.scoreMarks,
      solutionAnnotations: result.annotations,
      scoreMode:
        result.scoreMarks.length > 0
          ? resolveScoreMode(
              current.scoreMode,
              preferredScoreMode,
              (current.scoreMarks?.length ?? 0) > 0,
            )
          : current.scoreMode,
    }));

  const locateTeacherReference = (
    reference:
      { type: 'scoreRef'; scoreMarkId: string } | { type: 'annotationRef'; annotationId: string },
  ) => {
    const range = findTeacherReferenceTextRange(
      question.solution,
      question.scoreMarks,
      question.solutionAnnotations,
      reference,
    );
    const input = solutionInputRef.current;
    if (!range || !input) return;
    input.focus();
    input.setSelectionRange(range.start, range.end);
    input.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  const beginTeacherReferencePlacement = (reference: TeacherReference) => {
    setPendingTeacherReference(reference);
  };
  const titleId = `question-editor-title-${question.id}`;
  const bodyId = `question-editor-body-${question.id}`;

  return (
    <article
      ref={questionRef}
      className={`question-card ${selected ? 'question-card-selected' : ''} ${
        expanded ? 'question-card-expanded' : 'question-card-collapsed'
      }`}
      aria-labelledby={titleId}
    >
      <EditorObjectHeader
        titleId={titleId}
        controlsId={bodyId}
        title={`第 ${questionNumber} 题 · ${questionTypeLabels[question.type]}`}
        selected={selected}
        expanded={expanded}
        summary={<QuestionCollapsedSummary summary={summary} />}
        onToggle={onToggle}
        actions={
          <QuestionActionsMenu
            questionId={question.id}
            canMoveUp={questionIndex > 0}
            canMoveDown={questionIndex < totalQuestions - 1}
            onMove={(direction) => onMoveQuestion(question.id, direction)}
            onDuplicate={() => onDuplicateQuestion(question.id)}
            onDelete={() => onDeleteQuestion(question.id)}
            onDeleteFocus={onDeleteFocus}
          />
        }
      />

      <div id={bodyId} className="question-editor-body" hidden={!expanded}>
        {expanded ? (
          <div className="question-editor-content">
            <RichContentField
              label="题干"
              value={question.stem}
              blankIds={blankIds}
              context={getQuestionStemContext(question)}
              inputRef={stemRef}
              draftTarget={{ kind: 'questionStem', questionId: question.id }}
              warning={contentWarnings[`${question.id}:stem`]}
              choiceParenControl={
                isChoiceQuestion
                  ? {
                      explicit: hasExplicitChoiceParen,
                    }
                  : undefined
              }
              judgementParenControl={
                isJudgementQuestion
                  ? {
                      placement: question.judgement?.placement ?? 'lineEnd',
                      onChange: (stem, placement) =>
                        update((current) => setJudgementPlacementAndStem(current, stem, placement)),
                    }
                  : undefined
              }
              onSetWarning={(warning) => onSetWarning(`${question.id}:stem`, warning)}
              onChange={(stem) => update((current) => ({ ...current, stem }))}
            />

            <QuestionEditorTabs
              questionId={question.id}
              descriptors={tabDescriptors}
              activeTab={activeTab}
              onChange={onChangeTab}
              panels={[
                ...(question.type !== 'rawLatex'
                  ? [
                      {
                        id: 'answer' as const,
                        content: (
                          <>
                            {isJudgementQuestion ? (
                              <JudgementAnswerEditor question={question} update={update} />
                            ) : null}
                            {isChoiceQuestion ? (
                              <ChoicesEditor
                                document={document}
                                question={question}
                                update={update}
                                contentWarnings={contentWarnings}
                                onSetWarning={onSetWarning}
                                onInputWarning={onInputWarning}
                              />
                            ) : null}
                            {question.type === 'blank' ? (
                              <BlanksEditor
                                document={document}
                                question={question}
                                update={update}
                                contentWarnings={contentWarnings}
                                onSetWarning={onSetWarning}
                              />
                            ) : null}
                            {question.type === 'problem' ? (
                              <SubQuestionsEditor
                                active={expanded && activeTab === 'answer'}
                                question={question}
                                update={update}
                                contentWarnings={contentWarnings}
                                onSetWarning={onSetWarning}
                                onInputWarning={onInputWarning}
                                onTeacherContentConverted={onTeacherContentConverted}
                                preferredScoreMode={preferredScoreMode}
                                onPreferredScoreModeChange={onPreferredScoreModeChange}
                              />
                            ) : null}
                          </>
                        ),
                      },
                    ]
                  : []),
                {
                  id: 'settings',
                  content: (
                    <div className="question-settings-panel">
                      <CompactNumberField
                        label="分值"
                        value={question.points ?? 0}
                        onChange={(points) => update((current) => ({ ...current, points }))}
                        onDraftChange={(value) => onSetNumberDraft(questionPointsTarget, value)}
                        onDraftEnd={() => onClearNumberDraft(questionPointsTarget)}
                        onInvalidInput={onInputWarning}
                      />
                      {isJudgementQuestion ? (
                        <JudgementAppearanceEditor question={question} update={update} />
                      ) : null}
                      {isChoiceQuestion ? (
                        <QuestionChoiceLayoutEditor
                          document={document}
                          question={question}
                          update={update}
                          onInputWarning={onInputWarning}
                        />
                      ) : null}
                    </div>
                  ),
                },
                {
                  id: 'teacher',
                  content: (
                    <>
                      <RichContentField
                        label="解析"
                        value={question.solution ?? []}
                        context="solution"
                        inputRef={(element) => {
                          solutionInputRef.current = element;
                        }}
                        onSelectionChange={(selection) => {
                          solutionSelectionRef.current = selection;
                        }}
                        draftTarget={{ kind: 'questionSolution', questionId: question.id }}
                        warning={contentWarnings[`${question.id}:solution`]}
                        onSetWarning={(warning) => onSetWarning(`${question.id}:solution`, warning)}
                        onChange={(solution) => update((current) => ({ ...current, solution }))}
                        teacherContent={{
                          scoreMarks: question.scoreMarks ?? [],
                          annotations: question.solutionAnnotations ?? [],
                          onCommit: commitTeacherContent,
                          onConverted: onTeacherContentConverted,
                        }}
                        teacherReferencePlacement={
                          pendingTeacherReference
                            ? {
                                reference: pendingTeacherReference,
                                label: getTeacherReferencePlacementLabel(
                                  pendingTeacherReference,
                                  question.scoreMarks,
                                  question.solutionAnnotations,
                                ),
                                onComplete: () => setPendingTeacherReference(null),
                                onCancel: () => setPendingTeacherReference(null),
                              }
                            : undefined
                        }
                      />

                      {hasSubQuestions && !hasWholeScoreMarks ? (
                        <div className="teacher-content-note">
                          有小题时请在小题内设置评分点或评分档。
                        </div>
                      ) : (
                        <ScoringSchemeTable
                          ownerLabel={`第 ${questionNumber} 题`}
                          expectedPoints={question.points}
                          scoreMode={resolveScoreMode(
                            question.scoreMode,
                            preferredScoreMode,
                            (question.scoreMarks?.length ?? 0) > 0,
                          )}
                          scoreMarks={question.scoreMarks ?? []}
                          solution={question.solution}
                          createId={createId}
                          helperText={
                            hasSubQuestions
                              ? '历史整题评分项已保留；建议迁移到小题内后删除这里的整题评分项。'
                              : undefined
                          }
                          addDisabled={hasSubQuestions}
                          onScoreModeChange={(scoreMode) => {
                            onPreferredScoreModeChange(scoreMode);
                            update((current) => ({ ...current, scoreMode }));
                          }}
                          onInputWarning={onInputWarning}
                          onChange={(scoreMarks) =>
                            update((current) => ({
                              ...current,
                              scoreMarks,
                              scoreMode:
                                scoreMarks.length > 0
                                  ? resolveScoreMode(
                                      current.scoreMode,
                                      preferredScoreMode,
                                      (current.scoreMarks?.length ?? 0) > 0,
                                    )
                                  : current.scoreMode,
                            }))
                          }
                          onDelete={(scoreMarkId) =>
                            update((current) => ({
                              ...current,
                              solution: removeScoreReferences(current.solution, scoreMarkId),
                              scoreMarks: (current.scoreMarks ?? []).filter(
                                (item) => item.id !== scoreMarkId,
                              ),
                            }))
                          }
                          onLocate={(scoreMarkId) =>
                            locateTeacherReference({ type: 'scoreRef', scoreMarkId })
                          }
                          onReinsert={(scoreMarkId) =>
                            beginTeacherReferencePlacement({ type: 'scoreRef', scoreMarkId })
                          }
                        />
                      )}

                      <SolutionAnnotationTable
                        ownerLabel={`第 ${questionNumber} 题`}
                        annotations={question.solutionAnnotations ?? []}
                        solution={question.solution}
                        onChange={(solutionAnnotations) =>
                          update((current) => ({ ...current, solutionAnnotations }))
                        }
                        onDelete={(annotationId) =>
                          update((current) => ({
                            ...current,
                            solution: removeAnnotationReferences(current.solution, annotationId),
                            solutionAnnotations: (current.solutionAnnotations ?? []).filter(
                              (item) => item.id !== annotationId,
                            ),
                          }))
                        }
                        onLocate={(annotationId) =>
                          locateTeacherReference({ type: 'annotationRef', annotationId })
                        }
                        onReinsert={(annotationId) =>
                          beginTeacherReferencePlacement({ type: 'annotationRef', annotationId })
                        }
                      />

                      {scoreReviewDiagnostics.some((diagnostic) =>
                        [
                          'whole_problem_score_with_subquestions',
                          'subquestion_score_total_mismatch',
                          'partial_subquestion_score_marks',
                        ].includes(diagnostic.code),
                      ) ? (
                        <div className="teacher-content-group-warning">
                          {scoreReviewDiagnostics
                            .filter((diagnostic) =>
                              [
                                'whole_problem_score_with_subquestions',
                                'subquestion_score_total_mismatch',
                                'partial_subquestion_score_marks',
                              ].includes(diagnostic.code),
                            )
                            .map((diagnostic) => diagnostic.message)
                            .join(' ')}
                        </div>
                      ) : null}
                    </>
                  ),
                },
              ]}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}

function ChoicesEditor({
  document,
  question,
  update,
  contentWarnings,
  onSetWarning,
  onInputWarning,
}: {
  document: ExamDocument;
  question: ExamQuestion;
  update(updater: (question: ExamQuestion) => ExamQuestion): void;
  contentWarnings: Record<string, string>;
  onSetWarning(key: string, warning: string | null): void;
  onInputWarning(message: string): void;
}) {
  const choices = useMemo(() => question.choices ?? [], [question.choices]);
  const selected = new Set(question.correctChoiceIds ?? []);
  const collapse = useCollapsedRepeatableItems(choices.map((choice) => choice.id));
  const resolvedLayout = resolveChoiceLayout(document, question);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const contentRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const pendingRevealRef = useRef<{ choiceId: string; focus: boolean } | null>(null);
  const answerOptions = choices.map((choice, choiceIndex) => ({
    id: choice.id,
    label: getResolvedChoiceDisplayLabel(question, choiceIndex, resolvedLayout),
    summary: summarizeRichContent(choice.content, '暂无内容', 48),
    content: choice.content,
  }));

  useEffect(() => {
    const pending = pendingRevealRef.current;
    if (!pending || !choices.some((choice) => choice.id === pending.choiceId)) return;

    pendingRevealRef.current = null;
    const frame = requestAnimationFrame(() => {
      itemRefs.current[pending.choiceId]?.scrollIntoView({ block: 'nearest' });
      if (pending.focus) contentRefs.current[pending.choiceId]?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [choices]);

  function revealChoice(choiceId: string, focus: boolean): void {
    collapse.expand(choiceId);
    pendingRevealRef.current = { choiceId, focus };
  }

  function addChoice(): void {
    const choice = createChoiceOption(createId, nextChoiceLabel(choices));
    revealChoice(choice.id, true);
    update((current) => ({
      ...current,
      choices: [...(current.choices ?? []), choice],
    }));
  }

  return (
    <div className="nested-editor">
      <RepeatableEditorHeading
        title="选项"
        itemCount={choices.length}
        allCollapsed={collapse.allCollapsed}
        onToggleAll={collapse.toggleAll}
        addLabel="添加选项"
        addButtonRef={addButtonRef}
        onAdd={addChoice}
      />
      <ChoiceAnswerPicker
        multiple={question.type === 'multipleChoice'}
        options={answerOptions}
        selectedIds={question.correctChoiceIds ?? []}
        onChange={(choiceIds) =>
          update((current) => ({
            ...current,
            correctChoiceIds:
              choiceIds.length > 0
                ? orderChoiceIdsByChoices(choiceIds, current.choices ?? [])
                : undefined,
          }))
        }
      />
      {choices.map((choice, choiceIndex) => {
        const label = choice.label ?? choice.id;
        const displayLabel = getResolvedChoiceDisplayLabel(question, choiceIndex, resolvedLayout);
        const collapsed = collapse.isCollapsed(choice.id);
        const bodyId = `choice-body-${question.id}-${choice.id}`;

        return (
          <div
            key={choice.id}
            ref={(element) => {
              itemRefs.current[choice.id] = element;
            }}
            className={`choice-row repeatable-item ${collapsed ? 'repeatable-item-collapsed' : ''}`}
          >
            <RepeatableItemHeader
              itemLabel={`选项 ${displayLabel}`}
              controlsId={bodyId}
              identity={
                <ChoiceLabelButton
                  displayLabel={displayLabel}
                  storedLabel={label}
                  editable={!resolvedLayout.localCounterActive}
                  readOnlyHint="由题目样式生成，原标签已保留"
                  onApply={(draftLabel) => {
                    update((current) => {
                      const currentIndex = (current.choices ?? []).findIndex(
                        (item) => item.id === choice.id,
                      );
                      const result = commitChoiceLabelDraft(current, currentIndex, draftLabel);
                      if (result.warning) onInputWarning(result.warning);
                      return result.question;
                    });
                  }}
                />
              }
              summary={<CompactRichContent blocks={choice.content} fallback="暂无内容" />}
              status={
                selected.has(choice.id) ? (
                  <span className="repeatable-item-status-success">正确</span>
                ) : undefined
              }
              collapsed={collapsed}
              onToggle={() => collapse.toggle(choice.id)}
              actions={
                <RepeatableItemMenu
                  itemLabel={`选项 ${displayLabel}`}
                  canMoveUp={choiceIndex > 0}
                  canMoveDown={choiceIndex < choices.length - 1}
                  onMove={(direction) =>
                    update((current) => moveChoiceOption(current, choice.id, direction))
                  }
                  onDuplicate={() => {
                    const result = duplicateChoiceOptionWithResult(question, choice.id, createId);
                    if (!result.choiceId) return;
                    revealChoice(result.choiceId, false);
                    update(() => result.question);
                  }}
                  deleteKey={`choice:${question.id}:${choice.id}`}
                  onDelete={() => {
                    collapse.remove(choice.id);
                    update((current) => removeChoiceOption(current, choice.id));
                  }}
                  onDeleteFocus={() => {
                    const targetId = getRepeatableDeleteFocusTarget(
                      choices.map((item) => item.id),
                      choice.id,
                    );
                    const target = targetId ? itemRefs.current[targetId] : null;
                    if (target) {
                      target
                        .querySelector<HTMLButtonElement>('.repeatable-item-disclosure')
                        ?.focus();
                    } else {
                      addButtonRef.current?.focus();
                    }
                  }}
                />
              }
            />
            <div id={bodyId} className="choice-row-body" hidden={collapsed}>
              {!collapsed ? (
                <RichContentField
                  label="内容"
                  value={choice.content}
                  context="choiceOption"
                  inputRef={(element) => {
                    contentRefs.current[choice.id] = element;
                  }}
                  draftTarget={{
                    kind: 'choiceContent',
                    questionId: question.id,
                    choiceId: choice.id,
                  }}
                  warning={contentWarnings[`${question.id}:choice:${choice.id}`]}
                  onSetWarning={(warning) =>
                    onSetWarning(`${question.id}:choice:${choice.id}`, warning)
                  }
                  onChange={(content) =>
                    update((current) => ({
                      ...current,
                      choices: (current.choices ?? []).map((item) =>
                        item.id === choice.id ? { ...item, content } : item,
                      ),
                    }))
                  }
                />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function QuestionChoiceLayoutEditor({
  document,
  question,
  update,
  onInputWarning,
}: {
  document: ExamDocument;
  question: ExamQuestion;
  update(updater: (question: ExamQuestion) => ExamQuestion): void;
  onInputWarning(message: string): void;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const resolvedLayout = resolveChoiceLayout(document, question);
  const customLabels = hasCustomChoiceDisplayLabels(question);

  return (
    <CollapsibleEditorSubsection
      title="选项排版"
      summary={formatQuestionChoiceLayoutSummary(document, question)}
      variant="inset"
      collapsed={collapsed}
      onToggle={() => setCollapsed((current) => !current)}
    >
      <ChoiceLayoutControls
        scope="question"
        arrangement={getQuestionChoiceArrangementSelection(question)}
        label={getQuestionChoiceLabelSelection(question)}
        labelPosition={getQuestionChoiceLabelPositionSelection(question)}
        horizontalDensity={getQuestionChoiceHorizontalDensitySelection(question)}
        verticalSpacing={getQuestionChoiceVerticalSpacingSelection(question)}
        labelWidth={getQuestionChoiceLabelWidthSelection(question)}
        labelAlignment={getQuestionChoiceLabelAlignmentSelection(question)}
        advancedLayout={resolvedLayout}
        resolvedQuestionLayout={resolvedLayout}
        advancedAdjusted={hasQuestionChoiceAdvancedOverrides(question)}
        hasCustomLabels={customLabels}
        localCounterActive={resolvedLayout.localCounterActive}
        question={question}
        indexSelection={getQuestionChoiceIndexSelection(question)}
        indexValue={getQuestionChoiceIndexValue(question)}
        onInputWarning={onInputWarning}
        onArrangementChange={(selection) => {
          if (selection !== 'custom') {
            update((current) => setQuestionChoiceArrangement(current, selection));
          }
        }}
        onLabelChange={(selection) => {
          if (selection !== 'custom') {
            update((current) => setQuestionChoiceLabelPreset(current, selection));
          }
        }}
        onLabelPositionChange={(selection) => {
          if (selection !== 'custom') {
            update((current) => setQuestionChoiceLabelPosition(current, selection));
          }
        }}
        onHorizontalDensityChange={(selection) => {
          if (selection !== 'custom') {
            update((current) => setQuestionChoiceHorizontalDensity(current, selection));
          }
        }}
        onHorizontalDensityCustomApply={(values) =>
          update((current) => setQuestionChoiceHorizontalDensityCustom(current, values))
        }
        onVerticalSpacingChange={(selection) => {
          if (selection !== 'custom') {
            update((current) => setQuestionChoiceVerticalSpacing(current, selection));
          }
        }}
        onVerticalSpacingCustomApply={(values) =>
          update((current) => setQuestionChoiceVerticalSpacingCustom(current, values))
        }
        onLabelWidthChange={(selection) => {
          if (selection !== 'custom') {
            update((current) => setQuestionChoiceLabelWidth(current, selection));
          }
        }}
        onLabelWidthCustomApply={(value) =>
          update((current) => setQuestionChoiceLabelWidthCustom(current, value))
        }
        onLabelAlignmentChange={(selection) => {
          if (selection !== 'custom') {
            update((current) => setQuestionChoiceLabelAlignment(current, selection));
          }
        }}
        onIndexChange={(value) => update((current) => setQuestionChoiceIndex(current, value))}
        onResetLabels={() => update(resetChoiceDisplayLabels)}
      />
    </CollapsibleEditorSubsection>
  );
}

function BlanksEditor({
  document,
  question,
  update,
  contentWarnings,
  onSetWarning,
}: {
  document: ExamDocument;
  question: ExamQuestion;
  update(updater: (question: ExamQuestion) => ExamQuestion): void;
  contentWarnings: Record<string, string>;
  onSetWarning(key: string, warning: string | null): void;
}) {
  const blanks = useMemo(() => question.blanks ?? [], [question.blanks]);
  const collapse = useCollapsedRepeatableItems(blanks.map((blank) => blank.id));
  const [customBlankIds, setCustomBlankIds] = useState<ReadonlySet<string>>(() => new Set());
  const [settingsBlankIds, setSettingsBlankIds] = useState<ReadonlySet<string>>(() => new Set());
  const [advancedBlankIds, setAdvancedBlankIds] = useState<ReadonlySet<string>>(() => new Set());
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const answerRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const pendingRevealRef = useRef<{ blankId: string; focus: boolean } | null>(null);
  const setBlankCustomMode = useCallback((blankId: string, enabled: boolean) => {
    setCustomBlankIds((current) => {
      const next = new Set(current);

      if (enabled) {
        next.add(blankId);
      } else {
        next.delete(blankId);
      }

      return next;
    });
  }, []);
  const toggleBlankAdvanced = useCallback((blankId: string) => {
    setAdvancedBlankIds((current) => {
      const next = new Set(current);
      if (next.has(blankId)) {
        next.delete(blankId);
      } else {
        next.add(blankId);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const pending = pendingRevealRef.current;
    if (!pending || !blanks.some((blank) => blank.id === pending.blankId)) return;

    pendingRevealRef.current = null;
    const frame = requestAnimationFrame(() => {
      itemRefs.current[pending.blankId]?.scrollIntoView({ block: 'nearest' });
      if (pending.focus) answerRefs.current[pending.blankId]?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [blanks]);

  function addBlank(): void {
    const blank = createBlankSlot(createId);
    collapse.expand(blank.id);
    pendingRevealRef.current = { blankId: blank.id, focus: true };
    update((current) =>
      appendBlankRefToStem(
        {
          ...current,
          blanks: [...(current.blanks ?? []), blank],
        },
        blank.id,
      ),
    );
  }

  return (
    <div className="nested-editor">
      <RepeatableEditorHeading
        title="填空"
        itemCount={blanks.length}
        allCollapsed={collapse.allCollapsed}
        onToggleAll={collapse.toggleAll}
        addLabel="添加空"
        addButtonRef={addButtonRef}
        onAdd={addBlank}
      />
      {blanks.map((blank, blankIndex) => {
        const inferredPresetId = getBlankLengthPreset(blank);
        const selectedPresetId = customBlankIds.has(blank.id) ? 'custom' : inferredPresetId;
        const collapsed = collapse.isCollapsed(blank.id);
        const answer = blank.answer ?? [];
        const styleLabel = getBlankStyleOption(blank.type).label;
        const lengthLabel = getBlankLengthPresetById(selectedPresetId).label;
        const resolvedFillin = resolveFillinLayout(document, blank);
        const noAnswerSelection = getBlankFillinNoAnswerSelection(blank);
        const parenSelection = getBlankFillinParenSelection(blank);
        const widthSelection = getBlankFillinWidthSelection(blank);
        const advancedExpanded = advancedBlankIds.has(blank.id);
        const shaped = resolvedFillin.type === 'circle' || resolvedFillin.type === 'rectangle';
        const showWidthType =
          resolvedFillin.noAnswerType === 'none' &&
          (resolvedFillin.type === 'line' ||
            resolvedFillin.type === 'paren' ||
            resolvedFillin.type === 'blank');
        const bodyId = `blank-body-${question.id}-${blank.id}`;

        return (
          <div
            key={blank.id}
            ref={(element) => {
              itemRefs.current[blank.id] = element;
            }}
            className={`blank-row repeatable-item ${collapsed ? 'repeatable-item-collapsed' : ''}`}
          >
            <RepeatableItemHeader
              itemLabel={`第 ${blankIndex + 1} 空`}
              controlsId={bodyId}
              identity={<span>第 {blankIndex + 1} 空</span>}
              summary={<CompactRichContent blocks={answer} fallback="未设答案" />}
              status={<span>{`${styleLabel} · ${lengthLabel}`}</span>}
              collapsed={collapsed}
              onToggle={() => collapse.toggle(blank.id)}
              actions={
                <RepeatableItemMenu
                  itemLabel={`第 ${blankIndex + 1} 空`}
                  extraItems={[
                    {
                      label: '在题干末尾插入占位',
                      icon: TextCursorInput,
                      onSelect: () => update((current) => appendBlankRefToStem(current, blank.id)),
                    },
                  ]}
                  deleteKey={`blank:${question.id}:${blank.id}`}
                  onDelete={() => {
                    collapse.remove(blank.id);
                    setBlankCustomMode(blank.id, false);
                    setSettingsBlankIds((current) => {
                      const next = new Set(current);
                      next.delete(blank.id);
                      return next;
                    });
                    setAdvancedBlankIds((current) => {
                      const next = new Set(current);
                      next.delete(blank.id);
                      return next;
                    });
                    update((current) => removeBlankFromQuestion(current, blank.id));
                  }}
                  onDeleteFocus={() => {
                    const targetId = getRepeatableDeleteFocusTarget(
                      blanks.map((item) => item.id),
                      blank.id,
                    );
                    const target = targetId ? itemRefs.current[targetId] : null;
                    if (target) {
                      target
                        .querySelector<HTMLButtonElement>('.repeatable-item-disclosure')
                        ?.focus();
                    } else {
                      addButtonRef.current?.focus();
                    }
                  }}
                />
              }
            />
            <div id={bodyId} className="blank-controls" hidden={collapsed}>
              {!collapsed ? (
                <>
                  <RichContentField
                    label="答案"
                    value={answer}
                    context="blankAnswer"
                    inputRef={(element) => {
                      answerRefs.current[blank.id] = element;
                    }}
                    draftTarget={{
                      kind: 'blankAnswer',
                      questionId: question.id,
                      blankId: blank.id,
                    }}
                    warning={contentWarnings[`${question.id}:blank:${blank.id}:answer`]}
                    onSetWarning={(warning) =>
                      onSetWarning(`${question.id}:blank:${blank.id}:answer`, warning)
                    }
                    onChange={(answer) =>
                      update((current) => setBlankAnswer(current, blank.id, answer))
                    }
                  />
                  <CollapsibleEditorSubsection
                    title="填空设置"
                    summary={`${styleLabel} · ${lengthLabel}`}
                    variant="inset"
                    collapsed={!settingsBlankIds.has(blank.id)}
                    onToggle={() =>
                      setSettingsBlankIds((current) => {
                        const next = new Set(current);
                        if (next.has(blank.id)) next.delete(blank.id);
                        else next.add(blank.id);
                        return next;
                      })
                    }
                  >
                    <div className="blank-settings">
                      <BlankLengthPresetField
                        selectedPresetId={selectedPresetId}
                        onChange={(presetId) => {
                          if (presetId === 'custom') {
                            setBlankCustomMode(blank.id, true);
                            return;
                          }

                          setBlankCustomMode(blank.id, false);
                          update((current) =>
                            updateBlank(current, blank.id, applyBlankLengthPreset(blank, presetId)),
                          );
                        }}
                      />
                      <BlankStyleField
                        blank={blank}
                        onChange={(type) =>
                          update((current) => updateBlank(current, blank.id, { type }))
                        }
                      />
                      {selectedPresetId === 'custom' ? (
                        <>
                          <label className="blank-field">
                            <span className="field-label-row">
                              <span>高级命令</span>
                              <InlineHelp text="对应 exam-zh 的 fillin / fillin* 命令；fillin* 主要用于学生版不显示答案时的可换行留空。" />
                            </span>
                            <select
                              value={blank.command ?? 'fillin'}
                              onChange={(event) =>
                                update((current) =>
                                  updateBlank(current, blank.id, {
                                    command: event.target.value as BlankSlot['command'],
                                  }),
                                )
                              }
                            >
                              <option value="fillin">标准填空（\fillin）</option>
                              <option value="fillin*">可换行填空（\fillin*）</option>
                            </select>
                          </label>
                          <label className="blank-field">
                            <span className="field-label-row">
                              <span>自定义宽度</span>
                              <InlineHelp text="可填写 4em、8em，或类似 0.5 倍行宽的 LaTeX 长度。1em 大约接近一个汉字宽，最终效果以 PDF 为准。" />
                            </span>
                            <input
                              value={blank.width ?? ''}
                              placeholder="例如 4em"
                              onChange={(event) =>
                                update((current) =>
                                  updateBlank(current, blank.id, { width: event.target.value }),
                                )
                              }
                            />
                          </label>
                        </>
                      ) : null}
                    </div>
                    {shaped ? (
                      <div className="field-hint">
                        圆圈和方框按内容生成，长度与跨行设置通常不影响最终外框大小。
                      </div>
                    ) : null}
                    {shaped && resolvedFillin.command === 'fillin*' ? (
                      <div className="metadata-warning">
                        教师版显示答案时，exam-zh 不支持可换行的
                        {resolvedFillin.type === 'circle' ? '圆框' : '方框'}
                        ；导出器会改用标准填空命令，学生版保持当前设置。
                      </div>
                    ) : null}
                    <div className="blank-advanced-settings">
                      <button
                        type="button"
                        className="choice-layout-inline-toggle"
                        aria-expanded={advancedExpanded}
                        onClick={() => toggleBlankAdvanced(blank.id)}
                      >
                        <span className="choice-layout-inline-title">高级显示</span>
                        <CollapseToggleIcon collapsed={!advancedExpanded} />
                      </button>
                      {advancedExpanded ? (
                        <div className="blank-advanced-content">
                          <label className="blank-field">
                            <span className="field-label-row">
                              <span>学生版留空方式</span>
                              <InlineHelp text="可让某一空覆盖试卷默认的答题卡标记、卷面留空或连续编号。" />
                            </span>
                            <select
                              value={noAnswerSelection}
                              onChange={(event) => {
                                const selection = event.target.value as FillinNoAnswerSelection;
                                if (selection !== 'custom') {
                                  update((current) =>
                                    replaceBlank(
                                      current,
                                      blank.id,
                                      setBlankFillinNoAnswerType(blank, selection),
                                    ),
                                  );
                                }
                              }}
                            >
                              {noAnswerSelection === 'custom' ? (
                                <option value="custom">自定义（保留）</option>
                              ) : null}
                              <option value="inherit">跟随试卷</option>
                              <option value="blacktriangle">答题卡标记</option>
                              <option value="none">卷面作答</option>
                              <option value="counter">连续编号</option>
                            </select>
                          </label>
                          {resolvedFillin.type === 'paren' ? (
                            <label className="blank-field">
                              <span>括号样式</span>
                              <select
                                value={parenSelection}
                                onChange={(event) => {
                                  const selection = event.target.value as FillinParenSelection;
                                  if (selection !== 'custom') {
                                    update((current) =>
                                      replaceBlank(
                                        current,
                                        blank.id,
                                        setBlankFillinParenType(blank, selection),
                                      ),
                                    );
                                  }
                                }}
                              >
                                {parenSelection === 'custom' ? (
                                  <option value="custom">自定义（保留）</option>
                                ) : null}
                                <option value="inherit">跟随试卷</option>
                                <option value="banjiao">半角</option>
                                <option value="quanjiao">全角</option>
                              </select>
                            </label>
                          ) : null}
                          {showWidthType ? (
                            <label className="blank-field">
                              <span className="field-label-row">
                                <span>跨行末端</span>
                                <InlineHelp text="仅在学生版普通留白跨过当前行时生效；草稿只做近似，最终换行以 PDF 为准。" />
                              </span>
                              <select
                                value={widthSelection}
                                onChange={(event) => {
                                  const selection = event.target.value as FillinWidthSelection;
                                  if (selection !== 'custom') {
                                    update((current) =>
                                      replaceBlank(
                                        current,
                                        blank.id,
                                        setBlankFillinWidthType(blank, selection),
                                      ),
                                    );
                                  }
                                }}
                              >
                                {widthSelection === 'custom' ? (
                                  <option value="custom">自定义（保留）</option>
                                ) : null}
                                <option value="inherit">跟随试卷</option>
                                <option value="normal">按指定长度</option>
                                <option value="fill">末行铺满</option>
                              </select>
                            </label>
                          ) : null}
                          {!showWidthType ? (
                            <div className="field-hint blank-advanced-wide">
                              跨行末端只在学生版“卷面作答”且外观为横线、括号或空白时生效。
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </CollapsibleEditorSubsection>
                </>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BlankLengthPresetField({
  selectedPresetId,
  onChange,
}: {
  selectedPresetId: BlankLengthPresetId;
  onChange(presetId: BlankLengthPresetId): void;
}) {
  const selectedPreset = getBlankLengthPresetById(selectedPresetId);

  return (
    <label className="blank-field blank-length-field">
      <span className="field-label-row">
        <span>填空长度/换行方式</span>
        <InlineHelp text="短、中、长会自动设置 exam-zh 的填空命令和宽度。长填空使用可换行命令，但教师版显示长答案时最终 PDF 仍以 exam-zh 行为为准。" />
      </span>
      <select
        value={selectedPresetId}
        onChange={(event) => onChange(event.target.value as BlankLengthPresetId)}
      >
        {blankLengthPresets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label}
          </option>
        ))}
      </select>
      <span className="blank-helper">{selectedPreset.description}</span>
    </label>
  );
}

function BlankStyleField({
  blank,
  onChange,
}: {
  blank: BlankSlot;
  onChange(type: BlankSlot['type']): void;
}) {
  const selectedStyle = getBlankStyleOption(blank.type);

  return (
    <label className="blank-field">
      <span className="field-label-row">
        <span>填空样式</span>
        <InlineHelp text="控制学生版中填空位置画成横线、括号、方框、圆圈或空白。教师版答案是否显示由答案模式控制。" />
      </span>
      <select
        value={blank.type ?? 'line'}
        onChange={(event) => onChange(event.target.value as BlankSlot['type'])}
      >
        {blankStyleOptions.map((option) => (
          <option key={option.type} value={option.type}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="blank-helper">{selectedStyle.description}</span>
    </label>
  );
}

function InlineHelp({ text }: { text: string }) {
  return (
    <TooltipAnchor text={text}>
      <span className="inline-tooltip" tabIndex={0} aria-label={text}>
        <Info aria-hidden="true" size={14} />
      </span>
    </TooltipAnchor>
  );
}

function SubQuestionsEditor({
  active,
  question,
  update,
  contentWarnings,
  onSetWarning,
  onInputWarning,
  onTeacherContentConverted,
  preferredScoreMode,
  onPreferredScoreModeChange,
}: {
  active: boolean;
  question: ExamQuestion;
  update(updater: (question: ExamQuestion) => ExamQuestion): void;
  contentWarnings: Record<string, string>;
  onSetWarning(key: string, warning: string | null): void;
  onInputWarning(message: string): void;
  onTeacherContentConverted(message: string): void;
  preferredScoreMode: ScoreMode;
  onPreferredScoreModeChange(scoreMode: ScoreMode): void;
}) {
  const items = useMemo(
    () => question.subQuestionGroup?.items ?? [],
    [question.subQuestionGroup?.items],
  );
  const collapse = useCollapsedRepeatableItems(items.map((item) => item.id));
  const [teacherExpandedIds, setTeacherExpandedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const stemRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const solutionRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const solutionSelectionsRef = useRef<Record<string, { start: number; end: number } | undefined>>(
    {},
  );
  const [pendingTeacherReference, setPendingTeacherReference] = useState<{
    subQuestionId: string;
    reference: TeacherReference;
  } | null>(null);
  const pendingRevealRef = useRef<{ subQuestionId: string; focus: boolean } | null>(null);

  useEffect(() => {
    if (active) return;

    const frame = window.requestAnimationFrame(() => setPendingTeacherReference(null));
    return () => window.cancelAnimationFrame(frame);
  }, [active]);

  useEffect(() => {
    const pending = pendingRevealRef.current;
    if (!pending || !items.some((item) => item.id === pending.subQuestionId)) return;

    pendingRevealRef.current = null;
    const frame = requestAnimationFrame(() => {
      itemRefs.current[pending.subQuestionId]?.scrollIntoView({ block: 'nearest' });
      if (pending.focus) stemRefs.current[pending.subQuestionId]?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [items]);

  function revealSubQuestion(subQuestionId: string, focus: boolean): void {
    collapse.expand(subQuestionId);
    pendingRevealRef.current = { subQuestionId, focus };
  }

  function addSubQuestion(): void {
    const subQuestion = {
      ...createSubQuestion(createId),
      scoreMode: preferredScoreMode,
    };
    const result = addSubQuestionToProblem(question, subQuestion);
    revealSubQuestion(subQuestion.id, true);
    update(() => result.question);

    if (result.migratedWholeScoreMarks) {
      onInputWarning('已将整题评分点迁移到第 1 小题。');
    }
  }

  function commitSubQuestionTeacherContent(
    subQuestionId: string,
    result: ParseTeacherSolutionResult,
  ): void {
    update((current) =>
      updateSubQuestion(current, subQuestionId, (currentItem) => ({
        ...currentItem,
        solution: result.solution,
        scoreMarks: result.scoreMarks,
        solutionAnnotations: result.annotations,
        scoreMode:
          result.scoreMarks.length > 0
            ? resolveScoreMode(
                currentItem.scoreMode,
                preferredScoreMode,
                (currentItem.scoreMarks?.length ?? 0) > 0,
              )
            : currentItem.scoreMode,
      })),
    );
  }

  function locateSubQuestionTeacherReference(
    item: NonNullable<ExamQuestion['subQuestionGroup']>['items'][number],
    reference:
      { type: 'scoreRef'; scoreMarkId: string } | { type: 'annotationRef'; annotationId: string },
  ): void {
    const range = findTeacherReferenceTextRange(
      item.solution,
      item.scoreMarks,
      item.solutionAnnotations,
      reference,
    );
    const input = solutionRefs.current[item.id];
    if (!range || !input) return;
    input.focus();
    input.setSelectionRange(range.start, range.end);
    input.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function beginSubQuestionTeacherReferencePlacement(
    item: NonNullable<ExamQuestion['subQuestionGroup']>['items'][number],
    reference: TeacherReference,
  ): void {
    setPendingTeacherReference({ subQuestionId: item.id, reference });
    window.requestAnimationFrame(() => {
      const input = solutionRefs.current[item.id];
      if (!input) return;
      const saved = solutionSelectionsRef.current[item.id] ?? {
        start: input.value.length,
        end: input.value.length,
      };
      const start = Math.min(saved.start, input.value.length);
      const end = Math.min(Math.max(saved.end, start), input.value.length);
      input.focus();
      input.setSelectionRange(start, end);
      input.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  return (
    <div className="nested-editor">
      <RepeatableEditorHeading
        title="小题"
        itemCount={items.length}
        allCollapsed={collapse.allCollapsed}
        onToggleAll={collapse.toggleAll}
        addLabel="添加小题"
        addButtonRef={addButtonRef}
        onAdd={addSubQuestion}
      />
      {items.map((item, itemIndex) => {
        const collapsed = collapse.isCollapsed(item.id);
        const detailLabels = [
          item.solution?.length ? '有解析' : null,
          item.scoreMarks?.length ? `${item.scoreMarks.length} 个评分项` : null,
          item.solutionAnnotations?.length ? `${item.solutionAnnotations.length} 条解析批注` : null,
        ].filter((label): label is string => label !== null);
        const bodyId = `subquestion-body-${question.id}-${item.id}`;

        return (
          <div
            key={item.id}
            ref={(element) => {
              itemRefs.current[item.id] = element;
            }}
            className={`subquestion-card repeatable-item ${
              collapsed ? 'repeatable-item-collapsed' : ''
            }`}
          >
            <RepeatableItemHeader
              itemLabel={`小题 ${itemIndex + 1}`}
              controlsId={bodyId}
              identity={<span>小题 {itemIndex + 1}</span>}
              summary={<CompactRichContent blocks={item.stem} fallback="未填写题干" />}
              status={detailLabels.length > 0 ? <span>{detailLabels.join(' · ')}</span> : undefined}
              collapsed={collapsed}
              onToggle={() => {
                if (!collapsed && pendingTeacherReference?.subQuestionId === item.id) {
                  setPendingTeacherReference(null);
                }
                collapse.toggle(item.id);
              }}
              actions={
                <RepeatableItemMenu
                  itemLabel={`小题 ${itemIndex + 1}`}
                  canMoveUp={itemIndex > 0}
                  canMoveDown={itemIndex < items.length - 1}
                  onMove={(direction) =>
                    update((current) => moveSubQuestion(current, item.id, direction))
                  }
                  onDuplicate={() => {
                    const result = duplicateSubQuestionWithResult(question, item.id, createId);
                    if (!result.subQuestionId) return;
                    revealSubQuestion(result.subQuestionId, false);
                    update(() => result.question);
                  }}
                  deleteKey={`subquestion:${question.id}:${item.id}`}
                  onDelete={() => {
                    if (pendingTeacherReference?.subQuestionId === item.id) {
                      setPendingTeacherReference(null);
                    }
                    collapse.remove(item.id);
                    setTeacherExpandedIds((current) => {
                      const next = new Set(current);
                      next.delete(item.id);
                      return next;
                    });
                    update((current) => removeSubQuestion(current, item.id));
                  }}
                  onDeleteFocus={() => {
                    const targetId = getRepeatableDeleteFocusTarget(
                      items.map((candidate) => candidate.id),
                      item.id,
                    );
                    const target = targetId ? itemRefs.current[targetId] : null;
                    if (target) {
                      target
                        .querySelector<HTMLButtonElement>('.repeatable-item-disclosure')
                        ?.focus();
                    } else {
                      addButtonRef.current?.focus();
                    }
                  }}
                />
              }
            />
            <div id={bodyId} className="subquestion-body" hidden={collapsed}>
              {!collapsed ? (
                <>
                  <RichContentField
                    label="小题题干"
                    value={item.stem}
                    context="subQuestionStem"
                    inputRef={(element) => {
                      stemRefs.current[item.id] = element;
                    }}
                    draftTarget={{
                      kind: 'subQuestionStem',
                      questionId: question.id,
                      subQuestionId: item.id,
                    }}
                    warning={contentWarnings[`${item.id}:stem`]}
                    onSetWarning={(warning) => onSetWarning(`${item.id}:stem`, warning)}
                    onChange={(stem) =>
                      update((current) =>
                        updateSubQuestion(current, item.id, (currentItem) => ({
                          ...currentItem,
                          stem,
                        })),
                      )
                    }
                  />
                  <CollapsibleEditorSubsection
                    title="解析与评分"
                    summary={detailLabels.length > 0 ? detailLabels.join(' · ') : '尚未填写'}
                    variant="inset"
                    collapsed={!teacherExpandedIds.has(item.id)}
                    onToggle={() => {
                      const closing = teacherExpandedIds.has(item.id);
                      if (closing && pendingTeacherReference?.subQuestionId === item.id) {
                        setPendingTeacherReference(null);
                      }
                      setTeacherExpandedIds((current) => {
                        const next = new Set(current);
                        if (next.has(item.id)) next.delete(item.id);
                        else next.add(item.id);
                        return next;
                      });
                    }}
                  >
                    <RichContentField
                      label="小题解析"
                      value={item.solution ?? []}
                      context="solution"
                      inputRef={(element) => {
                        solutionRefs.current[item.id] = element;
                      }}
                      onSelectionChange={(selection) => {
                        solutionSelectionsRef.current[item.id] = selection;
                      }}
                      draftTarget={{
                        kind: 'subQuestionSolution',
                        questionId: question.id,
                        subQuestionId: item.id,
                      }}
                      warning={contentWarnings[`${item.id}:solution`]}
                      onSetWarning={(warning) => onSetWarning(`${item.id}:solution`, warning)}
                      onChange={(solution) =>
                        update((current) =>
                          updateSubQuestion(current, item.id, (currentItem) => ({
                            ...currentItem,
                            solution,
                          })),
                        )
                      }
                      teacherContent={{
                        scoreMarks: item.scoreMarks ?? [],
                        annotations: item.solutionAnnotations ?? [],
                        onCommit: (result) => commitSubQuestionTeacherContent(item.id, result),
                        onConverted: onTeacherContentConverted,
                      }}
                      teacherReferencePlacement={
                        pendingTeacherReference?.subQuestionId === item.id
                          ? {
                              reference: pendingTeacherReference.reference,
                              label: getTeacherReferencePlacementLabel(
                                pendingTeacherReference.reference,
                                item.scoreMarks,
                                item.solutionAnnotations,
                              ),
                              onComplete: () => setPendingTeacherReference(null),
                              onCancel: () => setPendingTeacherReference(null),
                            }
                          : undefined
                      }
                    />
                    <ScoringSchemeTable
                      ownerLabel={`小题 ${itemIndex + 1}`}
                      scoreMode={resolveScoreMode(
                        item.scoreMode,
                        preferredScoreMode,
                        (item.scoreMarks?.length ?? 0) > 0,
                      )}
                      scoreMarks={item.scoreMarks ?? []}
                      solution={item.solution}
                      createId={createId}
                      onScoreModeChange={(scoreMode) => {
                        onPreferredScoreModeChange(scoreMode);
                        update((current) =>
                          updateSubQuestion(current, item.id, (currentItem) => ({
                            ...currentItem,
                            scoreMode,
                          })),
                        );
                      }}
                      onInputWarning={onInputWarning}
                      onChange={(scoreMarks) =>
                        update((current) =>
                          updateSubQuestion(current, item.id, (currentItem) => ({
                            ...currentItem,
                            scoreMarks,
                            scoreMode:
                              scoreMarks.length > 0
                                ? resolveScoreMode(
                                    currentItem.scoreMode,
                                    preferredScoreMode,
                                    (currentItem.scoreMarks?.length ?? 0) > 0,
                                  )
                                : currentItem.scoreMode,
                          })),
                        )
                      }
                      onDelete={(scoreMarkId) =>
                        update((current) =>
                          updateSubQuestion(current, item.id, (currentItem) => ({
                            ...currentItem,
                            solution: removeScoreReferences(currentItem.solution, scoreMarkId),
                            scoreMarks: (currentItem.scoreMarks ?? []).filter(
                              (scoreMark) => scoreMark.id !== scoreMarkId,
                            ),
                          })),
                        )
                      }
                      onLocate={(scoreMarkId) =>
                        locateSubQuestionTeacherReference(item, {
                          type: 'scoreRef',
                          scoreMarkId,
                        })
                      }
                      onReinsert={(scoreMarkId) =>
                        beginSubQuestionTeacherReferencePlacement(item, {
                          type: 'scoreRef',
                          scoreMarkId,
                        })
                      }
                    />
                    <SolutionAnnotationTable
                      ownerLabel={`小题 ${itemIndex + 1}`}
                      annotations={item.solutionAnnotations ?? []}
                      solution={item.solution}
                      onChange={(solutionAnnotations) =>
                        update((current) =>
                          updateSubQuestion(current, item.id, (currentItem) => ({
                            ...currentItem,
                            solutionAnnotations,
                          })),
                        )
                      }
                      onDelete={(annotationId) =>
                        update((current) =>
                          updateSubQuestion(current, item.id, (currentItem) => ({
                            ...currentItem,
                            solution: removeAnnotationReferences(
                              currentItem.solution,
                              annotationId,
                            ),
                            solutionAnnotations: (currentItem.solutionAnnotations ?? []).filter(
                              (annotation) => annotation.id !== annotationId,
                            ),
                          })),
                        )
                      }
                      onLocate={(annotationId) =>
                        locateSubQuestionTeacherReference(item, {
                          type: 'annotationRef',
                          annotationId,
                        })
                      }
                      onReinsert={(annotationId) =>
                        beginSubQuestionTeacherReferencePlacement(item, {
                          type: 'annotationRef',
                          annotationId,
                        })
                      }
                    />
                  </CollapsibleEditorSubsection>
                </>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function useCollapsedItemIds(itemIds: string[]) {
  const [collapsedIds, setCollapsedIds] = useState<ReadonlySet<string>>(() => new Set());
  const allCollapsed = itemIds.length > 0 && itemIds.every((itemId) => collapsedIds.has(itemId));

  return {
    allCollapsed,
    isCollapsed(itemId: string): boolean {
      return collapsedIds.has(itemId);
    },
    toggle(itemId: string): void {
      setCollapsedIds((current) => {
        const next = new Set(current);

        if (next.has(itemId)) {
          next.delete(itemId);
        } else {
          next.add(itemId);
        }

        return next;
      });
    },
    toggleAll(): void {
      setCollapsedIds(allCollapsed ? new Set() : new Set(itemIds));
    },
  };
}

function CollapsibleItemHeader({
  title,
  summary,
  collapsed,
  onToggle,
  actions,
}: {
  title: string;
  summary: ReactNode;
  collapsed: boolean;
  onToggle(): void;
  actions?: ReactNode;
}) {
  return (
    <div className="repeatable-item-header">
      <button
        type="button"
        className="repeatable-item-toggle"
        aria-expanded={!collapsed}
        onClick={onToggle}
      >
        <CollapseToggleIcon collapsed={collapsed} />
        <span className="repeatable-item-copy">
          <span className="repeatable-item-title">{title}</span>
          <span className="repeatable-item-summary">{summary}</span>
        </span>
      </button>
      {actions ? <div className="repeatable-item-actions">{actions}</div> : null}
    </div>
  );
}

function CollapseToggleIcon({ collapsed }: { collapsed: boolean }) {
  const Icon = collapsed ? ChevronRight : ChevronDown;

  return <Icon className="collapse-toggle-icon" aria-hidden="true" />;
}

function CollapsibleEditorSubsection({
  title,
  summary,
  variant = 'default',
  collapsed,
  onToggle,
  children,
}: {
  title: string;
  summary: ReactNode;
  variant?: 'default' | 'inset';
  collapsed: boolean;
  onToggle(): void;
  children: ReactNode;
}) {
  return (
    <section
      className={`editor-subsection collapsible-editor-subsection ${
        collapsed ? 'collapsible-editor-subsection-collapsed' : ''
      } ${variant === 'inset' ? 'collapsible-editor-subsection-inset' : ''}`}
    >
      <button
        type="button"
        className="editor-subsection-toggle"
        aria-expanded={!collapsed}
        onClick={onToggle}
      >
        <span className="editor-subsection-toggle-copy">
          <span className="editor-subsection-heading">{title}</span>
          <span className="editor-subsection-summary">{summary}</span>
        </span>
        <CollapseToggleIcon collapsed={collapsed} />
      </button>
      {!collapsed ? <div className="editor-subsection-content">{children}</div> : null}
    </section>
  );
}

function GlobalChoiceLayoutSection({
  document,
  defaultCollapsed = true,
  onChange,
  onAnswerColorChange,
}: {
  document: ExamDocument;
  defaultCollapsed?: boolean;
  onChange(updater: (current: ExamDocument) => ExamDocument): void;
  onAnswerColorChange(color: 'black' | 'red'): void;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <section
      className={`editor-section choice-layout-editor-section ${
        collapsed ? 'choice-layout-editor-collapsed' : ''
      }`}
    >
      <button
        type="button"
        className="editor-section-toggle choice-layout-section-toggle"
        aria-expanded={!collapsed}
        onClick={() => setCollapsed((current) => !current)}
      >
        <span className="editor-section-toggle-copy">
          <span className="pane-title editor-section-title">选择题排版</span>
          <span className="editor-section-summary">
            {formatGlobalChoiceLayoutSummary(document)}
          </span>
        </span>
        <CollapseToggleIcon collapsed={collapsed} />
      </button>
      {!collapsed ? (
        <div className="choice-layout-editor-body">
          <ChoiceLayoutControls
            scope="global"
            arrangement={getGlobalChoiceArrangementSelection(document)}
            label={getGlobalChoiceLabelSelection(document)}
            labelPosition={getGlobalChoiceLabelPositionSelection(document)}
            horizontalDensity={getGlobalChoiceHorizontalDensitySelection(document)}
            verticalSpacing={getGlobalChoiceVerticalSpacingSelection(document)}
            labelWidth={getGlobalChoiceLabelWidthSelection(document)}
            labelAlignment={getGlobalChoiceLabelAlignmentSelection(document)}
            advancedLayout={resolveGlobalChoiceAdvancedLayout(document)}
            advancedAdjusted={hasGlobalChoiceAdvancedOverrides(document)}
            onArrangementChange={(selection) => {
              if (selection !== 'inherit' && selection !== 'custom') {
                onChange((current) => setGlobalChoiceArrangement(current, selection));
              }
            }}
            onLabelChange={(selection) => {
              if (selection !== 'inherit' && selection !== 'custom') {
                onChange((current) => setGlobalChoiceLabelPreset(current, selection));
              }
            }}
            onLabelPositionChange={(selection) => {
              if (selection !== 'inherit' && selection !== 'custom') {
                onChange((current) => setGlobalChoiceLabelPosition(current, selection));
              }
            }}
            onHorizontalDensityChange={(selection) => {
              if (selection !== 'inherit' && selection !== 'custom') {
                onChange((current) => setGlobalChoiceHorizontalDensity(current, selection));
              }
            }}
            onHorizontalDensityCustomApply={(values) =>
              onChange((current) => setGlobalChoiceHorizontalDensityCustom(current, values))
            }
            onVerticalSpacingChange={(selection) => {
              if (selection !== 'inherit' && selection !== 'custom') {
                onChange((current) => setGlobalChoiceVerticalSpacing(current, selection));
              }
            }}
            onVerticalSpacingCustomApply={(values) =>
              onChange((current) => setGlobalChoiceVerticalSpacingCustom(current, values))
            }
            onLabelWidthChange={(selection) => {
              if (selection !== 'inherit' && selection !== 'custom') {
                onChange((current) => setGlobalChoiceLabelWidth(current, selection));
              }
            }}
            onLabelWidthCustomApply={(value) =>
              onChange((current) => setGlobalChoiceLabelWidthCustom(current, value))
            }
            onLabelAlignmentChange={(selection) => {
              if (selection !== 'inherit' && selection !== 'custom') {
                onChange((current) => setGlobalChoiceLabelAlignment(current, selection));
              }
            }}
          />
          <div className="choice-layout-answer-color">
            <ParenAnswerColorControl
              examZhOptions={document.setup.examZhOptions}
              onChange={onAnswerColorChange}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function GlobalFillinLayoutSection({
  document,
  defaultCollapsed = true,
  onChange,
  onInputWarning,
}: {
  document: ExamDocument;
  defaultCollapsed?: boolean;
  onChange(updater: (current: ExamDocument) => ExamDocument): void;
  onInputWarning(message: string): void;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [advancedCollapsed, setAdvancedCollapsed] = useState(true);
  const noAnswerSelection = getGlobalFillinNoAnswerSelection(document);
  const textColorSelection = getGlobalFillinTextColorSelection(document);
  const boxColorSelection = getGlobalFillinBoxColorSelection(document);
  const parenSelection = getGlobalFillinParenSelection(document);
  const widthSelection = getGlobalFillinWidthSelection(document);
  const counterLabelSelection = getGlobalFillinCounterLabelSelection(document);
  const counterIndex = getGlobalFillinCounterIndex(document);
  const resolved = resolveFillinLayout(document);
  const counterExample = getFillinCounterExample(resolved.counterLabel, counterIndex ?? 1);
  const counterWarning = getFillinCounterRangeWarning(resolved.counterLabel, counterIndex ?? 1);

  return (
    <section
      className={`editor-section fillin-layout-editor-section ${
        collapsed ? 'fillin-layout-editor-collapsed' : ''
      }`}
    >
      <button
        type="button"
        className="editor-section-toggle fillin-layout-section-toggle"
        aria-expanded={!collapsed}
        onClick={() => setCollapsed((current) => !current)}
      >
        <span className="editor-section-toggle-copy">
          <span className="pane-title editor-section-title">填空题排版</span>
          <span className="editor-section-summary">
            {formatGlobalFillinLayoutSummary(document)}
          </span>
        </span>
        <CollapseToggleIcon collapsed={collapsed} />
      </button>
      {!collapsed ? (
        <div className="fillin-layout-editor-body">
          <div className="fillin-layout-controls">
            <label className="field fillin-layout-mode-field">
              <span className="field-label-row">
                <span>学生版留空方式</span>
                <InlineHelp text="答题卡标记使用 exam-zh 默认黑三角；卷面作答保留横线、括号或空白；连续编号适合完形填空等场景。" />
              </span>
              <select
                value={noAnswerSelection}
                onChange={(event) => {
                  const selection = event.target.value as Exclude<
                    FillinNoAnswerSelection,
                    'inherit'
                  >;
                  if (selection !== 'custom') {
                    onChange((current) => setGlobalFillinNoAnswerType(current, selection));
                  }
                }}
              >
                {noAnswerSelection === 'custom' ? (
                  <option value="custom">自定义（保留）</option>
                ) : null}
                <option value="blacktriangle">答题卡标记（默认）</option>
                <option value="none">卷面作答</option>
                <option value="counter">连续编号</option>
              </select>
            </label>

            <FillinColorControl
              label="教师版答案颜色"
              help="只管理教师版填空答案；学生版答题卡黑三角保持黑色。高级 raw 颜色覆盖仍可能同时影响两版。"
              selection={textColorSelection}
              onChange={(selection) =>
                onChange((current) => setGlobalFillinTextColor(current, selection))
              }
            />

            {noAnswerSelection === 'counter' ? (
              <div className="fillin-counter-editor fillin-layout-wide">
                <label className="field">
                  <span>编号样式</span>
                  <select
                    value={counterLabelSelection}
                    onChange={(event) => {
                      const selection = event.target.value as FillinCounterLabelPresetId | 'custom';
                      if (selection !== 'custom') {
                        onChange((current) => setGlobalFillinCounterLabel(current, selection));
                      }
                    }}
                  >
                    {counterLabelSelection === 'custom' ? (
                      <option value="custom">自定义（保留）</option>
                    ) : null}
                    {fillinCounterLabelPresets.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>首个编号值</span>
                  <DraftNumberInput
                    value={counterIndex ?? 1}
                    mode="required"
                    warningLabel="首个编号值"
                    onChange={(value) => {
                      const normalized = Math.max(1, Math.trunc(value ?? 1));
                      if (value !== normalized) {
                        onInputWarning('首个编号值：请输入大于或等于 1 的整数，已按有效整数处理。');
                      }
                      onChange((current) => setGlobalFillinCounterIndex(current, normalized));
                    }}
                    onInvalidInput={onInputWarning}
                  />
                </label>
                <div className="field-hint fillin-counter-example" aria-live="polite">
                  {counterExample}
                </div>
                {counterWarning ? <div className="metadata-warning">{counterWarning}</div> : null}
              </div>
            ) : null}

            <div className="fillin-layout-advanced">
              <button
                type="button"
                className="fillin-layout-advanced-toggle"
                aria-expanded={!advancedCollapsed}
                onClick={() => setAdvancedCollapsed((current) => !current)}
              >
                <span>
                  <span className="fillin-layout-advanced-title">高级样式</span>
                  <span className="editor-section-summary">
                    {hasGlobalFillinAdvancedOverrides(document)
                      ? '括号、框线或跨行方式已调整'
                      : '使用 exam-zh 默认括号、框线和跨行方式'}
                  </span>
                </span>
                <CollapseToggleIcon collapsed={advancedCollapsed} />
              </button>
              {!advancedCollapsed ? (
                <div className="fillin-layout-advanced-content">
                  <label className="field">
                    <span>括号样式</span>
                    <select
                      value={parenSelection}
                      onChange={(event) => {
                        const selection = event.target.value as Exclude<
                          FillinParenSelection,
                          'inherit'
                        >;
                        if (selection !== 'custom') {
                          onChange((current) => setGlobalFillinParenType(current, selection));
                        }
                      }}
                    >
                      {parenSelection === 'custom' ? (
                        <option value="custom">自定义（保留）</option>
                      ) : null}
                      <option value="banjiao">半角（默认）</option>
                      <option value="quanjiao">全角</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>跨行末端</span>
                    <select
                      value={widthSelection}
                      onChange={(event) => {
                        const selection = event.target.value as Exclude<
                          FillinWidthSelection,
                          'inherit'
                        >;
                        if (selection !== 'custom') {
                          onChange((current) => setGlobalFillinWidthType(current, selection));
                        }
                      }}
                    >
                      {widthSelection === 'custom' ? (
                        <option value="custom">自定义（保留）</option>
                      ) : null}
                      <option value="normal">按指定长度（默认）</option>
                      <option value="fill">末行铺满</option>
                    </select>
                  </label>
                  <FillinColorControl
                    label="圆框/方框边界"
                    help="只影响圆圈和方框填空的边界颜色。"
                    selection={boxColorSelection}
                    onChange={(selection) =>
                      onChange((current) => setGlobalFillinBoxColor(current, selection))
                    }
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function FillinColorControl({
  label,
  help,
  selection,
  onChange,
}: {
  label: string;
  help: string;
  selection: FillinColorSelection;
  onChange(selection: Exclude<FillinColorSelection, 'custom'>): void;
}) {
  return (
    <div className="field answer-color-field">
      <span className="field-label-row">
        <span>{label}</span>
        <InlineHelp text={help} />
      </span>
      <div className="color-swatch-group" role="group" aria-label={label}>
        <button
          type="button"
          className={`color-swatch-option ${selection === 'black' ? 'color-swatch-selected' : ''}`}
          aria-pressed={selection === 'black'}
          onClick={() => onChange('black')}
        >
          <span className="color-swatch color-swatch-black" aria-hidden="true" />
          黑色
        </button>
        <button
          type="button"
          className={`color-swatch-option ${selection === 'red' ? 'color-swatch-selected' : ''}`}
          aria-pressed={selection === 'red'}
          onClick={() => onChange('red')}
        >
          <span className="color-swatch color-swatch-red" aria-hidden="true" />
          红色
        </button>
        {selection === 'custom' ? (
          <span className="color-custom-status">自定义（保留）</span>
        ) : null}
      </div>
    </div>
  );
}

function GlobalJudgementSettingsSection({
  document,
  defaultCollapsed = true,
  onChange,
}: {
  document: ExamDocument;
  defaultCollapsed?: boolean;
  onChange(updater: (current: ExamDocument) => ExamDocument): void;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const answerColor = getGlobalJudgementAnswerColor(document);

  return (
    <section
      className={`editor-section judgement-settings-editor-section ${
        collapsed ? 'judgement-settings-editor-collapsed' : ''
      }`}
    >
      <button
        type="button"
        className="editor-section-toggle judgement-settings-section-toggle"
        aria-expanded={!collapsed}
        onClick={() => setCollapsed((current) => !current)}
      >
        <span className="editor-section-toggle-copy">
          <span className="pane-title editor-section-title">判断题设置</span>
          <span className="editor-section-summary">
            教师答案：{answerColor === 'red' ? '红色' : '黑色'}
          </span>
        </span>
        <CollapseToggleIcon collapsed={collapsed} />
      </button>
      {!collapsed ? (
        <div className="judgement-settings-editor-body">
          <FillinColorControl
            label="教师版答案颜色"
            help="只影响判断题教师答案中的对、错或符号；括号和其他题型颜色保持不变。"
            selection={answerColor}
            onChange={(selection) =>
              onChange((current) =>
                setGlobalJudgementAnswerColor(current, selection as JudgementAnswerColorSelection),
              )
            }
          />
        </div>
      ) : null}
    </section>
  );
}

function JudgementAnswerEditor({
  question,
  update,
}: {
  question: ExamQuestion;
  update(updater: (question: ExamQuestion) => ExamQuestion): void;
}) {
  const answer = getJudgementAnswerSelection(question);

  return (
    <div className="judgement-editor" aria-label="判断结果">
      <div className="field judgement-control-group">
        <span>判断结果</span>
        <div className="segmented-control" role="group" aria-label="判断结果">
          {(
            [
              ['unset', '未设置'],
              ['correct', '正确'],
              ['incorrect', '错误'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={answer === value ? 'segmented-active' : ''}
              aria-pressed={answer === value}
              onClick={() => update((current) => setJudgementAnswerSelection(current, value))}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function JudgementAppearanceEditor({
  question,
  update,
}: {
  question: ExamQuestion;
  update(updater: (question: ExamQuestion) => ExamQuestion): void;
}) {
  const answerStyle = getJudgementAnswerStyleSelection(question);

  return (
    <div className="field judgement-control-group">
      <span>答案外观</span>
      <div className="segmented-control" role="group" aria-label="答案外观">
        {(
          [
            ['text', '文字（对/错）'],
            ['symbol', '符号（✓/×）'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={answerStyle === value ? 'segmented-active' : ''}
            aria-pressed={answerStyle === value}
            onClick={() => update((current) => setJudgementAnswerStyle(current, value))}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function formatGlobalFillinLayoutSummary(document: ExamDocument): string {
  const noAnswer = getGlobalFillinNoAnswerSelection(document);
  const noAnswerLabel =
    noAnswer === 'blacktriangle'
      ? '答题卡标记'
      : noAnswer === 'none'
        ? '卷面作答'
        : noAnswer === 'counter'
          ? '连续编号'
          : '自定义留空';
  const color = getGlobalFillinTextColorSelection(document);
  const colorLabel = color === 'red' ? '红色答案' : color === 'black' ? '黑色答案' : '自定义答案色';
  return `${noAnswerLabel} · ${colorLabel}${
    hasGlobalFillinAdvancedOverrides(document) ? ' · 高级样式已调整' : ''
  }`;
}

function ChoiceLayoutControls({
  scope,
  arrangement,
  label,
  labelPosition,
  horizontalDensity,
  verticalSpacing,
  labelWidth,
  labelAlignment,
  advancedLayout,
  resolvedQuestionLayout,
  advancedAdjusted,
  hasCustomLabels = false,
  localCounterActive = false,
  question,
  indexSelection,
  indexValue,
  onArrangementChange,
  onLabelChange,
  onLabelPositionChange,
  onHorizontalDensityChange,
  onHorizontalDensityCustomApply,
  onVerticalSpacingChange,
  onVerticalSpacingCustomApply,
  onLabelWidthChange,
  onLabelWidthCustomApply,
  onLabelAlignmentChange,
  onIndexChange,
  onInputWarning,
  onResetLabels,
}: {
  scope: 'global' | 'question';
  arrangement: ChoiceArrangementSelection;
  label: ChoiceLabelSelection;
  labelPosition: ChoiceLabelPositionSelection;
  horizontalDensity: ChoiceHorizontalDensitySelection;
  verticalSpacing: ChoiceVerticalSpacingSelection;
  labelWidth: ChoiceLabelWidthSelection;
  labelAlignment: ChoiceLabelAlignmentSelection;
  advancedLayout: ResolvedGlobalChoiceAdvancedLayout;
  resolvedQuestionLayout?: ReturnType<typeof resolveChoiceLayout>;
  advancedAdjusted: boolean;
  hasCustomLabels?: boolean;
  localCounterActive?: boolean;
  question?: ExamQuestion;
  indexSelection?: ChoiceIndexSelection;
  indexValue?: number;
  onArrangementChange(selection: ChoiceArrangementSelection): void;
  onLabelChange(selection: ChoiceLabelSelection): void;
  onLabelPositionChange(selection: ChoiceLabelPositionSelection): void;
  onHorizontalDensityChange(selection: ChoiceHorizontalDensitySelection): void;
  onHorizontalDensityCustomApply(values: ChoiceHorizontalDensityValues): void;
  onVerticalSpacingChange(selection: ChoiceVerticalSpacingSelection): void;
  onVerticalSpacingCustomApply(values: ChoiceVerticalSpacingValues): void;
  onLabelWidthChange(selection: ChoiceLabelWidthSelection): void;
  onLabelWidthCustomApply(value: string): void;
  onLabelAlignmentChange(selection: ChoiceLabelAlignmentSelection): void;
  onIndexChange?(value: number | 'inherit'): void;
  onInputWarning?(message: string): void;
  onResetLabels?(): void;
}) {
  const arrangementMode = getChoiceArrangementMode(arrangement);
  const autoSelection = arrangementMode === 'auto' ? arrangement : 'auto-4';
  const fixedSelection = arrangementMode === 'fixed' ? arrangement : 'fixed-2';

  const chooseArrangementMode = (mode: ChoiceArrangementMode) => {
    if (mode === 'inherit') {
      onArrangementChange('inherit');
    } else if (mode === 'auto') {
      onArrangementChange(autoSelection);
    } else if (mode === 'fixed') {
      onArrangementChange(fixedSelection);
    }
  };

  return (
    <div className="choice-layout-controls">
      <div className="field choice-layout-mode-field">
        <span className="field-label-row">
          <span>排列方式</span>
          <InlineHelp text="自动适配会按最宽选项和可用行宽决定列数；固定列数会直接均分每行宽度。" />
        </span>
        <div
          className="segmented-control choice-layout-segmented"
          role="group"
          aria-label="排列方式"
        >
          {scope === 'question' ? (
            <button
              type="button"
              className={arrangementMode === 'inherit' ? 'segmented-active' : ''}
              aria-pressed={arrangementMode === 'inherit'}
              onClick={() => chooseArrangementMode('inherit')}
            >
              跟随试卷
            </button>
          ) : null}
          <button
            type="button"
            className={arrangementMode === 'auto' ? 'segmented-active' : ''}
            aria-pressed={arrangementMode === 'auto'}
            onClick={() => chooseArrangementMode('auto')}
          >
            自动适配
          </button>
          <button
            type="button"
            className={arrangementMode === 'fixed' ? 'segmented-active' : ''}
            aria-pressed={arrangementMode === 'fixed'}
            onClick={() => chooseArrangementMode('fixed')}
          >
            固定列数
          </button>
        </div>
        {arrangementMode === 'custom' ? (
          <span className="field-hint">当前包含自定义列数配置；选择模式后会改用界面预设。</span>
        ) : null}
      </div>

      {arrangementMode === 'auto' ? (
        <label className="field">
          <span>自动上限</span>
          <select
            value={autoSelection}
            onChange={(event) =>
              onArrangementChange(event.target.value as ChoiceArrangementSelection)
            }
          >
            <option value="auto-4">上游默认（最多 4 列）</option>
            <option value="auto-2">最多 2 列</option>
            <option value="auto-1">单列</option>
          </select>
        </label>
      ) : null}

      {arrangementMode === 'fixed' ? (
        <label className="field">
          <span>每行列数</span>
          <select
            value={fixedSelection}
            onChange={(event) =>
              onArrangementChange(event.target.value as ChoiceArrangementSelection)
            }
          >
            <option value="fixed-1">1 列</option>
            <option value="fixed-2">2 列</option>
            <option value="fixed-3">3 列</option>
            <option value="fixed-4">4 列</option>
          </select>
        </label>
      ) : null}

      <label className="field">
        <span>标签样式</span>
        <select
          value={label}
          onChange={(event) => onLabelChange(event.target.value as ChoiceLabelSelection)}
        >
          {scope === 'question' ? <option value="inherit">跟随试卷</option> : null}
          {label === 'custom' ? (
            <option value="custom" disabled>
              自定义（保留）
            </option>
          ) : null}
          {choiceOptionLabelPresets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {scope === 'global' && preset.id === 'Alph' ? '默认（A.）' : preset.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field-label-row">
          <span>标签位置</span>
          <InlineHelp text="自动会让普通文本标签靠左上；较高的图片类选项会近似为左侧居中。" />
        </span>
        <select
          value={labelPosition}
          onChange={(event) =>
            onLabelPositionChange(event.target.value as ChoiceLabelPositionSelection)
          }
        >
          {scope === 'question' ? <option value="inherit">跟随试卷</option> : null}
          {labelPosition === 'custom' ? (
            <option value="custom" disabled>
              自定义（保留）
            </option>
          ) : null}
          {choiceLabelPositionOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {localCounterActive ? (
        <div className="field-hint choice-layout-wide-hint">
          当前由本题标签样式生成显示标签；原逐项标签已保留，切回“跟随试卷”后恢复。
        </div>
      ) : null}

      {hasCustomLabels && !localCounterActive ? (
        <div className="choice-layout-custom-labels choice-layout-wide-hint">
          <span className="field-hint">逐项自定义标签正在覆盖试卷默认标签样式。</span>
          <button type="button" className="mini-button" onClick={onResetLabels}>
            恢复默认标签
          </button>
        </div>
      ) : null}

      <AdvancedChoiceLayoutControls
        scope={scope}
        horizontalDensity={horizontalDensity}
        verticalSpacing={verticalSpacing}
        labelWidth={labelWidth}
        labelAlignment={labelAlignment}
        advancedLayout={advancedLayout}
        advancedAdjusted={advancedAdjusted}
        inactiveLabelControls={hasCustomLabels && !localCounterActive}
        question={question}
        resolvedLayout={resolvedQuestionLayout}
        indexSelection={indexSelection}
        indexValue={indexValue}
        onHorizontalDensityChange={onHorizontalDensityChange}
        onHorizontalDensityCustomApply={onHorizontalDensityCustomApply}
        onVerticalSpacingChange={onVerticalSpacingChange}
        onVerticalSpacingCustomApply={onVerticalSpacingCustomApply}
        onLabelWidthChange={onLabelWidthChange}
        onLabelWidthCustomApply={onLabelWidthCustomApply}
        onLabelAlignmentChange={onLabelAlignmentChange}
        onIndexChange={onIndexChange}
        onInputWarning={onInputWarning}
      />
    </div>
  );
}

type ChoiceCustomEditorKind = 'horizontal' | 'vertical' | 'labelWidth';

function AdvancedChoiceLayoutControls({
  scope,
  horizontalDensity,
  verticalSpacing,
  labelWidth,
  labelAlignment,
  advancedLayout,
  advancedAdjusted,
  inactiveLabelControls,
  question,
  resolvedLayout,
  indexSelection,
  indexValue,
  onHorizontalDensityChange,
  onHorizontalDensityCustomApply,
  onVerticalSpacingChange,
  onVerticalSpacingCustomApply,
  onLabelWidthChange,
  onLabelWidthCustomApply,
  onLabelAlignmentChange,
  onIndexChange,
  onInputWarning,
}: {
  scope: 'global' | 'question';
  horizontalDensity: ChoiceHorizontalDensitySelection;
  verticalSpacing: ChoiceVerticalSpacingSelection;
  labelWidth: ChoiceLabelWidthSelection;
  labelAlignment: ChoiceLabelAlignmentSelection;
  advancedLayout: ResolvedGlobalChoiceAdvancedLayout;
  advancedAdjusted: boolean;
  inactiveLabelControls: boolean;
  question?: ExamQuestion;
  resolvedLayout?: ReturnType<typeof resolveChoiceLayout>;
  indexSelection?: ChoiceIndexSelection;
  indexValue?: number;
  onHorizontalDensityChange(selection: ChoiceHorizontalDensitySelection): void;
  onHorizontalDensityCustomApply(values: ChoiceHorizontalDensityValues): void;
  onVerticalSpacingChange(selection: ChoiceVerticalSpacingSelection): void;
  onVerticalSpacingCustomApply(values: ChoiceVerticalSpacingValues): void;
  onLabelWidthChange(selection: ChoiceLabelWidthSelection): void;
  onLabelWidthCustomApply(value: string): void;
  onLabelAlignmentChange(selection: ChoiceLabelAlignmentSelection): void;
  onIndexChange?(value: number | 'inherit'): void;
  onInputWarning?(message: string): void;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const [customEditor, setCustomEditor] = useState<ChoiceCustomEditorKind | null>(null);
  const hasIndexOverride = indexSelection !== undefined && indexSelection !== 'inherit';
  const questionOptions = question ? getQuestionChoiceOptions(question) : undefined;
  const customFieldValue = (
    key: string,
    effectiveValue: string,
    selection:
      ChoiceHorizontalDensitySelection | ChoiceVerticalSpacingSelection | ChoiceLabelWidthSelection,
  ) => {
    if (scope !== 'question' || selection !== 'custom') {
      return effectiveValue;
    }

    const value = questionOptions?.[key];
    return typeof value === 'string' ? value : '';
  };

  const customEditorFields =
    customEditor === 'horizontal'
      ? [
          {
            key: 'columnSep',
            label: '选项列间距',
            value: customFieldValue('column-sep', advancedLayout.columnSep, horizontalDensity),
          },
          {
            key: 'labelSep',
            label: '标签与内容间距',
            value: customFieldValue('label-sep', advancedLayout.labelSep, horizontalDensity),
          },
        ]
      : customEditor === 'vertical'
        ? [
            {
              key: 'topSep',
              label: '选项组上方',
              value: customFieldValue('top-sep', advancedLayout.topSep, verticalSpacing),
            },
            {
              key: 'bottomSep',
              label: '选项组下方',
              value: customFieldValue('bottom-sep', advancedLayout.bottomSep, verticalSpacing),
            },
            {
              key: 'lineSep',
              label: '选项行间距',
              value: customFieldValue('linesep', advancedLayout.lineSep, verticalSpacing),
            },
          ]
        : customEditor === 'labelWidth'
          ? [
              {
                key: 'labelWidth',
                label: '标签最小预留宽度',
                value: customFieldValue('label-width', advancedLayout.labelWidth, labelWidth),
              },
            ]
          : [];

  return (
    <div className="choice-layout-advanced">
      <button
        type="button"
        className="choice-layout-advanced-toggle"
        aria-expanded={!collapsed}
        onClick={() => setCollapsed((current) => !current)}
      >
        <span>
          <span className="choice-layout-advanced-title">高级排版</span>
          <span className="editor-subsection-summary">
            {advancedAdjusted || hasIndexOverride
              ? '已调整间距、标签占位或起始序号'
              : scope === 'global'
                ? '使用 exam-zh 默认值'
                : '跟随试卷'}
          </span>
        </span>
        <CollapseToggleIcon collapsed={collapsed} />
      </button>

      {!collapsed ? (
        <div className="choice-layout-advanced-content">
          <ChoiceAdvancedPresetField
            label="横向密度"
            selection={horizontalDensity}
            scope={scope}
            options={choiceHorizontalDensityPresets}
            customEditorActive={customEditor === 'horizontal'}
            onChange={(selection) => {
              if (selection === 'custom') {
                setCustomEditor('horizontal');
              } else {
                setCustomEditor(null);
                onHorizontalDensityChange(selection as ChoiceHorizontalDensitySelection);
              }
            }}
            onEditCustom={() => setCustomEditor('horizontal')}
          />

          <ChoiceAdvancedPresetField
            label="纵向留白"
            selection={verticalSpacing}
            scope={scope}
            options={choiceVerticalSpacingPresets}
            customEditorActive={customEditor === 'vertical'}
            onChange={(selection) => {
              if (selection === 'custom') {
                setCustomEditor('vertical');
              } else {
                setCustomEditor(null);
                onVerticalSpacingChange(selection as ChoiceVerticalSpacingSelection);
              }
            }}
            onEditCustom={() => setCustomEditor('vertical')}
          />

          <ChoiceAdvancedPresetField
            label="标签预留宽度"
            selection={labelWidth}
            scope={scope}
            options={choiceLabelWidthPresets}
            disabled={inactiveLabelControls}
            customEditorActive={customEditor === 'labelWidth'}
            onChange={(selection) => {
              if (selection === 'custom') {
                setCustomEditor('labelWidth');
              } else {
                setCustomEditor(null);
                onLabelWidthChange(selection as ChoiceLabelWidthSelection);
              }
            }}
            onEditCustom={() => setCustomEditor('labelWidth')}
          />

          <label className="field">
            <span className="field-label-row">
              <span>标签对齐</span>
              <InlineHelp text="只有预留宽度大于标签自然宽度时，对齐差异才会明显。" />
            </span>
            <select
              value={labelAlignment}
              disabled={inactiveLabelControls}
              onChange={(event) =>
                onLabelAlignmentChange(event.target.value as ChoiceLabelAlignmentSelection)
              }
            >
              {scope === 'question' ? <option value="inherit">跟随试卷</option> : null}
              {labelAlignment === 'custom' ? (
                <option value="custom" disabled>
                  自定义（保留）
                </option>
              ) : null}
              {choiceLabelAlignmentOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {scope === 'global' && option.id === 'left' ? '默认（左对齐）' : option.label}
                </option>
              ))}
            </select>
          </label>

          {scope === 'question' && question && resolvedLayout && indexSelection && onIndexChange ? (
            <ChoiceIndexControl
              question={question}
              layout={resolvedLayout}
              selection={indexSelection}
              value={indexValue}
              disabled={inactiveLabelControls}
              onChange={onIndexChange}
              onInputWarning={onInputWarning}
            />
          ) : null}

          {inactiveLabelControls ? (
            <div className="field-hint choice-layout-advanced-wide">
              逐项自定义标签正在生效；标签占位、对齐和起始序号会保留，但暂不影响输出。
            </div>
          ) : null}

          <div className="field-hint choice-layout-advanced-wide">
            标签预留宽度是最小值；真实标签更宽时，exam-zh 会自动扩展而不会裁切。
          </div>

          {customEditor ? (
            <ChoiceCustomDimensionEditor
              key={customEditor}
              title={
                customEditor === 'horizontal'
                  ? '自定义横向密度'
                  : customEditor === 'vertical'
                    ? '自定义纵向留白'
                    : '自定义标签预留宽度'
              }
              fields={customEditorFields}
              onApply={(values) => {
                if (customEditor === 'horizontal') {
                  onHorizontalDensityCustomApply({
                    columnSep: values.columnSep ?? '',
                    labelSep: values.labelSep ?? '',
                  });
                } else if (customEditor === 'vertical') {
                  onVerticalSpacingCustomApply({
                    topSep: values.topSep ?? '',
                    bottomSep: values.bottomSep ?? '',
                    lineSep: values.lineSep ?? '',
                  });
                } else {
                  onLabelWidthCustomApply(values.labelWidth ?? '');
                }

                setCustomEditor(null);
              }}
              onCancel={() => setCustomEditor(null)}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ChoiceAdvancedPresetField({
  label,
  selection,
  scope,
  options,
  disabled = false,
  customEditorActive,
  onChange,
  onEditCustom,
}: {
  label: string;
  selection: string;
  scope: 'global' | 'question';
  options: readonly { id: string; label: string }[];
  disabled?: boolean;
  customEditorActive: boolean;
  onChange(selection: string): void;
  onEditCustom(): void;
}) {
  return (
    <div className="field choice-advanced-preset-field">
      <span>{label}</span>
      <div className="choice-advanced-preset-control">
        <select
          value={selection}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        >
          {scope === 'question' ? <option value="inherit">跟随试卷</option> : null}
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.id === 'upstream'
                ? scope === 'global'
                  ? '默认（上游）'
                  : '上游默认'
                : scope === 'question' && option.id === 'auto'
                  ? '上游默认（自动测量）'
                  : option.label}
            </option>
          ))}
          <option value="custom">{selection === 'custom' ? '自定义（保留）' : '自定义…'}</option>
        </select>
        {selection === 'custom' || customEditorActive ? (
          <button type="button" className="mini-button" disabled={disabled} onClick={onEditCustom}>
            编辑
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ChoiceCustomDimensionEditor({
  title,
  fields,
  onApply,
  onCancel,
}: {
  title: string;
  fields: Array<{ key: string; label: string; value: string }>;
  onApply(values: Record<string, string>): void;
  onCancel(): void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((field) => [field.key, field.value])),
  );

  return (
    <div className="choice-custom-dimension-editor choice-layout-advanced-wide">
      <div className="choice-custom-dimension-header">
        <span>{title}</span>
        <span className="field-hint">支持 exam-zh 可接受的 LaTeX 长度或弹性间距。</span>
      </div>
      <div className="choice-custom-dimension-fields">
        {fields.map((field) => (
          <label key={field.key} className="field">
            <span>{field.label}</span>
            <input
              type="text"
              value={values[field.key] ?? ''}
              onChange={(event) =>
                setValues((current) => ({ ...current, [field.key]: event.target.value }))
              }
            />
          </label>
        ))}
      </div>
      <div className="choice-custom-dimension-actions">
        <button type="button" className="mini-button" onClick={onCancel}>
          取消
        </button>
        <button
          type="button"
          className="mini-button mini-button-primary"
          onClick={() => onApply(values)}
        >
          应用
        </button>
      </div>
    </div>
  );
}

function ChoiceIndexControl({
  question,
  layout,
  selection,
  value,
  disabled,
  onChange,
  onInputWarning,
}: {
  question: ExamQuestion;
  layout: ReturnType<typeof resolveChoiceLayout>;
  selection: ChoiceIndexSelection;
  value?: number;
  disabled: boolean;
  onChange(value: number | 'inherit'): void;
  onInputWarning?(message: string): void;
}) {
  const effectiveValue = value ?? layout.index;
  const [draft, setDraft] = useState<string | null>(null);
  const displayedDraft = draft ?? String(effectiveValue);
  const draftNumber = /^\d+$/u.test(displayedDraft.trim()) ? Number(displayedDraft) : undefined;
  const previewIndex = draftNumber && draftNumber >= 1 ? draftNumber : effectiveValue;
  const warning = getChoiceIndexRangeWarning(question, layout, previewIndex);

  const commitDraft = () => {
    if (draftNumber === undefined || draftNumber < 1) {
      onInputWarning?.('起始序号必须是大于等于 1 的整数。');
      setDraft(null);
      return;
    }

    onChange(draftNumber);
    setDraft(null);
  };

  return (
    <div className="field choice-index-field">
      <span>起始序号</span>
      <div className="choice-index-control">
        <select
          value={selection}
          disabled={disabled}
          onChange={(event) => {
            const next = event.target.value as ChoiceIndexSelection;
            onChange(next === 'inherit' ? 'inherit' : effectiveValue);
          }}
        >
          <option value="inherit">跟随试卷</option>
          <option value="specified">从指定序号开始</option>
          {selection === 'custom' ? (
            <option value="custom" disabled>
              自定义（保留）
            </option>
          ) : null}
        </select>
        {selection === 'specified' ? (
          <input
            type="number"
            min={1}
            step={1}
            value={displayedDraft}
            disabled={disabled}
            aria-label="选项起始序号"
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commitDraft}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur();
              }
            }}
          />
        ) : null}
      </div>
      {selection === 'specified' ? (
        <span className="field-hint">{getChoiceIndexExample(question, layout, previewIndex)}</span>
      ) : null}
      {selection === 'custom' ? (
        <span className="field-hint">当前起始序号不是有效正整数；选择模式后才会覆盖原值。</span>
      ) : null}
      {warning ? <span className="field-warning">{warning}</span> : null}
    </div>
  );
}

function formatGlobalChoiceLayoutSummary(document: ExamDocument): string {
  const arrangement = getGlobalChoiceArrangementSelection(document);
  const label = getGlobalChoiceLabelSelection(document);
  const position = getGlobalChoiceLabelPositionSelection(document);

  const summary = `${formatChoiceArrangementSelection(arrangement)} · ${formatChoiceLabelSelection(
    label,
    true,
  )} · ${formatChoicePositionSelection(position)}`;

  return hasGlobalChoiceAdvancedOverrides(document) ? `${summary} · 高级排版已调整` : summary;
}

function formatQuestionChoiceLayoutSummary(document: ExamDocument, question: ExamQuestion): string {
  const arrangement = getQuestionChoiceArrangementSelection(question);
  const label = getQuestionChoiceLabelSelection(question);
  const position = getQuestionChoiceLabelPositionSelection(question);
  const resolved = resolveChoiceLayout(document, question);
  const followsGlobal = arrangement === 'inherit' && label === 'inherit' && position === 'inherit';
  const summary = `${formatResolvedChoiceArrangement(resolved)} · ${formatResolvedChoiceLabel(
    resolved,
  )} · ${formatChoicePositionSelection(resolved.labelPosition)}`;

  const inheritedSummary =
    followsGlobal && !resolved.hasCustomLabels ? `跟随试卷 · ${summary}` : summary;
  const withAdvanced = hasQuestionChoiceAdvancedOverrides(question)
    ? `${inheritedSummary} · 高级排版已调整`
    : inheritedSummary;

  if (resolved.index === 1 || resolved.labelSource === 'custom-labels') {
    return withAdvanced;
  }

  const firstLabel = getResolvedChoiceDisplayLabel(question, 0, resolved);
  return `${withAdvanced} · 首项 ${firstLabel}`;
}

function formatChoiceArrangementSelection(selection: ChoiceArrangementSelection): string {
  const mode = getChoiceArrangementMode(selection);

  if (mode === 'custom') {
    return '自定义排列';
  }

  if (mode === 'inherit') {
    return '跟随试卷';
  }

  const value = selection.slice(selection.lastIndexOf('-') + 1);
  return mode === 'fixed' ? `固定 ${value} 列` : `自动最多 ${value} 列`;
}

function formatResolvedChoiceArrangement(layout: ReturnType<typeof resolveChoiceLayout>): string {
  return layout.columns && layout.columns >= 1
    ? `固定 ${layout.columns} 列`
    : `自动最多 ${layout.maxColumns} 列`;
}

function formatChoiceLabelSelection(selection: ChoiceLabelSelection, global = false): string {
  if (selection === 'inherit') {
    return '跟随试卷';
  }

  if (selection === 'custom') {
    return '自定义标签样式';
  }

  const preset = choiceOptionLabelPresets.find((item) => item.id === selection);
  return global && selection === 'Alph' ? '默认 A.' : (preset?.label ?? '默认 A.');
}

function formatResolvedChoiceLabel(layout: ReturnType<typeof resolveChoiceLayout>): string {
  if (layout.labelSource === 'custom-labels') {
    return '逐项自定义标签';
  }

  const preset = choiceOptionLabelPresets.find((item) => item.value === layout.label.trim());
  return preset?.label ?? '自定义标签样式';
}

function formatChoicePositionSelection(
  selection: ChoiceLabelPositionSelection | ChoiceLabelPosition,
): string {
  if (selection === 'inherit') {
    return '位置跟随试卷';
  }

  if (selection === 'custom') {
    return '自定义位置';
  }

  return `位置${choiceLabelPositionOptions.find((item) => item.id === selection)?.label ?? '自动'}`;
}

function ParenAnswerColorControl({
  examZhOptions,
  onChange,
}: {
  examZhOptions: ExamZhOptionBag | undefined;
  onChange(color: 'black' | 'red'): void;
}) {
  const selection = getParenAnswerColorSelection(examZhOptions);

  return (
    <div className="field answer-color-field">
      <span className="field-label-row">
        <span>选择题答案颜色</span>
        <InlineHelp text="只影响教师版括号内的答案字母，括号本身保持黑色。" />
      </span>
      <div className="color-swatch-group" role="group" aria-label="选择题答案颜色">
        <button
          type="button"
          className={`color-swatch-option ${selection === 'black' ? 'color-swatch-selected' : ''}`}
          aria-pressed={selection === 'black'}
          onClick={() => onChange('black')}
        >
          <span className="color-swatch color-swatch-black" aria-hidden="true" />
          黑色
        </button>
        <button
          type="button"
          className={`color-swatch-option ${selection === 'red' ? 'color-swatch-selected' : ''}`}
          aria-pressed={selection === 'red'}
          onClick={() => onChange('red')}
        >
          <span className="color-swatch color-swatch-red" aria-hidden="true" />
          红色
        </button>
        {selection === 'custom' ? (
          <span className="color-custom-status">自定义（保留）</span>
        ) : null}
      </div>
    </div>
  );
}

function HeaderAdvancedOptionsEditor({
  examZhOptions,
  informationSpacing,
  warningSpacing,
  onChange,
  onInformationSpacingChange,
  onWarningSpacingChange,
  onInputWarning,
}: {
  examZhOptions: ExamZhOptionBag | undefined;
  informationSpacing: FrontMatterSpacing | undefined;
  warningSpacing: FrontMatterSpacing | undefined;
  onChange(updates: Record<string, ExamZhOptionBag[string] | undefined>): void;
  onInformationSpacingChange(spacing: FrontMatterSpacing | undefined): void;
  onWarningSpacingChange(spacing: FrontMatterSpacing | undefined): void;
  onInputWarning(message: string): void;
}) {
  const noticeLabelPreset = getNoticeLabelPreset(examZhOptions);
  const noticeLabelFormatPreset = getNoticeLabelFormatPreset(examZhOptions);
  const titleSpacingPreset = getSpacingPreset(
    examZhOptions,
    'title/top-sep',
    'title/bottom-sep',
    {
      top: '-.75em plus .2em minus .1em',
      bottom: '-.25em plus .2em minus .1em',
    },
    {
      top: '0em plus .3em minus .2em',
      bottom: '.5em plus .3em minus .2em',
    },
  );
  const noticeSpacingPreset = getSpacingPreset(
    examZhOptions,
    'notice/top-sep',
    'notice/bottom-sep',
    {
      top: '.1em plus .1em minus .05em',
      bottom: '.1em plus .1em minus .05em',
    },
    {
      top: '.6em plus .25em minus .1em',
      bottom: '.6em plus .25em minus .1em',
    },
  );

  const updateNoticeLabelPreset = (preset: NoticeLabelOptionId) => {
    switch (preset) {
      case 'default':
        onChange({ 'notice/label': undefined });
        break;
      case 'answerGuide':
        onChange({ 'notice/label': '答题须知：' });
        break;
      case 'instructions':
        onChange({ 'notice/label': '说明：' });
        break;
      case 'tip':
        onChange({ 'notice/label': '温馨提示：' });
        break;
      case 'custom':
        onChange({
          'notice/label': getHeaderOptionString(examZhOptions, 'notice/label') ?? '注意事项：',
        });
        break;
    }
  };

  const updateNoticeLabelFormatPreset = (preset: NoticeLabelFormatOptionId) => {
    switch (preset) {
      case 'default':
        onChange({ 'notice/label-format': undefined });
        break;
      case 'normal':
        onChange({ 'notice/label-format': '\\normalfont' });
        break;
      case 'bold':
        onChange({ 'notice/label-format': '\\bfseries' });
        break;
      case 'custom':
        onChange({
          'notice/label-format':
            getHeaderOptionString(examZhOptions, 'notice/label-format') ??
            upstreamHeaderDefaults.noticeLabelFormat,
        });
        break;
    }
  };

  const updateTitleSpacingPreset = (preset: SpacingPresetOptionId) => {
    updateSpacingPreset(
      preset,
      titleSpacingPreset,
      examZhOptions,
      onChange,
      'title/top-sep',
      'title/bottom-sep',
      {
        top: '-.75em plus .2em minus .1em',
        bottom: '-.25em plus .2em minus .1em',
      },
      {
        top: '0em plus .3em minus .2em',
        bottom: '.5em plus .3em minus .2em',
      },
      {
        top: upstreamHeaderDefaults.titleTopSep,
        bottom: upstreamHeaderDefaults.titleBottomSep,
      },
    );
  };

  const updateNoticeSpacingPreset = (preset: SpacingPresetOptionId) => {
    updateSpacingPreset(
      preset,
      noticeSpacingPreset,
      examZhOptions,
      onChange,
      'notice/top-sep',
      'notice/bottom-sep',
      {
        top: '.1em plus .1em minus .05em',
        bottom: '.1em plus .1em minus .05em',
      },
      {
        top: '.6em plus .25em minus .1em',
        bottom: '.6em plus .25em minus .1em',
      },
      {
        top: upstreamHeaderDefaults.noticeTopSep,
        bottom: upstreamHeaderDefaults.noticeBottomSep,
      },
    );
  };

  return (
    <div className="front-matter-advanced-editor">
      <div className="advanced-options-grid">
        <label className="field">
          <span>注意事项标题</span>
          <select
            value={noticeLabelPreset}
            onChange={(event) => updateNoticeLabelPreset(event.target.value as NoticeLabelOptionId)}
          >
            {noticeLabelOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {noticeLabelPreset === 'custom' ? (
          <TextField
            label="自定义注意事项标题"
            value={getHeaderOptionString(examZhOptions, 'notice/label') ?? ''}
            onChange={(value) => onChange({ 'notice/label': value })}
          />
        ) : null}
        <label className="field">
          <span>注意事项标题样式</span>
          <select
            value={noticeLabelFormatPreset}
            onChange={(event) =>
              updateNoticeLabelFormatPreset(event.target.value as NoticeLabelFormatOptionId)
            }
          >
            {noticeLabelFormatOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {noticeLabelFormatPreset === 'custom' ? (
          <TextField
            label="自定义标题样式"
            value={getHeaderOptionString(examZhOptions, 'notice/label-format') ?? ''}
            onChange={(value) => onChange({ 'notice/label-format': value })}
          />
        ) : null}
        <SpacingPresetEditor
          label="标题区间距"
          preset={titleSpacingPreset}
          topValue={getHeaderOptionString(examZhOptions, 'title/top-sep') ?? ''}
          bottomValue={getHeaderOptionString(examZhOptions, 'title/bottom-sep') ?? ''}
          topLabel="标题区上方"
          bottomLabel="标题区下方"
          onPresetChange={updateTitleSpacingPreset}
          onTopChange={(value) => onChange({ 'title/top-sep': value })}
          onBottomChange={(value) => onChange({ 'title/bottom-sep': value })}
        />
        <SpacingPresetEditor
          label="注意事项间距"
          preset={noticeSpacingPreset}
          topValue={getHeaderOptionString(examZhOptions, 'notice/top-sep') ?? ''}
          bottomValue={getHeaderOptionString(examZhOptions, 'notice/bottom-sep') ?? ''}
          topLabel="注意事项上方"
          bottomLabel="注意事项下方"
          onPresetChange={updateNoticeSpacingPreset}
          onTopChange={(value) => onChange({ 'notice/top-sep': value })}
          onBottomChange={(value) => onChange({ 'notice/bottom-sep': value })}
        />
        <FrontMatterSpacingControl
          label="个人信息栏间距"
          value={informationSpacing}
          presets={informationSpacingPresets}
          customSeed={informationSpacingPresets.moderate}
          onChange={onInformationSpacingChange}
          onInputWarning={onInputWarning}
        />
        <FrontMatterSpacingControl
          label="警告语间距"
          value={warningSpacing}
          presets={warningSpacingPresets}
          customSeed={warningSpacingPresets.moderate}
          onChange={onWarningSpacingChange}
          onInputWarning={onInputWarning}
        />
      </div>
    </div>
  );
}

function SpacingPresetEditor({
  label,
  preset,
  topValue,
  bottomValue,
  topLabel,
  bottomLabel,
  onPresetChange,
  onTopChange,
  onBottomChange,
}: {
  label: string;
  preset: SpacingPresetOptionId;
  topValue: string;
  bottomValue: string;
  topLabel: string;
  bottomLabel: string;
  onPresetChange(preset: SpacingPresetOptionId): void;
  onTopChange(value: string): void;
  onBottomChange(value: string): void;
}) {
  return (
    <div className="spacing-preset-editor">
      <label className="field">
        <span>{label}</span>
        <select
          value={preset}
          onChange={(event) => onPresetChange(event.target.value as SpacingPresetOptionId)}
        >
          {spacingPresetOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {preset === 'custom' ? (
        <div className="spacing-custom-grid">
          <TextField label={topLabel} value={topValue} onChange={onTopChange} />
          <TextField label={bottomLabel} value={bottomValue} onChange={onBottomChange} />
        </div>
      ) : null}
    </div>
  );
}

function getNoticeLabelPreset(options: ExamZhOptionBag | undefined): NoticeLabelOptionId {
  const value = getHeaderOptionString(options, 'notice/label');

  if (value === undefined || value === upstreamHeaderDefaults.noticeLabel) {
    return 'default';
  }

  if (value === '答题须知：') {
    return 'answerGuide';
  }

  if (value === '说明：') {
    return 'instructions';
  }

  if (value === '温馨提示：') {
    return 'tip';
  }

  return 'custom';
}

function getNoticeLabelFormatPreset(
  options: ExamZhOptionBag | undefined,
): NoticeLabelFormatOptionId {
  const value = getHeaderOptionString(options, 'notice/label-format');

  if (value === undefined) {
    return 'default';
  }

  if (value === '\\normalfont') {
    return 'normal';
  }

  if (value === '\\bfseries') {
    return 'bold';
  }

  return 'custom';
}

function getSpacingPreset(
  options: ExamZhOptionBag | undefined,
  topKey: string,
  bottomKey: string,
  compact: { top: string; bottom: string },
  loose: { top: string; bottom: string },
): SpacingPresetOptionId {
  const top = getHeaderOptionString(options, topKey);
  const bottom = getHeaderOptionString(options, bottomKey);

  if (top === undefined && bottom === undefined) {
    return 'default';
  }

  if (top === compact.top && bottom === compact.bottom) {
    return 'compact';
  }

  if (top === loose.top && bottom === loose.bottom) {
    return 'loose';
  }

  return 'custom';
}

function updateSpacingPreset(
  nextPreset: SpacingPresetOptionId,
  currentPreset: SpacingPresetOptionId,
  options: ExamZhOptionBag | undefined,
  onChange: (updates: Record<string, ExamZhOptionBag[string] | undefined>) => void,
  topKey: string,
  bottomKey: string,
  compact: { top: string; bottom: string },
  loose: { top: string; bottom: string },
  customSeed: { top: string; bottom: string },
): void {
  switch (nextPreset) {
    case 'default':
      onChange({ [topKey]: undefined, [bottomKey]: undefined });
      break;
    case 'compact':
      onChange({ [topKey]: compact.top, [bottomKey]: compact.bottom });
      break;
    case 'loose':
      onChange({ [topKey]: loose.top, [bottomKey]: loose.bottom });
      break;
    case 'custom':
      onChange({
        [topKey]:
          currentPreset === 'custom'
            ? (getHeaderOptionString(options, topKey) ?? customSeed.top)
            : customSeed.top,
        [bottomKey]:
          currentPreset === 'custom'
            ? (getHeaderOptionString(options, bottomKey) ?? customSeed.bottom)
            : customSeed.bottom,
      });
      break;
  }
}

function getHeaderOptionString(
  options: ExamZhOptionBag | undefined,
  key: string,
): string | undefined {
  const value = options?.[key];

  if (value === undefined) {
    return undefined;
  }

  return String(value);
}

function InformationFieldsEditor({
  fields,
  placement,
  separator,
  onInputWarning,
  onLabelDraftChange,
  onLabelDraftEnd,
  onChange,
  onPlacementChange,
  onSeparatorChange,
}: {
  fields: InformationField[];
  placement: InformationPlacement;
  separator: InformationSeparatorSetup | undefined;
  onInputWarning(message: string): void;
  onLabelDraftChange(target: TextPreviewDraftTarget, value: string): void;
  onLabelDraftEnd(target: TextPreviewDraftTarget): void;
  onChange(fields: InformationField[]): void;
  onPlacementChange(placement: InformationPlacement): void;
  onSeparatorChange(separator: InformationSeparatorSetup | undefined): void;
}) {
  const collapsedItems = useCollapsedItemIds(fields.map((_, index) => `information-${index}`));
  const updateField = (
    fieldIndex: number,
    updater: (field: InformationField) => InformationField,
  ) => {
    const currentField = fields[fieldIndex];

    if (!currentField) {
      return;
    }

    onChange(replaceInformationField(fields, fieldIndex, updater(currentField)));
  };

  return (
    <div className="nested-editor information-fields-editor">
      <div className="repeatable-collection-toolbar">
        <div className="information-field-settings">
          <label className="field">
            <span>位置</span>
            <select
              value={placement}
              onChange={(event) => onPlacementChange(event.target.value as InformationPlacement)}
            >
              {Object.entries(informationPlacementLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <InformationSeparatorControl
            value={separator}
            onChange={onSeparatorChange}
            onInputWarning={onInputWarning}
          />
        </div>
        <button
          type="button"
          className="mini-button"
          onClick={() => onChange(addInformationField(fields, createInformationField()))}
        >
          添加信息栏
        </button>
      </div>
      {fields.length === 0 ? (
        <div className="empty-panel">暂无卷首信息栏</div>
      ) : (
        fields.map((field, fieldIndex) => {
          const itemId = `information-${fieldIndex}`;
          const collapsed = collapsedItems.isCollapsed(itemId);

          return (
            <div
              key={`${field.label}-${fieldIndex}`}
              className={`information-field-card ${collapsed ? 'repeatable-item-collapsed' : ''}`}
            >
              <CollapsibleItemHeader
                title={`${fieldIndex + 1}. ${field.label}`}
                summary={`${informationFieldKindLabels[field.kind]}${
                  field.kind === 'line'
                    ? ` · ${field.width ?? '6em'}`
                    : field.kind === 'squares'
                      ? ` · ${field.length} 格`
                      : ''
                }`}
                collapsed={collapsed}
                onToggle={() => collapsedItems.toggle(itemId)}
                actions={
                  <>
                    <IconButton
                      title="上移信息栏"
                      disabled={fieldIndex === 0}
                      onClick={() => onChange(moveInformationField(fields, fieldIndex, 'up'))}
                      icon={<ArrowUp aria-hidden="true" size={15} />}
                    />
                    <IconButton
                      title="下移信息栏"
                      disabled={fieldIndex === fields.length - 1}
                      onClick={() => onChange(moveInformationField(fields, fieldIndex, 'down'))}
                      icon={<ArrowDown aria-hidden="true" size={15} />}
                    />
                    <IconButton
                      title="删除信息栏"
                      onClick={() => onChange(removeInformationField(fields, fieldIndex))}
                      icon={<Trash2 aria-hidden="true" size={15} />}
                    />
                  </>
                }
              />
              {!collapsed ? (
                <div className="information-field-row">
                  <TextField
                    label="字段名"
                    value={field.label}
                    draftTarget={{ kind: 'informationFieldLabel', index: fieldIndex }}
                    onDraftChange={onLabelDraftChange}
                    onDraftEnd={onLabelDraftEnd}
                    onChange={(value) => {
                      if (value.trim().length === 0) {
                        onInputWarning('卷首信息栏字段名不能为空。');
                        return;
                      }

                      updateField(fieldIndex, (current) => ({ ...current, label: value }));
                    }}
                  />
                  <label className="field">
                    <span>样式</span>
                    <select
                      value={field.kind}
                      onChange={(event) =>
                        updateField(fieldIndex, (current) =>
                          normalizeInformationFieldKind(
                            current,
                            event.target.value as InformationField['kind'],
                          ),
                        )
                      }
                    >
                      {Object.entries(informationFieldKindLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {field.kind === 'line' ? (
                    <label className="field">
                      <span>占位宽度</span>
                      <select
                        value={getInformationFieldWidthSelectValue(field)}
                        onChange={(event) => {
                          const value = event.target.value as InformationFieldWidthSelectValue;

                          if (value === 'custom') {
                            return;
                          }

                          updateField(fieldIndex, (current) =>
                            updateInformationFieldWidthPreset(current, value),
                          );
                        }}
                      >
                        {informationFieldWidthOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                        {getInformationFieldWidthSelectValue(field) === 'custom' ? (
                          <option value="custom">自定义宽度</option>
                        ) : null}
                      </select>
                    </label>
                  ) : field.kind === 'squares' ? (
                    <label className="field">
                      <span>方格数量</span>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        step={1}
                        value={field.length}
                        onChange={(event) => {
                          const parsed = Number.parseInt(event.target.value, 10);
                          if (!Number.isFinite(parsed)) return;
                          const length = Math.min(30, Math.max(1, parsed));
                          updateField(fieldIndex, (current) =>
                            current.kind === 'squares' ? { ...current, length } : current,
                          );
                        }}
                      />
                    </label>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );
}

function normalizeInformationFieldKind(
  field: InformationField,
  kind: InformationField['kind'],
): InformationField {
  if (kind === 'text') {
    return { label: field.label, kind: 'text' };
  }

  if (kind === 'squares') {
    return {
      label: field.label,
      kind: 'squares',
      length: field.kind === 'squares' ? field.length : 8,
    };
  }

  return {
    label: field.label,
    kind: 'line',
    width: field.kind === 'line' ? (field.width ?? '6em') : '6em',
  };
}

function getInformationFieldWidthSelectValue(
  field: InformationField,
): InformationFieldWidthSelectValue {
  if (field.kind !== 'line') return 'standard';
  const width = field.width ?? '6em';
  const option = informationFieldWidthOptions.find((item) => item.width === width);

  return option?.id ?? 'custom';
}

function updateInformationFieldWidthPreset(
  field: InformationField,
  widthOptionId: InformationFieldWidthOptionId,
): InformationField {
  const width = informationFieldWidthOptions.find((option) => option.id === widthOptionId)?.width;

  return width ? updateInformationFieldWidth(field, width) : field;
}

function updateInformationFieldWidth(field: InformationField, width: string): InformationField {
  if (field.kind !== 'line') return field;
  const trimmedWidth = width.trim();
  return trimmedWidth.length === 0
    ? { label: field.label, kind: 'line' }
    : { ...field, width: trimmedWidth };
}

function NoticeListEditor({
  notices,
  contentWarnings,
  onSetWarning,
  onPreviewChange,
  onPreviewEnd,
  onChange,
}: {
  notices: RichContentBlock[];
  contentWarnings: Record<string, string>;
  onSetWarning(key: string, warning: string | null): void;
  onPreviewChange(index: number, blocks: RichContentBlock[]): void;
  onPreviewEnd(): void;
  onChange(notices: RichContentBlock[]): void;
}) {
  const collapsedItems = useCollapsedItemIds(notices.map((_, index) => `notice-${index}`));

  return (
    <div className="nested-editor notice-list-editor">
      <div className="repeatable-collection-toolbar repeatable-collection-toolbar-end">
        <button
          type="button"
          className="mini-button"
          onClick={() => onChange(addNotice(notices, createNoticeBlock()))}
        >
          添加注意事项
        </button>
      </div>
      {notices.length === 0 ? (
        <div className="empty-panel">暂无注意事项</div>
      ) : (
        notices.map((notice, noticeIndex) => {
          const itemId = `notice-${noticeIndex}`;
          const collapsed = collapsedItems.isCollapsed(itemId);
          const summary = summarizeRichContent([notice], '未填写内容');

          return (
            <div
              key={noticeIndex}
              className={`notice-item-card ${collapsed ? 'repeatable-item-collapsed' : ''}`}
            >
              <CollapsibleItemHeader
                title={`${noticeIndex + 1}. ${summary}`}
                summary="注意事项内容"
                collapsed={collapsed}
                onToggle={() => collapsedItems.toggle(itemId)}
                actions={
                  <>
                    <IconButton
                      title="上移注意事项"
                      disabled={noticeIndex === 0}
                      onClick={() => onChange(moveNotice(notices, noticeIndex, 'up'))}
                      icon={<ArrowUp aria-hidden="true" size={15} />}
                    />
                    <IconButton
                      title="下移注意事项"
                      disabled={noticeIndex === notices.length - 1}
                      onClick={() => onChange(moveNotice(notices, noticeIndex, 'down'))}
                      icon={<ArrowDown aria-hidden="true" size={15} />}
                    />
                    <IconButton
                      title="删除注意事项"
                      onClick={() => onChange(removeNotice(notices, noticeIndex))}
                      icon={<Trash2 aria-hidden="true" size={15} />}
                    />
                  </>
                }
              />
              {!collapsed ? (
                <RichContentField
                  label="内容"
                  value={[notice]}
                  context="generic"
                  commitOnBlur
                  warning={contentWarnings[`frontMatter:notices:${noticeIndex}`]}
                  onSetWarning={(warning) =>
                    onSetWarning(`frontMatter:notices:${noticeIndex}`, warning)
                  }
                  onDraftChange={(blocks) => onPreviewChange(noticeIndex, blocks)}
                  onDraftEnd={onPreviewEnd}
                  onChange={(blocks) => onChange(commitNoticeDraft(notices, noticeIndex, blocks))}
                />
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );
}

function getTeacherReferencePlacementLabel(
  reference: TeacherReference,
  scoreMarks: ScoreMark[] | undefined,
  annotations: SolutionAnnotation[] | undefined,
): string {
  if (reference.type === 'scoreRef') {
    const points = scoreMarks?.find((item) => item.id === reference.scoreMarkId)?.points;
    return points === undefined ? '原位评分' : `${points} 分原位评分`;
  }

  const content = stringifyInlineRichText(
    annotations?.find((item) => item.id === reference.annotationId)?.content,
  ).trim();
  const summary = content.length > 14 ? `${content.slice(0, 14)}…` : content;
  return summary ? `解析批注“${summary}”` : '解析批注';
}

interface TeacherReferencePlacement {
  reference: TeacherReference;
  label: string;
  onComplete(): void;
  onCancel(): void;
}

function RichContentField({
  label,
  value,
  blankIds = [],
  context = 'generic',
  draftTarget,
  commitOnBlur = false,
  warning,
  inputRef,
  choiceParenControl,
  judgementParenControl,
  teacherContent,
  teacherReferencePlacement,
  onSetWarning,
  onSelectionChange,
  onDraftChange,
  onDraftEnd,
  onChange,
}: {
  label: string;
  value: RichContentBlock[];
  blankIds?: string[];
  context?: MathSnippetContext;
  draftTarget?: RichContentPreviewDraftTarget;
  commitOnBlur?: boolean;
  warning?: string;
  inputRef?(element: HTMLTextAreaElement | null): void;
  choiceParenControl?: { explicit: boolean };
  judgementParenControl?: {
    placement: 'lineEnd' | 'inline';
    onChange(value: RichContentBlock[], placement: 'lineEnd' | 'inline'): void;
  };
  teacherContent?: {
    scoreMarks: ScoreMark[];
    annotations: SolutionAnnotation[];
    onCommit(result: ParseTeacherSolutionResult): void;
    onConverted(message: string): void;
  };
  teacherReferencePlacement?: TeacherReferencePlacement;
  onSetWarning(warning: string | null): void;
  onSelectionChange?(selection: { start: number; end: number }): void;
  onDraftChange?(value: RichContentBlock[]): void;
  onDraftEnd?(): void;
  onChange(value: RichContentBlock[]): void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const skipNextBlurCommitRef = useRef(false);
  const preserveDraftOnNextFocusRef = useRef(false);
  const textValue = stringifyRichContentBlocks(
    value,
    blankIds,
    teacherContent
      ? { scoreMarks: teacherContent.scoreMarks, annotations: teacherContent.annotations }
      : undefined,
  );
  const [isFocused, setIsFocused] = useState(false);
  const [draftValue, setDraftValue] = useState(textValue);
  const [mathSnippetSlotState, setMathSnippetSlotState] = useState<MathSnippetSlotState | null>(
    null,
  );
  const { recentSnippetIds, onSnippetUsed } = useContext(MathSnippetRecentContext);
  const { onRichContentDraftChange, onRichContentDraftEnd } = useContext(EditorPreviewDraftContext);
  const visibleTextValue = isFocused ? draftValue : textValue;
  const choiceParenExplicit = Boolean(
    choiceParenControl && visibleTextValue.includes('{{选择括号}}'),
  );
  const judgementParenExplicit = Boolean(
    judgementParenControl && visibleTextValue.includes('{{判断括号}}'),
  );
  const paragraphHint = commitOnBlur
    ? '提示：Enter 换行，Cmd/Ctrl+Enter 提交，Esc 放弃；空一行拆分为多条注意事项。'
    : '提示：Enter 换行，Cmd/Ctrl+Enter 提交，Esc 放弃；空一行生成新段落。';

  const recordSelection = (textarea: HTMLTextAreaElement) => {
    onSelectionChange?.({ start: textarea.selectionStart, end: textarea.selectionEnd });
  };

  const updateFromText = (nextValue: string) => {
    const result = parseRichContentInput(nextValue, { blankIds, context });
    setDraftValue(nextValue);
    onSetWarning(result.diagnostics[0]?.message ?? null);
    onDraftChange?.(result.blocks);

    if (draftTarget) {
      onRichContentDraftChange(draftTarget, result.blocks);
    }
  };

  const commitDraft = () => {
    setMathSnippetSlotState(null);
    if (draftValue === textValue) {
      if (draftTarget) {
        onRichContentDraftEnd(draftTarget);
      }

      onDraftEnd?.();
      return;
    }

    if (teacherContent && context === 'solution') {
      const result = parseTeacherSolutionInput({
        input: draftValue,
        solution: value,
        scoreMarks: teacherContent.scoreMarks,
        annotations: teacherContent.annotations,
        createId,
      });
      onSetWarning(result.diagnostics[0]?.message ?? null);
      teacherContent.onCommit(result);

      if (result.conversions.scoreMarks > 0 || result.conversions.annotations > 0) {
        const parts = [
          result.conversions.scoreMarks > 0 ? `${result.conversions.scoreMarks} 个评分点` : null,
          result.conversions.annotations > 0
            ? `${result.conversions.annotations} 条解析批注`
            : null,
        ].filter(Boolean);
        teacherContent.onConverted(`已转换 ${parts.join('和 ')}，并保留原位置。`);
      }
    } else {
      const result = parseRichContentInput(draftValue, { blankIds, context });
      onSetWarning(result.diagnostics[0]?.message ?? null);
      onChange(result.blocks);
    }

    if (draftTarget) {
      onRichContentDraftEnd(draftTarget);
    }

    onDraftEnd?.();
  };

  const cancelDraft = () => {
    setMathSnippetSlotState(null);
    setDraftValue(textValue);
    onSetWarning(null);

    if (draftTarget) {
      onRichContentDraftEnd(draftTarget);
    }

    onDraftEnd?.();
  };

  const insertSnippet = (snippet: MathSnippet) => {
    const textarea = textareaRef.current;

    if (!isFocused) {
      preserveDraftOnNextFocusRef.current = true;
      setIsFocused(true);
    }

    const result = insertMathSnippetAtSelection(
      visibleTextValue,
      snippet,
      textarea && isFocused
        ? {
            start: textarea.selectionStart,
            end: textarea.selectionEnd,
          }
        : null,
    );

    updateFromText(result.value);
    setMathSnippetSlotState(result.slotState ?? null);
    onSnippetUsed(snippet);

    window.requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  };

  const updateChoiceParenPlacement = () => {
    if (choiceParenExplicit) {
      const result = parseRichContentInput(visibleTextValue, { blankIds, context });
      const nextBlocks = removeChoiceParenRefs(result.blocks);
      const nextValue = stringifyRichContentBlocks(nextBlocks, blankIds);
      const nextResult = parseRichContentInput(nextValue, { blankIds, context });

      setDraftValue(nextValue);
      onSetWarning(nextResult.diagnostics[0]?.message ?? null);
      onChange(nextBlocks);

      if (draftTarget) {
        onRichContentDraftEnd(draftTarget);
      }

      onDraftEnd?.();
      return;
    }

    const snippet = findMathSnippet('paren');

    if (snippet) {
      insertSnippet(snippet);
    }
  };

  const updateJudgementParenPlacement = () => {
    if (!judgementParenControl) {
      return;
    }

    const textarea = textareaRef.current;

    if (judgementParenControl.placement === 'inline' && judgementParenExplicit) {
      const result = removeJudgementPlaceholders(visibleTextValue);
      setDraftValue(result.value);
      onSetWarning(null);
      judgementParenControl.onChange(result.blocks, 'lineEnd');

      if (draftTarget) {
        onRichContentDraftEnd(draftTarget);
      }

      onDraftEnd?.();
      return;
    }

    if (!isFocused) {
      preserveDraftOnNextFocusRef.current = true;
      setIsFocused(true);
    }

    const result = insertJudgementPlaceholder(
      visibleTextValue,
      textarea && isFocused ? { start: textarea.selectionStart, end: textarea.selectionEnd } : null,
    );
    setDraftValue(result.value);
    onSetWarning(null);
    judgementParenControl.onChange(result.blocks, 'inline');

    if (draftTarget) {
      onRichContentDraftEnd(draftTarget);
    }

    onDraftEnd?.();

    window.requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  };

  const confirmTeacherReferencePlacement = () => {
    if (!teacherContent || !teacherReferencePlacement) return;

    const textarea = textareaRef.current;
    const selection = textarea
      ? { start: textarea.selectionStart, end: textarea.selectionEnd }
      : { start: visibleTextValue.length, end: visibleTextValue.length };
    const result = insertTeacherReferenceAtSelection({
      solution: value,
      scoreMarks: teacherContent.scoreMarks,
      annotations: teacherContent.annotations,
      reference: teacherReferencePlacement.reference,
      selection,
      createId,
    });
    const nextText = stringifyRichContentBlocks(result.solution, blankIds, {
      scoreMarks: result.scoreMarks,
      annotations: result.annotations,
    });
    setDraftValue(nextText);
    setIsFocused(true);
    onSetWarning(result.diagnostics[0]?.message ?? null);
    teacherContent.onCommit(result);
    teacherReferencePlacement.onComplete();

    if (draftTarget) onRichContentDraftEnd(draftTarget);
    onDraftEnd?.();

    window.requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(result.selectionStart, result.selectionEnd);
      onSelectionChange?.({
        start: result.selectionStart,
        end: result.selectionEnd,
      });
    });
  };

  return (
    <div className="field rich-field">
      <div className="rich-field-label-row">
        <span>{label}</span>
        {choiceParenControl ? (
          <div className="choice-paren-control">
            <span className="field-hint">
              答案括号：{choiceParenExplicit ? '已指定题干位置' : '自动置于行末'}
            </span>
            <button
              type="button"
              className="inline-action-button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={updateChoiceParenPlacement}
            >
              {choiceParenExplicit ? '恢复行末' : '插入选择括号'}
            </button>
          </div>
        ) : null}
        {judgementParenControl ? (
          <div className="choice-paren-control judgement-paren-control">
            <span className="field-hint">
              判断括号：
              {judgementParenControl.placement === 'lineEnd'
                ? '自动置于行末'
                : judgementParenExplicit
                  ? '已指定题干位置'
                  : '原位位置待指定'}
            </span>
            <button
              type="button"
              className="inline-action-button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={updateJudgementParenPlacement}
            >
              {judgementParenControl.placement === 'inline' && judgementParenExplicit
                ? '恢复行末'
                : '插入判断括号'}
            </button>
          </div>
        ) : null}
      </div>
      {teacherReferencePlacement ? (
        <div className="teacher-reference-placement" role="status">
          <div className="teacher-reference-placement-copy">
            <TextCursorInput aria-hidden="true" size={15} />
            <span>正在恢复 {teacherReferencePlacement.label}，请将光标移到目标位置。</span>
          </div>
          <div className="teacher-reference-placement-actions">
            <button
              type="button"
              className="mini-button teacher-reference-placement-confirm"
              onMouseDown={(event) => event.preventDefault()}
              onClick={confirmTeacherReferencePlacement}
            >
              在此插入
            </button>
            <button
              type="button"
              className="mini-button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={teacherReferencePlacement.onCancel}
            >
              取消
            </button>
          </div>
        </div>
      ) : null}
      {isFocused ? (
        <MathSnippetToolbar
          recentSnippetIds={recentSnippetIds}
          context={context}
          onInsert={insertSnippet}
        />
      ) : null}
      <textarea
        ref={(element) => {
          textareaRef.current = element;
          inputRef?.(element);
        }}
        value={visibleTextValue}
        onBlur={() => {
          setMathSnippetSlotState(null);
          if (textareaRef.current) recordSelection(textareaRef.current);
          if (skipNextBlurCommitRef.current) {
            skipNextBlurCommitRef.current = false;
            setIsFocused(false);
            return;
          }

          commitDraft();
          setIsFocused(false);
        }}
        onChange={(event) => {
          setMathSnippetSlotState((current) =>
            current
              ? (updateMathSnippetSlotStateForEdit(current, draftValue, event.target.value) ?? null)
              : null,
          );
          updateFromText(event.target.value);
          recordSelection(event.currentTarget);
        }}
        onMouseDown={() => setMathSnippetSlotState(null)}
        onSelect={(event) => recordSelection(event.currentTarget)}
        onKeyDown={(event) => {
          if (mathSnippetSlotState && event.key === 'Tab' && !event.metaKey && !event.ctrlKey) {
            event.preventDefault();
            const navigation = moveMathSnippetSlot(
              mathSnippetSlotState,
              event.shiftKey ? 'previous' : 'next',
            );
            setMathSnippetSlotState(navigation.slotState ?? null);
            window.requestAnimationFrame(() => {
              textareaRef.current?.setSelectionRange(
                navigation.selection.start,
                navigation.selection.end,
              );
            });
            return;
          }

          if (mathSnippetSlotState && event.key === 'Escape') {
            event.preventDefault();
            setMathSnippetSlotState(null);
            return;
          }

          const action = getRichContentInputKeyAction(event);

          if (!action) {
            return;
          }

          event.preventDefault();

          if (action === 'commit') {
            commitDraft();
            skipNextBlurCommitRef.current = true;
            setIsFocused(false);
            event.currentTarget.blur();
            return;
          }

          cancelDraft();
          skipNextBlurCommitRef.current = true;
          setIsFocused(false);
          event.currentTarget.blur();
        }}
        onFocus={() => {
          if (preserveDraftOnNextFocusRef.current) {
            preserveDraftOnNextFocusRef.current = false;
            setIsFocused(true);
            if (textareaRef.current) recordSelection(textareaRef.current);
            return;
          }

          setDraftValue(textValue);
          setMathSnippetSlotState(null);
          setIsFocused(true);
          if (textareaRef.current) recordSelection(textareaRef.current);
        }}
      />
      {isFocused ? <span className="field-hint">{paragraphHint}</span> : null}
      {warning ? <span className="field-warning">{warning}</span> : null}
    </div>
  );
}

function RightWorkbench({
  scrollRef,
  document,
  mode,
  documentChecks,
  documentCheckPending,
  pdfSession,
  pdfResult,
  successfulPdfArtifacts,
  pdfSessionIssueCount,
  pdfRenderErrors,
  previewMode,
  previewFocused,
  onModeChange,
  onPreviewModeChange,
  onSelectPdfArtifact,
  onSelectCheckArtifact,
  onOpenChecks,
  onLocateCheck,
  onRevealPdf,
  onRetryPdf,
  onPdfRenderErrorChange,
  onTogglePreviewFocus,
  onCollapse,
}: {
  scrollRef: RefObject<HTMLDivElement | null>;
  document: ExamDocument | null;
  mode: RightWorkbenchMode;
  documentChecks: DocumentCheckItem[];
  documentCheckPending: boolean;
  pdfSession: PdfExportSessionView | null;
  pdfResult: ExportPdfArtifactResult | null;
  successfulPdfArtifacts: ExportPdfArtifactResult[];
  pdfSessionIssueCount: number;
  pdfRenderErrors: Partial<Record<PdfExportVariant, string>>;
  previewMode: PreviewMode;
  previewFocused: boolean;
  onModeChange(mode: RightWorkbenchMode): void;
  onPreviewModeChange(mode: PreviewMode): void;
  onSelectPdfArtifact(artifact: ExportPdfArtifactResult): void;
  onSelectCheckArtifact(artifact: ExportPdfArtifactResult): void;
  onOpenChecks(): void;
  onLocateCheck(check: DocumentCheckItem): void;
  onRevealPdf(artifact: ExportPdfArtifactResult): void;
  onRetryPdf(variant: PdfExportVariant): void;
  onPdfRenderErrorChange(variant: PdfExportVariant, error: string | null): void;
  onTogglePreviewFocus(): void;
  onCollapse(): void;
}) {
  const activePdfArtifact =
    successfulPdfArtifacts.find((artifact) => artifact.variant === pdfResult?.variant) ??
    successfulPdfArtifacts[0] ??
    null;
  const availablePdfVariants = useMemo(
    () => successfulPdfArtifacts.map((artifact) => artifact.variant),
    [successfulPdfArtifacts],
  );
  const [focusedPdfViewMode, setFocusedPdfViewMode] = useState<FocusedPdfViewMode>(
    activePdfArtifact?.variant ?? 'student',
  );
  const [activePdfVariant, setActivePdfVariant] = useState<PdfExportVariant>(
    activePdfArtifact?.variant ?? 'student',
  );
  const [readerStatuses, setReaderStatuses] = useState<
    Partial<Record<PdfExportVariant, PdfReaderStatus>>
  >({});
  const [textLayerWarnings, setTextLayerWarnings] = useState<
    Partial<Record<PdfExportVariant, string>>
  >({});
  const [readerPositions, setReaderPositions] =
    useState<PdfReaderPositions>(createPdfReaderPositions);
  const pendingReaderPositionsRef = useRef<PdfReaderPositions>(createPdfReaderPositions());
  const readerPositionFlushTimeoutRef = useRef<number | null>(null);
  const readerControllersRef = useRef<Partial<Record<PdfExportVariant, PdfReaderController>>>({});
  const renderErrorCount = Object.keys(pdfRenderErrors).length;
  const textLayerWarningCount = Object.keys(textLayerWarnings).length;
  const previewIssueCount = pdfSessionIssueCount + renderErrorCount + textLayerWarningCount;
  const totalCheckCount = documentChecks.length + previewIssueCount;
  const compareAvailable =
    availablePdfVariants.includes('student') && availablePdfVariants.includes('teacher');
  const resolvedFocusedPdfViewMode = resolveFocusedPdfViewMode({
    requested: focusedPdfViewMode,
    availableVariants: availablePdfVariants,
    fallbackVariant: activePdfArtifact?.variant,
  });
  const displayedPdfArtifact =
    previewFocused && resolvedFocusedPdfViewMode !== 'compare'
      ? (successfulPdfArtifacts.find(
          (artifact) => artifact.variant === resolvedFocusedPdfViewMode,
        ) ?? activePdfArtifact)
      : activePdfArtifact;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const nextPositions = createPdfReaderPositions();
      pendingReaderPositionsRef.current = nextPositions;
      readerControllersRef.current = {};
      setReaderPositions(nextPositions);
      setReaderStatuses({});
      setTextLayerWarnings({});
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pdfSession?.jobId]);

  useEffect(() => {
    if (!activePdfArtifact) return;
    const frame = window.requestAnimationFrame(() => {
      setActivePdfVariant(activePdfArtifact.variant);
      if (!previewFocused || focusedPdfViewMode !== 'compare') {
        setFocusedPdfViewMode(activePdfArtifact.variant);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activePdfArtifact, focusedPdfViewMode, previewFocused]);

  useEffect(
    () => () => {
      if (readerPositionFlushTimeoutRef.current !== null) {
        window.clearTimeout(readerPositionFlushTimeoutRef.current);
      }
    },
    [],
  );

  const flushReaderPositions = useCallback((): void => {
    if (readerPositionFlushTimeoutRef.current !== null) {
      window.clearTimeout(readerPositionFlushTimeoutRef.current);
      readerPositionFlushTimeoutRef.current = null;
    }
    setReaderPositions({
      student: { ...pendingReaderPositionsRef.current.student },
      teacher: { ...pendingReaderPositionsRef.current.teacher },
    });
  }, []);

  const handleReaderPositionChange = useCallback(
    (variant: PdfExportVariant, position: { currentPage: number; scrollTop: number }): void => {
      pendingReaderPositionsRef.current = updatePdfReaderPosition(
        pendingReaderPositionsRef.current,
        variant,
        position,
      );
      if (readerPositionFlushTimeoutRef.current === null) {
        readerPositionFlushTimeoutRef.current = window.setTimeout(() => {
          readerPositionFlushTimeoutRef.current = null;
          setReaderPositions({
            student: { ...pendingReaderPositionsRef.current.student },
            teacher: { ...pendingReaderPositionsRef.current.teacher },
          });
        }, 120);
      }
    },
    [],
  );

  const handleReaderStatusChange = useCallback(
    (variant: PdfExportVariant, status: PdfReaderStatus): void => {
      setReaderStatuses((current) =>
        current[variant]?.currentPage === status.currentPage &&
        current[variant]?.pageCount === status.pageCount
          ? current
          : { ...current, [variant]: status },
      );
      pendingReaderPositionsRef.current = updatePdfReaderPosition(
        pendingReaderPositionsRef.current,
        variant,
        { currentPage: status.currentPage },
      );
      setReaderPositions((current) =>
        updatePdfReaderPosition(current, variant, {
          ...pendingReaderPositionsRef.current[variant],
          currentPage: status.currentPage,
        }),
      );
    },
    [],
  );

  const handleReaderControllerChange = useCallback(
    (variant: PdfExportVariant, controller: PdfReaderController | null): void => {
      if (controller) readerControllersRef.current[variant] = controller;
      else delete readerControllersRef.current[variant];
    },
    [],
  );

  const handleTextLayerWarningChange = useCallback(
    (variant: PdfExportVariant, warning: string | null): void => {
      setTextLayerWarnings((current) => {
        const next = { ...current };
        if (warning) next[variant] = warning;
        else delete next[variant];
        return next;
      });
    },
    [],
  );

  const activatePdfVariant = useCallback(
    (variant: PdfExportVariant): void => {
      setActivePdfVariant(variant);
      const artifact = successfulPdfArtifacts.find((item) => item.variant === variant);
      if (artifact) onSelectCheckArtifact(artifact);
    },
    [onSelectCheckArtifact, successfulPdfArtifacts],
  );

  const jumpPdfVariantToPage = useCallback(
    (variant: PdfExportVariant, pageNumber: number): void => {
      setActivePdfVariant(variant);
      readerControllersRef.current[variant]?.jumpToPage(pageNumber, 'smooth');
    },
    [],
  );

  useEffect(() => {
    if (!previewFocused || previewMode !== 'pdf') return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      const action = getFocusedPdfKeyboardAction({
        key: event.key,
        defaultPrevented: event.defaultPrevented,
        isComposing: event.isComposing,
        metaKey: event.metaKey,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
        targetTagName: target?.tagName,
        targetContentEditable: target?.isContentEditable,
      });
      if (!action) return;

      const variant =
        resolvedFocusedPdfViewMode === 'compare' ? activePdfVariant : resolvedFocusedPdfViewMode;
      const status = readerStatuses[variant];
      if (!status) return;
      const pageNumber = getAdjacentPdfPage(
        status.currentPage,
        status.pageCount,
        action === 'previous-page' ? 'previous' : 'next',
      );
      event.preventDefault();
      jumpPdfVariantToPage(variant, pageNumber);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activePdfVariant,
    jumpPdfVariantToPage,
    previewFocused,
    previewMode,
    readerStatuses,
    resolvedFocusedPdfViewMode,
  ]);

  const handleTogglePreviewFocus = (): void => {
    flushReaderPositions();
    if (!previewFocused) {
      setFocusedPdfViewMode(activePdfArtifact?.variant ?? activePdfVariant);
    } else if (resolvedFocusedPdfViewMode === 'compare') {
      const artifact = successfulPdfArtifacts.find((item) => item.variant === activePdfVariant);
      if (artifact) onSelectPdfArtifact(artifact);
    }
    onTogglePreviewFocus();
  };

  const selectFocusedPdfView = (viewMode: FocusedPdfViewMode): void => {
    flushReaderPositions();
    setFocusedPdfViewMode(viewMode);
    if (viewMode === 'compare') return;
    const artifact = successfulPdfArtifacts.find((item) => item.variant === viewMode);
    if (artifact) onSelectPdfArtifact(artifact);
  };

  return (
    <div className="right-workbench">
      <div className="right-workbench-tabs" role="tablist" aria-label="右栏模式">
        <button
          id="right-workbench-preview-tab"
          type="button"
          role="tab"
          aria-selected={mode === 'preview'}
          aria-controls="right-workbench-preview-panel"
          onClick={() => onModeChange('preview')}
        >
          <Eye aria-hidden="true" size={15} />
          <span>预览</span>
        </button>
        <button
          id="right-workbench-check-tab"
          type="button"
          role="tab"
          aria-selected={mode === 'check'}
          aria-controls="right-workbench-check-panel"
          onClick={() => {
            flushReaderPositions();
            onModeChange('check');
          }}
        >
          <SearchCheck aria-hidden="true" size={15} />
          <span>检查</span>
        </button>
      </div>

      {mode === 'preview' ? (
        <div className="right-workbench-toolbar">
          <div className="right-preview-toolbar-main">
            <div className="segmented-control" role="tablist" aria-label="预览模式">
              <button
                id="draft-preview-tab"
                type="button"
                role="tab"
                aria-selected={previewMode === 'draft'}
                aria-controls="draft-preview-panel"
                className={previewMode === 'draft' ? 'segmented-active' : ''}
                onClick={() => {
                  flushReaderPositions();
                  onPreviewModeChange('draft');
                }}
              >
                草稿
              </button>
              <button
                id="pdf-preview-tab"
                type="button"
                role="tab"
                aria-selected={previewMode === 'pdf'}
                aria-controls="pdf-preview-panel"
                className={previewMode === 'pdf' ? 'segmented-active' : ''}
                disabled={!activePdfArtifact}
                onClick={() => activePdfArtifact && onSelectPdfArtifact(activePdfArtifact)}
              >
                PDF
              </button>
            </div>
            {previewMode === 'pdf' && displayedPdfArtifact ? (
              previewFocused && compareAvailable ? (
                <div
                  className="segmented-control focused-pdf-view-control"
                  role="tablist"
                  aria-label="专注 PDF 视图"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={resolvedFocusedPdfViewMode === 'student'}
                    className={resolvedFocusedPdfViewMode === 'student' ? 'segmented-active' : ''}
                    onClick={() => selectFocusedPdfView('student')}
                  >
                    学生版
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={resolvedFocusedPdfViewMode === 'teacher'}
                    className={resolvedFocusedPdfViewMode === 'teacher' ? 'segmented-active' : ''}
                    onClick={() => selectFocusedPdfView('teacher')}
                  >
                    教师版
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={resolvedFocusedPdfViewMode === 'compare'}
                    className={resolvedFocusedPdfViewMode === 'compare' ? 'segmented-active' : ''}
                    onClick={() => selectFocusedPdfView('compare')}
                  >
                    并排显示
                  </button>
                </div>
              ) : successfulPdfArtifacts.length > 1 ? (
                <select
                  className="compact-select right-preview-artifact-select"
                  aria-label="PDF 产物"
                  value={displayedPdfArtifact.variant}
                  onChange={(event) => {
                    const artifact = successfulPdfArtifacts.find(
                      (item) => item.variant === event.target.value,
                    );
                    if (artifact) onSelectPdfArtifact(artifact);
                  }}
                >
                  {successfulPdfArtifacts.map((artifact) => (
                    <option key={artifact.variant} value={artifact.variant}>
                      {formatPdfVariant(artifact.variant)}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="preview-pdf-variant">
                  {formatPdfVariant(displayedPdfArtifact.variant)}
                </span>
              )
            ) : null}
            {previewMode === 'pdf' &&
            displayedPdfArtifact &&
            resolvedFocusedPdfViewMode !== 'compare' ? (
              <PdfPageNavigator
                status={readerStatuses[displayedPdfArtifact.variant]}
                showButtons={previewFocused}
                onJump={(pageNumber) =>
                  jumpPdfVariantToPage(displayedPdfArtifact.variant, pageNumber)
                }
              />
            ) : null}
            {previewIssueCount > 0 ? (
              <button
                type="button"
                className="right-preview-issue-link"
                onClick={() => {
                  flushReaderPositions();
                  onOpenChecks();
                }}
              >
                <TriangleAlert aria-hidden="true" size={13} />
                {previewIssueCount} 个提示
              </button>
            ) : null}
          </div>
          <div className="right-workbench-toolbar-actions">
            {!previewFocused ? (
              <TooltipAnchor text="收起右栏">
                <button
                  type="button"
                  className="icon-button pane-collapse-button"
                  aria-label="收起右栏"
                  onClick={onCollapse}
                >
                  <PanelRightClose aria-hidden="true" size={16} />
                </button>
              </TooltipAnchor>
            ) : null}
            <TooltipAnchor text={previewFocused ? '退出专注查看' : '专注查看'}>
              <button
                type="button"
                className="icon-button preview-focus-button"
                aria-label={previewFocused ? '退出专注查看' : '专注查看'}
                onClick={handleTogglePreviewFocus}
              >
                {previewFocused ? (
                  <Minimize2 aria-hidden="true" size={16} />
                ) : (
                  <Maximize2 aria-hidden="true" size={16} />
                )}
              </button>
            </TooltipAnchor>
          </div>
        </div>
      ) : (
        <div className="right-workbench-toolbar">
          <div className="right-check-summary" aria-live="polite">
            {documentCheckPending
              ? '检查更新中'
              : totalCheckCount > 0
                ? `${totalCheckCount} 项待确认`
                : '未发现待确认问题'}
          </div>
          <TooltipAnchor text="收起右栏">
            <button
              type="button"
              className="icon-button pane-collapse-button"
              aria-label="收起右栏"
              onClick={onCollapse}
            >
              <PanelRightClose aria-hidden="true" size={16} />
            </button>
          </TooltipAnchor>
        </div>
      )}

      <div
        id="right-workbench-preview-panel"
        ref={mode === 'preview' ? scrollRef : undefined}
        className={`right-workbench-scroll ${
          previewMode === 'pdf' ? 'right-workbench-scroll-pdf' : ''
        } ${
          previewFocused && resolvedFocusedPdfViewMode === 'compare'
            ? 'right-workbench-scroll-compare'
            : ''
        }`}
        role="tabpanel"
        aria-labelledby="right-workbench-preview-tab"
        hidden={mode !== 'preview'}
      >
        {mode === 'preview' && previewMode === 'draft' ? (
          <div id="draft-preview-panel" role="tabpanel" aria-labelledby="draft-preview-tab">
            <div className="preview-mode-note" role="note">
              <Info aria-hidden="true" size={14} />
              <span>草稿仅供编辑辅助；排版细节以导出 PDF 为准。</span>
            </div>
            <DraftPreviewPane document={document} />
          </div>
        ) : null}
        <div
          id="pdf-preview-panel"
          role="tabpanel"
          aria-labelledby="pdf-preview-tab"
          hidden={previewMode !== 'pdf'}
        >
          {mode !== 'preview' || previewMode !== 'pdf' ? null : previewFocused &&
            resolvedFocusedPdfViewMode === 'compare' &&
            compareAvailable ? (
            <div className="pdf-compare-grid" aria-label="学生版与教师版并排预览">
              {successfulPdfArtifacts.map((artifact) => (
                <section
                  key={`${pdfSession?.jobId ?? 'pdf'}-${artifact.variant}`}
                  className={`pdf-compare-pane ${
                    activePdfVariant === artifact.variant ? 'pdf-compare-pane-active' : ''
                  }`}
                  aria-label={`${formatPdfVariant(artifact.variant)}对照栏`}
                >
                  <header className="pdf-compare-pane-header">
                    <strong>{formatPdfVariant(artifact.variant)}</strong>
                    <PdfPageNavigator
                      status={readerStatuses[artifact.variant]}
                      showButtons
                      onJump={(pageNumber) => jumpPdfVariantToPage(artifact.variant, pageNumber)}
                    />
                  </header>
                  <PdfReader
                    result={artifact}
                    initialPosition={readerPositions[artifact.variant]}
                    onPositionChange={handleReaderPositionChange}
                    onStatusChange={handleReaderStatusChange}
                    onControllerChange={handleReaderControllerChange}
                    onActivate={activatePdfVariant}
                    onReveal={onRevealPdf}
                    onRenderErrorChange={onPdfRenderErrorChange}
                    onTextLayerWarningChange={handleTextLayerWarningChange}
                  />
                </section>
              ))}
            </div>
          ) : displayedPdfArtifact ? (
            <PdfReader
              key={`${pdfSession?.jobId ?? 'pdf'}-${displayedPdfArtifact.variant}`}
              result={displayedPdfArtifact}
              initialPosition={readerPositions[displayedPdfArtifact.variant]}
              onPositionChange={handleReaderPositionChange}
              onStatusChange={handleReaderStatusChange}
              onControllerChange={handleReaderControllerChange}
              onActivate={activatePdfVariant}
              onReveal={onRevealPdf}
              onRenderErrorChange={onPdfRenderErrorChange}
              onTextLayerWarningChange={handleTextLayerWarningChange}
            />
          ) : (
            <div className="pdf-placeholder">
              <div className="muted">生成 PDF 后会在这里显示最终排版结果。</div>
            </div>
          )}
        </div>
      </div>
      <div
        id="right-workbench-check-panel"
        ref={mode === 'check' ? scrollRef : undefined}
        className="right-workbench-scroll"
        role="tabpanel"
        aria-labelledby="right-workbench-check-tab"
        hidden={mode !== 'check'}
      >
        {mode === 'check' ? (
          <CheckWorkbenchPanel
            checks={documentChecks}
            pending={documentCheckPending}
            session={pdfSession}
            selectedResult={pdfResult}
            renderErrors={pdfRenderErrors}
            textLayerWarnings={textLayerWarnings}
            onLocateCheck={onLocateCheck}
            onSelectArtifact={onSelectCheckArtifact}
            onPreviewArtifact={onSelectPdfArtifact}
            onRevealArtifact={onRevealPdf}
            onRetryArtifact={onRetryPdf}
          />
        ) : null}
      </div>
    </div>
  );
}

function PdfPageNavigator({
  status,
  showButtons,
  onJump,
}: {
  status?: PdfReaderStatus;
  showButtons: boolean;
  onJump(pageNumber: number): void;
}) {
  const currentPage = status?.currentPage ?? 1;
  const pageCount = status?.pageCount ?? 0;
  const commitPage = (input: HTMLInputElement): void => {
    const pageNumber = normalizePdfPageInput(input.value, pageCount);
    if (pageNumber === null) {
      input.value = String(currentPage);
      return;
    }
    input.value = String(pageNumber);
    onJump(pageNumber);
  };

  return (
    <div className="pdf-page-navigator" aria-label="PDF 页码导航">
      {showButtons ? (
        <TooltipAnchor text="上一页">
          <button
            type="button"
            className="pdf-page-nav-button"
            aria-label="上一页"
            disabled={pageCount === 0 || currentPage <= 1}
            onClick={() => onJump(getAdjacentPdfPage(currentPage, pageCount, 'previous'))}
          >
            <ChevronLeft aria-hidden="true" size={14} />
          </button>
        </TooltipAnchor>
      ) : null}
      <label className="pdf-page-input-wrap">
        <span className="sr-only">当前 PDF 页码</span>
        <input
          type="text"
          inputMode="numeric"
          aria-label="当前 PDF 页码"
          key={`${currentPage}-${pageCount}`}
          defaultValue={pageCount > 0 ? String(currentPage) : ''}
          disabled={pageCount === 0}
          onBlur={(event) => commitPage(event.currentTarget)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commitPage(event.currentTarget);
            } else if (event.key === 'Escape') {
              event.preventDefault();
              event.currentTarget.value = String(currentPage);
              event.currentTarget.blur();
            }
          }}
        />
        <span aria-hidden="true">/</span>
        <span className="pdf-page-count">{pageCount > 0 ? pageCount : '—'}</span>
      </label>
      {showButtons ? (
        <TooltipAnchor text="下一页">
          <button
            type="button"
            className="pdf-page-nav-button"
            aria-label="下一页"
            disabled={pageCount === 0 || currentPage >= pageCount}
            onClick={() => onJump(getAdjacentPdfPage(currentPage, pageCount, 'next'))}
          >
            <ChevronRight aria-hidden="true" size={14} />
          </button>
        </TooltipAnchor>
      ) : null}
    </div>
  );
}

function CheckWorkbenchPanel({
  checks,
  pending,
  session,
  selectedResult,
  renderErrors,
  textLayerWarnings,
  onLocateCheck,
  onSelectArtifact,
  onPreviewArtifact,
  onRevealArtifact,
  onRetryArtifact,
}: {
  checks: DocumentCheckItem[];
  pending: boolean;
  session: PdfExportSessionView | null;
  selectedResult: ExportPdfArtifactResult | null;
  renderErrors: Partial<Record<PdfExportVariant, string>>;
  textLayerWarnings: Partial<Record<PdfExportVariant, string>>;
  onLocateCheck(check: DocumentCheckItem): void;
  onSelectArtifact(artifact: ExportPdfArtifactResult): void;
  onPreviewArtifact(artifact: ExportPdfArtifactResult): void;
  onRevealArtifact(artifact: ExportPdfArtifactResult): void;
  onRetryArtifact(variant: PdfExportVariant): void;
}) {
  return (
    <div className="right-check-stack">
      <section className="right-check-section" aria-labelledby="document-check-heading">
        <div className="right-check-section-heading">
          <h3 id="document-check-heading">文档检查</h3>
          <span>{pending ? '更新中' : `${checks.length} 项`}</span>
        </div>
        {checks.length > 0 ? (
          <div className="right-check-list">
            {checks.map((check) => (
              <div key={check.id} className={`right-check-item check-${check.severity}`}>
                <span className="right-check-item-icon">
                  {renderCheckSeverityIcon(check.severity)}
                </span>
                <div className="right-check-item-copy">
                  <strong>{check.title}</strong>
                  <span>{check.detail}</span>
                  {check.sourcePath ? <small>来源：{check.sourcePath}</small> : null}
                </div>
                {check.sectionId ? (
                  <button
                    type="button"
                    className="mini-button"
                    onClick={() => onLocateCheck(check)}
                  >
                    定位
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="right-check-empty">
            <CheckCircle2 aria-hidden="true" size={17} />
            <span>{pending ? '正在更新检查结果…' : '未发现待确认问题。'}</span>
          </div>
        )}
      </section>

      <section className="right-check-section" aria-labelledby="pdf-export-check-heading">
        <div className="right-check-section-heading">
          <h3 id="pdf-export-check-heading">最近 PDF 导出</h3>
          <span>{session ? `${session.items.length} 份` : '暂无'}</span>
        </div>
        {session ? (
          <div className="right-check-artifacts">
            {session.items.map((item) => (
              <PdfCheckArtifactRow
                key={item.variant}
                item={item}
                selected={selectedResult?.variant === item.variant}
                onSelect={onSelectArtifact}
              />
            ))}
          </div>
        ) : (
          <div className="right-check-empty muted">生成 PDF 后会在这里保留本次结果。</div>
        )}
      </section>

      {selectedResult ? (
        <PdfCheckDetails
          result={selectedResult}
          renderError={renderErrors[selectedResult.variant]}
          textLayerWarning={textLayerWarnings[selectedResult.variant]}
          onPreview={onPreviewArtifact}
          onReveal={onRevealArtifact}
          onRetry={onRetryArtifact}
        />
      ) : null}
    </div>
  );
}

function PdfCheckArtifactRow({
  item,
  selected,
  onSelect,
}: {
  item: PdfExportItemView;
  selected: boolean;
  onSelect(artifact: ExportPdfArtifactResult): void;
}) {
  const presentation = getPdfExportItemPresentation(item);

  return (
    <button
      type="button"
      className={`right-check-artifact ${selected ? 'right-check-artifact-selected' : ''}`}
      disabled={!item.result}
      onClick={() => item.result && onSelect(item.result)}
    >
      <span className="right-check-artifact-icon">
        {renderPdfCheckStatusIcon(presentation.tone)}
      </span>
      <span className="right-check-artifact-copy">
        <strong>{formatPdfVariant(item.variant)}</strong>
        <span>{presentation.label}</span>
      </span>
      {item.result ? <ChevronRight aria-hidden="true" size={15} /> : null}
    </button>
  );
}

function PdfCheckDetails({
  result,
  renderError,
  textLayerWarning,
  onPreview,
  onReveal,
  onRetry,
}: {
  result: ExportPdfArtifactResult;
  renderError?: string;
  textLayerWarning?: string;
  onPreview(artifact: ExportPdfArtifactResult): void;
  onReveal(artifact: ExportPdfArtifactResult): void;
  onRetry(variant: PdfExportVariant): void;
}) {
  return (
    <section
      className="right-check-section right-check-details"
      aria-labelledby="pdf-detail-heading"
    >
      <div className="right-check-section-heading">
        <h3 id="pdf-detail-heading">{formatPdfVariant(result.variant)}详情</h3>
        <span>{result.success ? '已生成' : '需要处理'}</span>
      </div>
      <div className="right-check-result-meta">
        <span>{result.provider ? formatProvider(result.provider) : '未启动编译器'}</span>
        <span>{formatDuration(result.durationMs)}</span>
      </div>
      <div className="right-check-result-actions">
        {result.success && result.pdfDataBase64 ? (
          <button type="button" className="mini-button" onClick={() => onPreview(result)}>
            <Eye aria-hidden="true" size={14} /> 预览
          </button>
        ) : null}
        {result.pdfPath ? (
          <button type="button" className="mini-button" onClick={() => onReveal(result)}>
            <FolderSearch aria-hidden="true" size={14} /> Finder
          </button>
        ) : null}
        {!result.success ? (
          <button type="button" className="mini-button" onClick={() => onRetry(result.variant)}>
            <RefreshCw aria-hidden="true" size={14} /> 重试
          </button>
        ) : null}
      </div>

      {renderError ? (
        <div className="right-check-render-warning">
          <TriangleAlert aria-hidden="true" size={15} />
          <span>PDF 已生成，但应用内预览失败：{renderError}</span>
        </div>
      ) : null}
      {!renderError && textLayerWarning ? (
        <div className="right-check-render-warning">
          <TriangleAlert aria-hidden="true" size={15} />
          <span>PDF 可以预览，但文字选择层不可用：{textLayerWarning}</span>
        </div>
      ) : null}

      {result.diagnostics.length > 0 ? (
        <div className="right-check-diagnostics">
          {result.diagnostics.map((diagnostic, index) => (
            <div
              key={`${diagnostic.code}-${index}`}
              className={`right-check-diagnostic diagnostic-${diagnostic.severity}`}
            >
              {renderCheckSeverityIcon(diagnostic.severity)}
              <span>
                {diagnostic.sourceLabel ? `${diagnostic.sourceLabel}：` : ''}
                {diagnostic.message}
                {diagnostic.line ? `（第 ${diagnostic.line} 行）` : ''}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="right-check-empty">
          <CheckCircle2 aria-hidden="true" size={16} />
          <span>没有编译诊断。</span>
        </div>
      )}

      <details className="right-check-technical">
        <summary>技术详情</summary>
        <div className="compile-log-meta">
          {result.pdfPath ? <span>PDF：{result.pdfPath}</span> : null}
        </div>
        <pre className="compile-log-output">{result.log || '没有编译日志。'}</pre>
      </details>
    </section>
  );
}

function renderCheckSeverityIcon(severity: 'error' | 'warning' | 'info'): ReactNode {
  if (severity === 'error') return <CircleX aria-hidden="true" size={15} />;
  if (severity === 'warning') return <TriangleAlert aria-hidden="true" size={15} />;
  return <Info aria-hidden="true" size={15} />;
}

function renderPdfCheckStatusIcon(tone: PdfExportItemTone): ReactNode {
  if (tone === 'pending') {
    return <LoaderCircle className="pdf-export-spinner" aria-hidden="true" size={16} />;
  }
  if (tone === 'error') return <CircleX aria-hidden="true" size={16} />;
  return tone === 'warning' ? (
    <TriangleAlert aria-hidden="true" size={16} />
  ) : (
    <CheckCircle2 aria-hidden="true" size={16} />
  );
}

function formatPdfVariant(variant: PdfExportVariant): string {
  return variant === 'teacher' ? '教师版' : '学生版';
}

function formatDuration(durationMs: number): string {
  return durationMs >= 1000 ? `${(durationMs / 1000).toFixed(1)} 秒` : `${durationMs} ms`;
}

function DraftPreviewPane({ document }: { document: ExamDocument | null }) {
  if (!document) {
    return null;
  }

  let fallbackQuestionNumber = 0;
  const questionNumbers = resolveQuestionNumbers(document);
  const previewOptions: PreviewRenderOptions = {
    document,
    showAnswers: document.setup.answerMode === 'teacher',
    parenAnswerColor: getPreviewParenAnswerColor(document.setup.examZhOptions),
    judgementAnswerColor: resolveJudgementSetup(document, {}).answerColor,
    fillinCounterState: { next: resolveFillinLayout(document).counterIndex },
  };
  const frontMatterPreviewQuestion: ExamQuestion = {
    id: 'front-matter-preview',
    type: 'rawLatex',
    stem: [],
  };
  const informationPlacement = document.frontMatter.informationPlacement ?? 'top';
  const showTitleBlock = document.frontMatter.showTitleBlock ?? true;
  const effectiveInformationPlacement = showTitleBlock ? informationPlacement : 'top';
  const previewInformation = renderPreviewInformation(document.frontMatter);
  const warning = document.frontMatter.warning?.trim();
  const noticeLabel =
    getHeaderOptionString(document.setup.examZhOptions, 'notice/label') ??
    upstreamHeaderDefaults.noticeLabel;
  const noticeLabelFormat = getHeaderOptionString(
    document.setup.examZhOptions,
    'notice/label-format',
  );
  const titleSpacingPreset = getSpacingPreset(
    document.setup.examZhOptions,
    'title/top-sep',
    'title/bottom-sep',
    {
      top: '-.75em plus .2em minus .1em',
      bottom: '-.25em plus .2em minus .1em',
    },
    {
      top: '0em plus .3em minus .2em',
      bottom: '.5em plus .3em minus .2em',
    },
  );
  const noticeSpacingPreset = getSpacingPreset(
    document.setup.examZhOptions,
    'notice/top-sep',
    'notice/bottom-sep',
    {
      top: '.1em plus .1em minus .05em',
      bottom: '.1em plus .1em minus .05em',
    },
    {
      top: '.6em plus .25em minus .1em',
      bottom: '.6em plus .25em minus .1em',
    },
  );
  const titleBlockClassName =
    titleSpacingPreset === 'compact'
      ? 'preview-title-block preview-title-spacing-compact'
      : titleSpacingPreset === 'loose'
        ? 'preview-title-block preview-title-spacing-loose'
        : 'preview-title-block';
  const noticeClassName =
    noticeSpacingPreset === 'compact'
      ? 'preview-notices preview-notices-spacing-compact'
      : noticeSpacingPreset === 'loose'
        ? 'preview-notices preview-notices-spacing-loose'
        : 'preview-notices';
  const noticeTitleClassName =
    noticeLabelFormat === '\\normalfont'
      ? 'preview-notices-title preview-notices-title-normal'
      : noticeLabelFormat === '\\bfseries'
        ? 'preview-notices-title preview-notices-title-bold'
        : 'preview-notices-title';

  return (
    <div className="preview-page">
      <div className="preview-page-content">
        {effectiveInformationPlacement === 'top' ? previewInformation : null}
        {document.frontMatter.secret ? <div className="preview-secret">绝密 ★ 启用前</div> : null}
        {showTitleBlock ? (
          <div className={titleBlockClassName}>
            <div className="preview-title">{document.metadata.title || '未命名试卷'}</div>
            <div className="preview-subject">{document.metadata.subject || '科目'}</div>
            {effectiveInformationPlacement === 'belowSubject' ? previewInformation : null}
            <div className="preview-line" />
          </div>
        ) : null}
        {warning ? (
          <div
            className="preview-warning"
            style={getPreviewSpacingStyle(document.frontMatter.warningSpacing)}
          >
            {warning}
          </div>
        ) : null}
        {document.frontMatter.notices.length > 0 ? (
          <div className={noticeClassName}>
            <div className={noticeTitleClassName}>{noticeLabel}</div>
            <ol>
              {document.frontMatter.notices.map((notice, noticeIndex) => (
                <li key={noticeIndex}>
                  {renderPreviewBlocks([notice], frontMatterPreviewQuestion, previewOptions)}
                </li>
              ))}
            </ol>
          </div>
        ) : null}
        {document.sections.length === 0 ? (
          <div className="preview-empty">暂无试卷内容。</div>
        ) : (
          document.sections.map((section, sectionIndex) => (
            <section key={section.id} className="preview-section">
              <div className="preview-section-heading">
                <h2>
                  {toChineseSectionNumber(sectionIndex + 1)}、{section.title}
                </h2>
                {formatSectionSummary(section) ? (
                  <div className="preview-section-summary">{formatSectionSummary(section)}</div>
                ) : null}
              </div>
              {section.questions.map((question) => {
                fallbackQuestionNumber += 1;
                const choiceLayout = resolveChoiceLayout(document, question);
                const choiceLabelBoxActive = choiceLayout.labelSource !== 'custom-labels';
                const questionLabel =
                  questionNumbers.get(question.id)?.label ?? `${fallbackQuestionNumber}.`;

                return (
                  <div key={question.id} className="preview-question">
                    <div className="preview-question-stem">
                      <span className="preview-question-number">{questionLabel}</span>
                      <div className="preview-question-content">
                        {renderPreviewBlocks(question.stem, question, previewOptions)}
                        {question.type === 'blank' &&
                        question.blanks?.length &&
                        !previewBlocksContainFillin(question.stem) ? (
                          <span className="preview-appended-blanks">
                            {question.blanks.map((blank) => (
                              <Fragment key={blank.id}>
                                {renderPreviewBlank(blank, question, previewOptions)}
                              </Fragment>
                            ))}
                          </span>
                        ) : null}
                        {(question.type === 'singleChoice' || question.type === 'multipleChoice') &&
                        !blocksContainChoiceParenRef(question.stem) ? (
                          <span className="preview-paren">
                            {renderPreviewChoiceParen(question, previewOptions)}
                          </span>
                        ) : null}
                        {question.type === 'judgement' &&
                        (question.judgement?.placement ?? 'lineEnd') === 'lineEnd' ? (
                          <span className="preview-judgement preview-judgement-line-end">
                            {renderPreviewJudgement(question, previewOptions, 'lineEnd')}
                          </span>
                        ) : null}
                        {question.type === 'judgement' &&
                        question.judgement?.placement === 'inline' &&
                        !blocksContainJudgementRef(question.stem) ? (
                          <span className="preview-judgement preview-judgement-inline preview-judgement-appended">
                            {renderPreviewJudgement(question, previewOptions, 'inline')}
                          </span>
                        ) : null}
                        <span className="preview-question-points">
                          {question.points !== undefined ? `（${question.points}分）` : ''}
                        </span>
                      </div>
                    </div>
                    {question.choices?.length ? (
                      <div
                        className="preview-choices"
                        style={
                          {
                            '--preview-choice-columns': resolveDraftPreviewChoiceColumns(
                              choiceLayout.columns,
                              choiceLayout.maxColumns,
                              question.choices.length,
                            ),
                            '--preview-choice-column-sep':
                              latexDimensionToCssLength(choiceLayout.columnSep) ?? '1em',
                            '--preview-choice-line-sep':
                              latexDimensionToCssLength(choiceLayout.lineSep) ?? '0pt',
                            '--preview-choice-top-sep':
                              latexDimensionToCssLength(choiceLayout.topSep) ?? '0pt',
                            '--preview-choice-bottom-sep':
                              latexDimensionToCssLength(choiceLayout.bottomSep) ?? '0pt',
                            '--preview-choice-label-sep': choiceLabelBoxActive
                              ? (latexDimensionToCssLength(choiceLayout.labelSep) ?? '.5em')
                              : '.5em',
                            '--preview-choice-label-width': choiceLabelBoxActive
                              ? (latexDimensionToCssLength(choiceLayout.labelWidth) ?? '0pt')
                              : '0pt',
                          } as CSSProperties
                        }
                      >
                        {question.choices.map((choice, choiceIndex) => (
                          <div
                            key={choice.id}
                            className={`preview-choice-item preview-choice-label-${getEffectiveChoiceLabelPosition(
                              choiceLayout.labelPosition,
                              choice,
                            )} preview-choice-align-${
                              choiceLabelBoxActive ? choiceLayout.labelAlignment : 'left'
                            }`}
                          >
                            <span className="preview-choice-label">
                              {getResolvedChoiceDisplayLabel(question, choiceIndex, choiceLayout)}
                            </span>
                            <div className="preview-choice-content">
                              {renderPreviewBlocks(choice.content, question, previewOptions)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {question.subQuestionGroup?.items.length ? (
                      <ol className="preview-subquestions">
                        {question.subQuestionGroup.items.map((item) => (
                          <li key={item.id}>
                            {renderPreviewBlocks(item.stem, question, previewOptions)}
                          </li>
                        ))}
                      </ol>
                    ) : null}
                    <QuestionTeacherPreview question={question} previewOptions={previewOptions} />
                  </div>
                );
              })}
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function renderPreviewInformation(frontMatter: ExamDocument['frontMatter']): ReactNode {
  if (frontMatter.informationFields.length === 0) {
    return null;
  }

  const separator = renderPreviewInformationSeparator(frontMatter.informationSeparator);

  return (
    <div
      className="preview-information"
      style={getPreviewSpacingStyle(frontMatter.informationSpacing)}
    >
      {frontMatter.informationFields.map((field, fieldIndex) => (
        <Fragment key={`${field.label}-${fieldIndex}`}>
          {fieldIndex > 0 && separator ? (
            <span className="preview-information-separator">{separator}</span>
          ) : null}
          <span className="preview-information-item">{renderPreviewInformationField(field)}</span>
        </Fragment>
      ))}
    </div>
  );
}

function renderPreviewInformationSeparator(
  separator: InformationSeparatorSetup | undefined,
): string {
  if (!separator) return '\u2003';
  switch (separator.mode) {
    case 'compactSpace':
      return '\u2002';
    case 'wideSpace':
      return '\u2003\u2003';
    case 'comma':
      return '，';
    case 'middleDot':
      return '·';
    case 'verticalBar':
      return '|';
    case 'none':
      return '';
    case 'custom':
      return separator.text ?? '';
  }
}

function getPreviewSpacingStyle(
  spacing: FrontMatterSpacing | undefined,
): CSSProperties | undefined {
  if (!spacing) return undefined;
  return {
    marginTop: latexDimensionToCssLength(spacing.top) ?? undefined,
    marginBottom: latexDimensionToCssLength(spacing.bottom) ?? undefined,
  };
}

function renderPreviewInformationField(field: InformationField): ReactNode {
  if (field.kind === 'text') {
    return <span className="preview-information-field">{field.label}</span>;
  }

  if (field.kind === 'squares') {
    return (
      <span className="preview-information-field">
        <span>{field.label}</span>
        <span className="preview-information-squares" aria-label={`${field.length} 个方格`}>
          {Array.from({ length: field.length }, (_, index) => (
            <span key={index} className="preview-information-square" aria-hidden="true" />
          ))}
        </span>
      </span>
    );
  }

  return (
    <span className="preview-information-field">
      <span>{field.label}</span>
      <span className="preview-information-line" style={{ width: field.width ?? '6em' }} />
    </span>
  );
}

function QuestionTeacherPreview({
  question,
  previewOptions,
}: {
  question: ExamQuestion;
  previewOptions: PreviewRenderOptions;
}) {
  const questionScorePresentation = resolvePreviewScorePresentation(
    question.scoreMarks ?? [],
    question.scoreMode,
    question.solution,
  );
  const questionAnnotationReferenceIds = new Set(collectAnnotationReferenceIds(question.solution));
  const trailingQuestionScores = questionScorePresentation.displayedScoreMarks;
  const trailingQuestionAnnotations = (question.solutionAnnotations ?? []).filter(
    (annotation) => !questionAnnotationReferenceIds.has(annotation.id),
  );
  const subQuestionItems = (question.subQuestionGroup?.items ?? [])
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => subQuestionHasTeacherPreviewContent(item));

  if (!previewOptions.showAnswers || !questionHasTeacherPreviewContent(question)) {
    return null;
  }

  return (
    <div className="preview-solution">
      {question.solution?.length ? (
        <div className="preview-solution-block">
          <span className="preview-solution-label">
            {getQuestionTeacherContentLabel(question.type)}：
          </span>
          {renderPreviewBlocks(question.solution, question, previewOptions, {
            scoreMarks: question.scoreMarks,
            annotations: question.solutionAnnotations,
          })}
        </div>
      ) : null}
      {trailingQuestionScores.length ? (
        <ScoreMarksPreview
          scoreMarks={trailingQuestionScores}
          scoreMode={question.scoreMode}
          effectivePoints={questionScorePresentation.effectivePoints}
        />
      ) : null}
      <SolutionAnnotationsPreview annotations={trailingQuestionAnnotations} />
      {subQuestionItems.length > 0 ? (
        <ol className="preview-subquestion-solutions">
          {subQuestionItems.map(({ item, index }) => {
            const scorePresentation = resolvePreviewScorePresentation(
              item.scoreMarks ?? [],
              item.scoreMode,
              item.solution,
            );
            const annotationReferenceIds = new Set(collectAnnotationReferenceIds(item.solution));
            const trailingScores = scorePresentation.displayedScoreMarks;
            const trailingAnnotations = (item.solutionAnnotations ?? []).filter(
              (annotation) => !annotationReferenceIds.has(annotation.id),
            );

            return (
              <li key={item.id} value={index + 1}>
                {item.solution?.length ? (
                  <div className="preview-solution-block">
                    <span className="preview-solution-label">
                      {getSubQuestionTeacherContentLabel(question.type)}：
                    </span>
                    {renderPreviewBlocks(item.solution, question, previewOptions, {
                      scoreMarks: item.scoreMarks,
                      annotations: item.solutionAnnotations,
                    })}
                  </div>
                ) : null}
                {trailingScores.length ? (
                  <ScoreMarksPreview
                    scoreMarks={trailingScores}
                    scoreMode={item.scoreMode}
                    effectivePoints={scorePresentation.effectivePoints}
                    compact
                  />
                ) : null}
                <SolutionAnnotationsPreview annotations={trailingAnnotations} compact />
              </li>
            );
          })}
        </ol>
      ) : null}
    </div>
  );
}

function ScoreMarksPreview({
  scoreMarks,
  scoreMode,
  effectivePoints,
  compact = false,
}: {
  scoreMarks: ScoreMark[];
  scoreMode?: ScoreMode;
  effectivePoints: number;
  compact?: boolean;
}) {
  const scoreItemLabel = getScoreItemLabel(scoreMode);
  const summaryPrefix = (scoreMode ?? 'additive') === 'levels' ? '最高' : '共';

  return (
    <div className={compact ? 'preview-score preview-score-compact' : 'preview-score'}>
      <div className="preview-score-heading">
        <span className="preview-score-title">{scoreItemLabel}</span>
        <span className="preview-score-total">
          {summaryPrefix} {effectivePoints} 分
        </span>
      </div>
      <ul>
        {scoreMarks.map((scoreMark) => (
          <li key={scoreMark.id}>
            <span className="preview-score-points">{scoreMark.points}分</span>
            {scoreMark.description?.length ? (
              <span>{renderPreviewInlineRichText(scoreMark.description)}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SolutionAnnotationsPreview({
  annotations,
  compact = false,
}: {
  annotations: SolutionAnnotation[];
  compact?: boolean;
}) {
  if (annotations.length === 0) return null;

  return (
    <div
      className={
        compact ? 'preview-annotations preview-annotations-compact' : 'preview-annotations'
      }
    >
      <span className="preview-annotation-title">解析批注：</span>
      {annotations.map((annotation) => (
        <span key={annotation.id} className="preview-inline-annotation">
          {renderPreviewInlineRichText(annotation.content)}
        </span>
      ))}
    </div>
  );
}

function renderPreviewInlineRichText(content: NonNullable<ScoreMark['description']>): ReactNode {
  return content.map((item, index) => {
    switch (item.type) {
      case 'text':
        return <Fragment key={index}>{item.text}</Fragment>;
      case 'inlineMath':
        return <MathPreview key={index} latex={item.latex} display={false} />;
      case 'rawLatex':
        return <Fragment key={index}>{item.latex}</Fragment>;
    }
  });
}

interface PreviewRenderOptions {
  document: Pick<ExamDocument, 'setup' | 'examZh'>;
  showAnswers: boolean;
  parenAnswerColor: 'black' | 'red';
  judgementAnswerColor: 'black' | 'red';
  fillinCounterState: { next: number };
}

function questionHasTeacherPreviewContent(question: ExamQuestion): boolean {
  return Boolean(
    question.solution?.length ||
    question.scoreMarks?.length ||
    question.solutionAnnotations?.length ||
    question.subQuestionGroup?.items.some(subQuestionHasTeacherPreviewContent),
  );
}

function subQuestionHasTeacherPreviewContent(item: SubQuestion): boolean {
  return Boolean(
    item.solution?.length || item.scoreMarks?.length || item.solutionAnnotations?.length,
  );
}

function TextField({
  label,
  value,
  inputRef,
  draftTarget,
  onDraftChange,
  onDraftEnd,
  onChange,
}: {
  label: string;
  value: string;
  inputRef?(element: HTMLInputElement | null): void;
  draftTarget?: TextPreviewDraftTarget;
  onDraftChange?(target: TextPreviewDraftTarget, value: string): void;
  onDraftEnd?(target: TextPreviewDraftTarget): void;
  onChange(value: string): void;
}) {
  const skipNextBlurCommitRef = useRef(false);
  const [isFocused, setIsFocused] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const visibleValue = isFocused ? draftValue : value;

  const clearDraft = () => {
    if (draftTarget) {
      onDraftEnd?.(draftTarget);
    }
  };

  const commitDraft = () => {
    if (draftValue !== value) {
      onChange(draftValue);
    }

    clearDraft();
  };

  const cancelDraft = () => {
    setDraftValue(value);
    clearDraft();
  };

  return (
    <label className="field">
      <span>{label}</span>
      <input
        ref={inputRef}
        value={visibleValue}
        onBlur={() => {
          if (skipNextBlurCommitRef.current) {
            skipNextBlurCommitRef.current = false;
            setIsFocused(false);
            return;
          }

          commitDraft();
          setIsFocused(false);
        }}
        onChange={(event) => {
          const nextValue = event.target.value;

          setDraftValue(nextValue);

          if (draftTarget) {
            onDraftChange?.(draftTarget, nextValue);
          }
        }}
        onFocus={() => {
          setDraftValue(value);
          setIsFocused(true);
        }}
        onKeyDown={(event) => {
          const action = getSingleLineInputKeyAction(event);

          if (!action) {
            return;
          }

          event.preventDefault();

          if (action === 'commit') {
            commitDraft();
          } else {
            cancelDraft();
          }

          skipNextBlurCommitRef.current = true;
          setIsFocused(false);
          event.currentTarget.blur();
        }}
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  onDraftChange,
  onDraftEnd,
  onInvalidInput,
}: {
  label: string;
  value: number | undefined;
  onChange(value: number | undefined): void;
  onDraftChange?(value: string): void;
  onDraftEnd?(): void;
  onInvalidInput(message: string): void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <DraftNumberInput
        value={value}
        mode="optional"
        warningLabel={label}
        onChange={onChange}
        onDraftChange={onDraftChange}
        onDraftEnd={onDraftEnd}
        onInvalidInput={onInvalidInput}
      />
    </label>
  );
}

function CompactNumberField({
  label,
  value,
  onChange,
  onDraftChange,
  onDraftEnd,
  onInvalidInput,
}: {
  label: string;
  value: number;
  onChange(value: number | undefined): void;
  onDraftChange?(value: string): void;
  onDraftEnd?(): void;
  onInvalidInput(message: string): void;
}) {
  return (
    <label className="compact-field">
      <span>{label}</span>
      <DraftNumberInput
        value={value}
        mode="required"
        warningLabel={label}
        onChange={onChange}
        onDraftChange={onDraftChange}
        onDraftEnd={onDraftEnd}
        onInvalidInput={onInvalidInput}
      />
    </label>
  );
}

function DraftNumberInput({
  value,
  mode,
  warningLabel,
  onChange,
  onDraftChange,
  onDraftEnd,
  onInvalidInput,
}: {
  value: number | undefined;
  mode: NumberDraftCommitMode;
  warningLabel: string;
  onChange(value: number | undefined): void;
  onDraftChange?(value: string): void;
  onDraftEnd?(): void;
  onInvalidInput(message: string): void;
}) {
  const cancelNextBlurRef = useRef(false);
  const [draftValue, setDraftValue] = useState(formatNumberDraftValue(value));
  const [isFocused, setIsFocused] = useState(false);
  const visibleValue = isFocused ? draftValue : formatNumberDraftValue(value);

  function commitDraft(): void {
    const result = commitNumberDraft(draftValue, value, mode);
    setDraftValue(formatNumberDraftValue(result.value));

    if (result.warning) {
      onInvalidInput(`${warningLabel}：${result.warning}`);
    }

    if (result.value !== value) {
      onChange(result.value);
    }
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={visibleValue}
      onBlur={() => {
        if (cancelNextBlurRef.current) {
          cancelNextBlurRef.current = false;
          setDraftValue(formatNumberDraftValue(value));
          setIsFocused(false);
          onDraftEnd?.();
          return;
        }

        commitDraft();
        setIsFocused(false);
        onDraftEnd?.();
      }}
      onChange={(event) => {
        setDraftValue(event.target.value);
        onDraftChange?.(event.target.value);
      }}
      onFocus={() => {
        setDraftValue(formatNumberDraftValue(value));
        setIsFocused(true);
      }}
      onKeyDown={(event) => {
        const action = getSingleLineInputKeyAction(event);

        if (!action) {
          return;
        }

        event.preventDefault();

        if (action === 'cancel') {
          cancelNextBlurRef.current = true;
          setDraftValue(formatNumberDraftValue(value));
        }

        event.currentTarget.blur();
      }}
    />
  );
}

function IconButton({
  title,
  disabled = false,
  icon,
  onClick,
}: {
  title: string;
  disabled?: boolean;
  icon: ReactNode;
  onClick(): void;
}) {
  return (
    <TooltipAnchor text={title} disabled={disabled}>
      <button
        type="button"
        className="icon-button"
        aria-label={title}
        disabled={disabled}
        onClick={onClick}
      >
        {icon}
      </button>
    </TooltipAnchor>
  );
}

function updateBlank(
  question: ExamQuestion,
  blankId: string,
  patch: Partial<BlankSlot>,
): ExamQuestion {
  return {
    ...question,
    blanks: (question.blanks ?? []).map((blank) =>
      blank.id === blankId ? { ...blank, ...patch } : blank,
    ),
  };
}

function replaceBlank(
  question: ExamQuestion,
  blankId: string,
  replacement: BlankSlot,
): ExamQuestion {
  return {
    ...question,
    blanks: (question.blanks ?? []).map((blank) => (blank.id === blankId ? replacement : blank)),
  };
}

function renderPreviewBlocks(
  blocks: RichContentBlock[],
  question: ExamQuestion,
  options: PreviewRenderOptions,
  teacherContent?: {
    scoreMarks?: ScoreMark[];
    annotations?: SolutionAnnotation[];
  },
): ReactNode {
  return blocks.map((block, index) => (
    <Fragment key={index}>
      {renderPreviewBlock(block, question, options, index === 0, teacherContent)}
    </Fragment>
  ));
}

function renderPreviewBlock(
  block: RichContentBlock,
  question: ExamQuestion,
  options: PreviewRenderOptions,
  isFirstBlock: boolean,
  teacherContent?: {
    scoreMarks?: ScoreMark[];
    annotations?: SolutionAnnotation[];
  },
): ReactNode {
  switch (block.type) {
    case 'paragraph':
      return (
        <span
          className={
            isFirstBlock
              ? 'preview-content-paragraph preview-content-paragraph-first'
              : 'preview-content-paragraph'
          }
        >
          {block.children.map((child, index) => (
            <span key={index}>{renderPreviewInline(child, question, options, teacherContent)}</span>
          ))}
        </span>
      );
    case 'displayMath':
      return (
        <span className="preview-content-display">
          <MathPreview latex={block.latex} display />
        </span>
      );
    case 'rawLatex':
      return (
        <span
          className={
            isFirstBlock
              ? 'preview-content-paragraph preview-content-paragraph-first'
              : 'preview-content-paragraph'
          }
        >
          {block.latex}
        </span>
      );
    case 'list':
      return (
        <span className="preview-content-list">
          {block.items.map((item, index) => (
            <span key={index} className="preview-content-list-item">
              {index + 1}. {renderPreviewBlocks(item, question, options, teacherContent)}
            </span>
          ))}
        </span>
      );
    case 'image':
      return <span className="preview-content-paragraph">[image]</span>;
    case 'figureGroup':
      return <span className="preview-content-paragraph">[figures]</span>;
    case 'textFigure':
      return renderPreviewBlocks(block.text, question, options, teacherContent);
  }
}

function renderPreviewInline(
  content: InlineContent,
  question: ExamQuestion,
  options: PreviewRenderOptions,
  teacherContent?: {
    scoreMarks?: ScoreMark[];
    annotations?: SolutionAnnotation[];
  },
): ReactNode {
  switch (content.type) {
    case 'text':
      return normalizePreviewInlineText(content.text);
    case 'inlineMath':
      return <MathPreview latex={content.latex} display={false} />;
    case 'rawLatex':
      return content.latex;
    case 'blankRef': {
      const blank = question.blanks?.find((item) => item.id === content.blankId);
      return blank ? renderPreviewBlank(blank, question, options) : null;
    }
    case 'choiceParenRef':
      return <span className="preview-paren">{renderPreviewChoiceParen(question, options)}</span>;
    case 'judgementRef':
      return question.type === 'judgement' ? (
        <span className="preview-judgement preview-judgement-inline">
          {renderPreviewJudgement(question, options, 'inline')}
        </span>
      ) : null;
    case 'scoreRef': {
      const scoreMark = teacherContent?.scoreMarks?.find((item) => item.id === content.scoreMarkId);
      return scoreMark ? (
        <span className="preview-inline-score">{scoreMark.points}分</span>
      ) : (
        <span className="preview-inline-reference-missing">评分位置失效</span>
      );
    }
    case 'annotationRef': {
      const annotation = teacherContent?.annotations?.find(
        (item) => item.id === content.annotationId,
      );
      return annotation ? (
        <span className="preview-inline-annotation">
          {renderPreviewInlineRichText(annotation.content)}
        </span>
      ) : (
        <span className="preview-inline-reference-missing">批注位置失效</span>
      );
    }
    case 'stemLine':
      return <span className="preview-stem-line" aria-label="题干横线" />;
  }
}

function renderPreviewBlank(
  blank: BlankSlot,
  question: ExamQuestion,
  options: PreviewRenderOptions,
): ReactNode {
  const answer = blank.answer ?? [];
  const layout = resolveFillinLayout(options.document, blank);
  const hasVisibleAnswer = layout.showAnswer && answer.length > 0;
  const width = latexDimensionToCssLength(layout.width) ?? '3em';
  const style = { '--preview-blank-width': width } as CSSProperties;

  const counterContent = consumeFillinCounterPreviewLabel(layout, options.fillinCounterState);
  let hiddenContent: ReactNode = counterContent ?? null;
  if (!layout.showAnswer && layout.noAnswerType === 'blacktriangle') {
    hiddenContent = '▲';
  }

  const classNames = [
    'preview-blank',
    `preview-blank-type-${layout.type}`,
    layout.type === 'paren' ? `preview-blank-paren-${layout.parenType}` : '',
    hasVisibleAnswer ? 'preview-blank-answer' : 'preview-blank-empty',
    !layout.showAnswer && layout.noAnswerType !== 'none' ? 'preview-blank-marker' : '',
    layout.textColor === 'red' ? 'preview-blank-answer-red' : '',
    layout.boxColor === 'red' ? 'preview-blank-box-red' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classNames} style={style}>
      {layout.showAnswer ? renderPreviewBlocks(answer, question, options) : hiddenContent}
    </span>
  );
}

function previewBlocksContainFillin(blocks: RichContentBlock[]): boolean {
  return blocks.some((block) => {
    switch (block.type) {
      case 'paragraph':
        return block.children.some(
          (content) =>
            content.type === 'blankRef' ||
            (content.type === 'rawLatex' && /\\fillin\*?/u.test(content.latex)),
        );
      case 'rawLatex':
        return /\\fillin\*?/u.test(block.latex);
      case 'list':
        return block.items.some((item) => previewBlocksContainFillin(item));
      case 'textFigure':
        return previewBlocksContainFillin(block.text);
      case 'displayMath':
      case 'image':
      case 'figureGroup':
        return false;
    }
  });
}

function renderPreviewChoiceParen(
  question: ExamQuestion,
  options: PreviewRenderOptions,
): ReactNode {
  return (
    <>
      （
      {options.showAnswers ? (
        <span
          className={
            options.parenAnswerColor === 'red'
              ? 'preview-paren-answer preview-paren-answer-red'
              : 'preview-paren-answer'
          }
        >
          {formatChoiceAnswer(question, options.document)}
        </span>
      ) : null}
      ）
    </>
  );
}

function renderPreviewJudgement(
  question: ExamQuestion,
  options: PreviewRenderOptions,
  placement: 'lineEnd' | 'inline',
): ReactNode {
  const answer = formatJudgementAnswer(
    {
      correctAnswer: question.judgement?.correctAnswer,
      answerStyle: question.judgement?.answerStyle ?? 'text',
    },
    'unicode',
  );
  const parenType = placement === 'inline' ? resolveFillinLayout(options.document).parenType : null;
  const leftParen = parenType === 'banjiao' ? '(' : '（';
  const rightParen = parenType === 'banjiao' ? ')' : '）';

  return (
    <>
      {leftParen}
      {options.showAnswers && answer ? (
        <span
          className={
            options.judgementAnswerColor === 'red'
              ? 'preview-judgement-answer preview-judgement-answer-red'
              : 'preview-judgement-answer'
          }
        >
          {answer}
        </span>
      ) : null}
      {rightParen}
    </>
  );
}

function normalizePreviewInlineText(text: string): string {
  return text.replace(/[ \t]*\r?\n[ \t]*/gu, ' ');
}

function blocksContainChoiceParenRef(blocks: RichContentBlock[]): boolean {
  return blocks.some(blockContainsChoiceParenRef);
}

function blocksContainJudgementRef(blocks: RichContentBlock[]): boolean {
  return blocks.some((block) => {
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
  });
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

function formatChoiceAnswer(
  question: ExamQuestion,
  document: Pick<ExamDocument, 'setup' | 'examZh'>,
): string {
  const choices = question.choices ?? [];
  const layout = resolveChoiceLayout(document, question);

  return orderChoiceIdsByChoices(question.correctChoiceIds ?? [], choices)
    .map((choiceId) => {
      const choiceIndex = choices.findIndex((choice) => choice.id === choiceId);
      return choiceIndex >= 0
        ? getResolvedChoiceAnswerLabel(question, choiceIndex, layout)
        : choiceId;
    })
    .join('');
}

function orderChoiceIdsByChoices(choiceIds: string[], choices: ChoiceOption[]): string[] {
  if (choices.length === 0) {
    return choiceIds;
  }

  const selectedKeys = new Set(choiceIds);
  const orderedKeys = choices
    .map((choice) => choice.id)
    .filter((choiceId) => selectedKeys.has(choiceId));
  const knownChoiceIds = new Set(choices.map((choice) => choice.id));
  const unknownKeys = choiceIds.filter((choiceId) => !knownChoiceIds.has(choiceId));

  return [...orderedKeys, ...unknownKeys];
}

function formatProvider(provider: ExportPdfArtifactResult['provider']): string {
  if (provider === 'latexmk-xelatex') {
    return 'latexmk + XeLaTeX';
  }

  if (provider === 'xelatex') {
    return 'XeLaTeX';
  }

  if (provider === 'tectonic') {
    return 'Tectonic';
  }

  return '未检测到';
}

function toChineseSectionNumber(value: number): string {
  const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

  if (value <= 10) {
    return value === 10 ? '十' : digits[value];
  }

  if (value < 20) {
    return `十${digits[value - 10]}`;
  }

  const tens = Math.floor(value / 10);
  const ones = value % 10;
  return `${digits[tens]}十${ones === 0 ? '' : digits[ones]}`;
}

function createQuestionWithPreferredScoreMode(
  type: QuestionType,
  preferredScoreMode: ScoreMode,
): ExamQuestion {
  const question = createDefaultQuestion(type, createId);

  return question.type === 'rawLatex' ? question : { ...question, scoreMode: preferredScoreMode };
}

function getQuestionStemContext(question: ExamQuestion): MathSnippetContext {
  switch (question.type) {
    case 'singleChoice':
    case 'multipleChoice':
      return 'choiceStem';
    case 'blank':
      return 'blankStem';
    case 'judgement':
      return 'judgementStem';
    case 'problem':
      return 'problemStem';
    case 'rawLatex':
      return 'generic';
  }
}

function formatNumberDraftValue(value: number | undefined): string {
  return value === undefined ? '' : String(value);
}
