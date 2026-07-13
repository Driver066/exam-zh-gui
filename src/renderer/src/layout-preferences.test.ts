import { describe, expect, it } from 'vitest';

import type { AppEnvironment } from '../../shared/ipc/contracts';
import {
  calculateEffectivePaneWidths,
  calculatePdfFitWidth,
  clampLayoutPaneWidth,
  closeActiveNarrowPane,
  closePreviewFocusMode,
  editorPaneMinContentWidth,
  editorPaneMinWidth,
  formatAppSignature,
  getActiveNarrowPaneAfterPdfSuccess,
  layoutPreferenceStorageKeys,
  paneRailWidth,
  readLayoutPreferences,
  resolveLayoutPaneResize,
  resolveLayoutPaneResizeCommit,
  toggleActiveNarrowPane,
  togglePreviewFocusMode,
  writeLayoutPaneCollapsed,
  writeLayoutPaneWidth,
} from './layout-preferences';

describe('layout preferences', () => {
  it('uses default collapsed states when storage is empty or invalid', () => {
    expect(readLayoutPreferences(createStorage())).toEqual({
      outlineCollapsed: false,
      previewCollapsed: false,
      outlineWidth: 300,
      previewWidth: 380,
    });
    expect(
      readLayoutPreferences(
        createStorage({
          [layoutPreferenceStorageKeys.outlineCollapsed]: 'maybe',
          [layoutPreferenceStorageKeys.previewCollapsed]: '1',
          [layoutPreferenceStorageKeys.outlineWidth]: 'wide',
          [layoutPreferenceStorageKeys.previewWidth]: '-1',
        }),
      ),
    ).toEqual({
      outlineCollapsed: false,
      previewCollapsed: false,
      outlineWidth: 300,
      previewWidth: 300,
    });
  });

  it('writes and reads collapsed states', () => {
    const storage = createStorage();

    writeLayoutPaneCollapsed(storage, 'outline', true);
    writeLayoutPaneCollapsed(storage, 'preview', true);

    expect(readLayoutPreferences(storage)).toEqual({
      outlineCollapsed: true,
      previewCollapsed: true,
      outlineWidth: 300,
      previewWidth: 380,
    });
  });

  it('writes and clamps pane widths', () => {
    const storage = createStorage();

    writeLayoutPaneWidth(storage, 'outline', 320);
    writeLayoutPaneWidth(storage, 'preview', 700);

    expect(readLayoutPreferences(storage)).toMatchObject({
      outlineWidth: 320,
      previewWidth: 640,
    });
    expect(clampLayoutPaneWidth('outline', 120)).toBe(280);
    expect(clampLayoutPaneWidth('preview', 1000)).toBe(640);
    expect(
      readLayoutPreferences(createStorage({ [layoutPreferenceStorageKeys.outlineWidth]: '230' }))
        .outlineWidth,
    ).toBe(280);
  });

  it('resolves pane resize collapse thresholds', () => {
    expect(resolveLayoutPaneResize('outline', 159, 300)).toEqual({
      collapsed: true,
      width: 300,
    });
    expect(resolveLayoutPaneResize('outline', 170, 300)).toEqual({
      collapsed: false,
      width: 280,
    });
    expect(resolveLayoutPaneResize('preview', 250, 380)).toEqual({
      collapsed: true,
      width: 380,
    });
    expect(resolveLayoutPaneResize('preview', 280, 380)).toEqual({
      collapsed: false,
      width: 300,
    });
  });

  it('compresses the non-priority pane before the dragged pane', () => {
    expect(
      calculateEffectivePaneWidths({
        workspaceWidth: 1440,
        outlineWidth: 360,
        previewWidth: 640,
        outlineCollapsed: false,
        previewCollapsed: false,
        priorityPane: 'outline',
      }),
    ).toEqual({
      outlineWidth: 360,
      previewWidth: 548,
    });
    expect(
      calculateEffectivePaneWidths({
        workspaceWidth: 1440,
        outlineWidth: 360,
        previewWidth: 640,
        outlineCollapsed: false,
        previewCollapsed: false,
        priorityPane: 'preview',
      }),
    ).toEqual({
      outlineWidth: 280,
      previewWidth: 628,
    });
    expect(
      calculateEffectivePaneWidths({
        workspaceWidth: 1440,
        outlineWidth: 300,
        previewWidth: 640,
        outlineCollapsed: false,
        previewCollapsed: false,
        priorityPane: 'outline',
      }),
    ).toEqual({
      outlineWidth: 300,
      previewWidth: 608,
    });
  });

  it('commits the width surrendered by the non-dragged pane without losing the requested width', () => {
    const previewDraft = calculateEffectivePaneWidths({
      workspaceWidth: 1440,
      outlineWidth: 300,
      previewWidth: 640,
      outlineCollapsed: false,
      previewCollapsed: false,
      priorityPane: 'preview',
    });
    const previewCommit = resolveLayoutPaneResizeCommit({
      pane: 'preview',
      requestedWidth: 640,
      currentWidths: { outlineWidth: 300, previewWidth: 380 },
      effectiveWidths: previewDraft,
      outlineCollapsed: false,
      previewCollapsed: false,
    });

    expect(previewDraft).toEqual({ outlineWidth: 280, previewWidth: 628 });
    expect(previewCommit).toEqual({ outlineWidth: 280, previewWidth: 640 });
    expect(
      calculateEffectivePaneWidths({
        workspaceWidth: 1440,
        ...previewCommit,
        outlineCollapsed: false,
        previewCollapsed: false,
      }),
    ).toEqual(previewDraft);

    const outlineDraft = calculateEffectivePaneWidths({
      workspaceWidth: 1120,
      outlineWidth: 360,
      previewWidth: 380,
      outlineCollapsed: false,
      previewCollapsed: false,
      priorityPane: 'outline',
    });

    expect(
      resolveLayoutPaneResizeCommit({
        pane: 'outline',
        requestedWidth: 360,
        currentWidths: { outlineWidth: 300, previewWidth: 380 },
        effectiveWidths: outlineDraft,
        outlineCollapsed: false,
        previewCollapsed: false,
      }),
    ).toEqual({ outlineWidth: 360, previewWidth: 300 });
  });

  it('does not overwrite the stored preference of a collapsed non-dragged pane', () => {
    expect(
      resolveLayoutPaneResizeCommit({
        pane: 'preview',
        requestedWidth: 640,
        currentWidths: { outlineWidth: 360, previewWidth: 380 },
        effectiveWidths: { outlineWidth: paneRailWidth, previewWidth: 544 },
        outlineCollapsed: true,
        previewCollapsed: false,
      }),
    ).toEqual({ outlineWidth: 360, previewWidth: 640 });
  });

  it('reserves 500 pixels of usable editor content in the wide layout', () => {
    const workspaceWidth = 1120;
    const widths = calculateEffectivePaneWidths({
      workspaceWidth,
      outlineWidth: 230,
      previewWidth: 380,
      outlineCollapsed: false,
      previewCollapsed: false,
    });

    expect(editorPaneMinContentWidth).toBe(500);
    expect(editorPaneMinWidth).toBe(532);
    expect(workspaceWidth - widths.outlineWidth - widths.previewWidth).toBe(editorPaneMinWidth);
  });

  it('shrinks maximum saved side panes to protect the editor at the default window width', () => {
    const workspaceWidth = 1280;
    const widths = calculateEffectivePaneWidths({
      workspaceWidth,
      outlineWidth: 360,
      previewWidth: 640,
      outlineCollapsed: false,
      previewCollapsed: false,
    });

    expect(widths).toEqual({ outlineWidth: 360, previewWidth: 388 });
    expect(workspaceWidth - widths.outlineWidth - widths.previewWidth).toBe(editorPaneMinWidth);
  });

  it('keeps collapsed pane widths fixed when calculating effective widths', () => {
    expect(
      calculateEffectivePaneWidths({
        workspaceWidth: 1120,
        outlineWidth: 360,
        previewWidth: 640,
        outlineCollapsed: true,
        previewCollapsed: false,
        priorityPane: 'preview',
      }),
    ).toEqual({
      outlineWidth: 44,
      previewWidth: 544,
    });
  });

  it('keeps only one narrow pane open at a time', () => {
    expect(toggleActiveNarrowPane(null, 'outline')).toBe('outline');
    expect(toggleActiveNarrowPane('outline', 'preview')).toBe('preview');
    expect(toggleActiveNarrowPane('preview', 'preview')).toBeNull();
    expect(closeActiveNarrowPane()).toBeNull();
  });

  it('opens the preview pane after PDF success only in narrow layout', () => {
    expect(getActiveNarrowPaneAfterPdfSuccess(null, true)).toBe('preview');
    expect(getActiveNarrowPaneAfterPdfSuccess('outline', true)).toBe('preview');
    expect(getActiveNarrowPaneAfterPdfSuccess(null, false)).toBeNull();
    expect(getActiveNarrowPaneAfterPdfSuccess('outline', false)).toBe('outline');
  });

  it('toggles preview focus mode without persistence state', () => {
    expect(togglePreviewFocusMode(false)).toBe(true);
    expect(togglePreviewFocusMode(true)).toBe(false);
    expect(closePreviewFocusMode()).toBe(false);
  });

  it('calculates fit-width PDF canvas widths', () => {
    expect(calculatePdfFitWidth(0)).toBe(620);
    expect(calculatePdfFitWidth(220)).toBe(218);
    expect(calculatePdfFitWidth(250)).toBe(248);
    expect(calculatePdfFitWidth(382)).toBe(380);
    expect(calculatePdfFitWidth(1600)).toBe(1080);
  });

  it('formats the app signature for wide and narrow status bars', () => {
    const environment: AppEnvironment = {
      appName: 'exam-zh-gui',
      appVersion: '0.0.0',
      platform: 'darwin',
      versions: {
        chrome: '143.0.0',
        electron: '43.1.0',
        node: '24.0.0',
      },
    };

    expect(formatAppSignature(environment, 'full')).toBe(
      'exam-zh GUI · 制作：朱孝诚 · GitHub: Driver066 · Electron 43.1.0',
    );
    expect(formatAppSignature(environment, 'compact')).toBe('朱孝诚 · Driver066');
    expect(formatAppSignature(null, 'full')).toBe('环境读取中');
  });
});

function createStorage(initial: Record<string, string> = {}): Pick<Storage, 'getItem' | 'setItem'> {
  const values = new Map(Object.entries(initial));

  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}
