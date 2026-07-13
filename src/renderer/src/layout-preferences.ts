import type { AppEnvironment } from '../../shared/ipc/contracts';

export type LayoutPane = 'outline' | 'preview';
export type ActiveNarrowPane = LayoutPane | null;

export interface LayoutPaneWidthConfig {
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  collapseThreshold: number;
}

export const layoutPaneWidthConfigs: Record<LayoutPane, LayoutPaneWidthConfig> = {
  outline: {
    defaultWidth: 300,
    minWidth: 280,
    maxWidth: 360,
    collapseThreshold: 160,
  },
  preview: {
    defaultWidth: 380,
    minWidth: 300,
    maxWidth: 640,
    collapseThreshold: 260,
  },
};

export const editorPaneMinContentWidth = 500;
export const editorPaneMinWidth = editorPaneMinContentWidth + 32;
export const paneRailWidth = 44;
const pdfFitWidthMax = 1080;
const pdfFitWidthFallback = 620;

export interface LayoutPreferences {
  outlineCollapsed: boolean;
  previewCollapsed: boolean;
  outlineWidth: number;
  previewWidth: number;
}

export interface LayoutPaneWidths {
  outlineWidth: number;
  previewWidth: number;
}

export const layoutPreferenceStorageKeys = {
  outlineCollapsed: 'exam-zh-gui.layout.outline-collapsed',
  previewCollapsed: 'exam-zh-gui.layout.preview-collapsed',
  outlineWidth: 'exam-zh-gui.layout.outline-width',
  previewWidth: 'exam-zh-gui.layout.preview-width',
} as const;

export function readLayoutPreferences(storage: Pick<Storage, 'getItem'>): LayoutPreferences {
  return {
    outlineCollapsed:
      normalizeStoredBoolean(storage.getItem(layoutPreferenceStorageKeys.outlineCollapsed)) ??
      false,
    previewCollapsed:
      normalizeStoredBoolean(storage.getItem(layoutPreferenceStorageKeys.previewCollapsed)) ??
      false,
    outlineWidth:
      normalizeStoredPaneWidth(
        'outline',
        storage.getItem(layoutPreferenceStorageKeys.outlineWidth),
      ) ?? layoutPaneWidthConfigs.outline.defaultWidth,
    previewWidth:
      normalizeStoredPaneWidth(
        'preview',
        storage.getItem(layoutPreferenceStorageKeys.previewWidth),
      ) ?? layoutPaneWidthConfigs.preview.defaultWidth,
  };
}

export function writeLayoutPaneCollapsed(
  storage: Pick<Storage, 'setItem'>,
  pane: LayoutPane,
  collapsed: boolean,
): void {
  const key =
    pane === 'outline'
      ? layoutPreferenceStorageKeys.outlineCollapsed
      : layoutPreferenceStorageKeys.previewCollapsed;

  storage.setItem(key, String(collapsed));
}

export function writeLayoutPaneWidth(
  storage: Pick<Storage, 'setItem'>,
  pane: LayoutPane,
  width: number,
): void {
  const key =
    pane === 'outline'
      ? layoutPreferenceStorageKeys.outlineWidth
      : layoutPreferenceStorageKeys.previewWidth;

  storage.setItem(key, String(clampLayoutPaneWidth(pane, width)));
}

export function toggleActiveNarrowPane(
  current: ActiveNarrowPane,
  pane: LayoutPane,
): ActiveNarrowPane {
  return current === pane ? null : pane;
}

export function closeActiveNarrowPane(): ActiveNarrowPane {
  return null;
}

export function togglePreviewFocusMode(current: boolean): boolean {
  return !current;
}

export function closePreviewFocusMode(): boolean {
  return false;
}

export function getActiveNarrowPaneAfterPdfSuccess(
  current: ActiveNarrowPane,
  isNarrowLayout: boolean,
): ActiveNarrowPane {
  return isNarrowLayout ? 'preview' : current;
}

export function clampLayoutPaneWidth(pane: LayoutPane, width: number): number {
  const config = layoutPaneWidthConfigs[pane];

  return Math.max(config.minWidth, Math.min(width, config.maxWidth));
}

export interface LayoutPaneResizeResult {
  collapsed: boolean;
  width: number;
}

export interface LayoutPaneResizeCommitOptions {
  pane: LayoutPane;
  requestedWidth: number;
  currentWidths: LayoutPaneWidths;
  effectiveWidths: LayoutPaneWidths;
  outlineCollapsed: boolean;
  previewCollapsed: boolean;
}

export function resolveLayoutPaneResize(
  pane: LayoutPane,
  proposedWidth: number,
  currentWidth: number,
): LayoutPaneResizeResult {
  const config = layoutPaneWidthConfigs[pane];

  if (proposedWidth < config.collapseThreshold) {
    return {
      collapsed: true,
      width: clampLayoutPaneWidth(pane, currentWidth),
    };
  }

  return {
    collapsed: false,
    width: clampLayoutPaneWidth(pane, proposedWidth),
  };
}

export function resolveLayoutPaneResizeCommit({
  pane,
  requestedWidth,
  currentWidths,
  effectiveWidths,
  outlineCollapsed,
  previewCollapsed,
}: LayoutPaneResizeCommitOptions): LayoutPaneWidths {
  return {
    outlineWidth:
      pane === 'outline'
        ? clampLayoutPaneWidth('outline', requestedWidth)
        : outlineCollapsed
          ? currentWidths.outlineWidth
          : clampLayoutPaneWidth('outline', effectiveWidths.outlineWidth),
    previewWidth:
      pane === 'preview'
        ? clampLayoutPaneWidth('preview', requestedWidth)
        : previewCollapsed
          ? currentWidths.previewWidth
          : clampLayoutPaneWidth('preview', effectiveWidths.previewWidth),
  };
}

export function calculateEffectivePaneWidths({
  workspaceWidth,
  outlineWidth,
  previewWidth,
  outlineCollapsed,
  previewCollapsed,
  priorityPane,
}: {
  workspaceWidth: number;
  outlineWidth: number;
  previewWidth: number;
  outlineCollapsed: boolean;
  previewCollapsed: boolean;
  priorityPane?: LayoutPane | null;
}): LayoutPaneWidths {
  const widths = {
    outlineWidth: outlineCollapsed ? paneRailWidth : clampLayoutPaneWidth('outline', outlineWidth),
    previewWidth: previewCollapsed ? paneRailWidth : clampLayoutPaneWidth('preview', previewWidth),
  };

  if (workspaceWidth <= 0) {
    return widths;
  }

  const maxPaneTotalWidth = workspaceWidth - editorPaneMinWidth;
  let overflow = widths.outlineWidth + widths.previewWidth - maxPaneTotalWidth;

  if (overflow <= 0) {
    return widths;
  }

  const shrinkPane = (pane: LayoutPane): void => {
    if (overflow <= 0) {
      return;
    }

    const key = pane === 'outline' ? 'outlineWidth' : 'previewWidth';
    const minWidth =
      (pane === 'outline' && outlineCollapsed) || (pane === 'preview' && previewCollapsed)
        ? paneRailWidth
        : layoutPaneWidthConfigs[pane].minWidth;
    const availableShrink = Math.max(0, widths[key] - minWidth);
    const shrinkBy = Math.min(overflow, availableShrink);

    widths[key] -= shrinkBy;
    overflow -= shrinkBy;
  };

  if (priorityPane === 'outline') {
    shrinkPane('preview');
    shrinkPane('outline');
  } else if (priorityPane === 'preview') {
    shrinkPane('outline');
    shrinkPane('preview');
  } else {
    shrinkPane('preview');
    shrinkPane('outline');
  }

  return widths;
}

export function calculatePdfFitWidth(containerClientWidth: number): number {
  const availableWidth = containerClientWidth > 0 ? containerClientWidth - 2 : pdfFitWidthFallback;

  return Math.max(1, Math.min(availableWidth, pdfFitWidthMax));
}

export function formatAppSignature(
  environment: AppEnvironment | null,
  variant: 'full' | 'compact',
): string {
  if (!environment) {
    return '环境读取中';
  }

  if (variant === 'compact') {
    return '朱孝诚 · Driver066';
  }

  return `exam-zh GUI · 制作：朱孝诚 · GitHub: Driver066 · Electron ${environment.versions.electron}`;
}

function normalizeStoredBoolean(value: string | null): boolean | null {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return null;
}

function normalizeStoredPaneWidth(pane: LayoutPane, value: string | null): number | null {
  if (value === null) {
    return null;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return null;
  }

  return clampLayoutPaneWidth(pane, parsedValue);
}
