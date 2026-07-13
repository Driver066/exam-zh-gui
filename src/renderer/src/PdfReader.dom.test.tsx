// @vitest-environment jsdom

import { fireEvent, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ExportPdfArtifactResult } from '../../shared/ipc/contracts';
import './test/setup-dom';

const pdfMocks = vi.hoisted(() => ({
  createLoadingTask: (() => undefined) as () => unknown,
}));

vi.mock('pdfjs-dist/build/pdf.mjs', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  TextLayer: class {
    render(): Promise<void> {
      return Promise.resolve();
    }

    cancel(): void {}
  },
  getDocument: () => pdfMocks.createLoadingTask(),
}));

vi.mock('pdfjs-dist/build/pdf.worker.mjs?url', () => ({
  default: 'pdf.worker.mjs',
}));

import { PdfReader } from './PdfReader';

class TestResizeObserver {
  observe(): void {}
  disconnect(): void {}
  unobserve(): void {}
}

describe('PDF reader DOM behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('ResizeObserver', TestResizeObserver);
    const page = {
      getViewport: ({ scale }: { scale: number }) => ({
        width: 600 * scale,
        height: 800 * scale,
      }),
    };
    const pdfDocument = {
      numPages: 2,
      getPage: vi.fn(() => Promise.resolve(page)),
    };
    pdfMocks.createLoadingTask = () => ({
      promise: Promise.resolve(pdfDocument),
      destroy: vi.fn(),
    });
  });

  it('releases its restore frame so mouse scrolling updates the visible page', async () => {
    const onStatusChange = vi.fn();
    const { container } = render(
      <PdfReader
        result={createPdfResult()}
        initialPosition={{ currentPage: 1, scrollTop: 0 }}
        onPositionChange={() => undefined}
        onStatusChange={onStatusChange}
        onControllerChange={() => undefined}
        onActivate={() => undefined}
        onReveal={() => undefined}
        onRenderErrorChange={() => undefined}
        onTextLayerWarningChange={() => undefined}
      />,
    );

    await waitFor(() => expect(container.querySelectorAll('.pdf-rendered-page')).toHaveLength(2));
    await waitForAnimationFrames(3);
    onStatusChange.mockClear();

    const scrollElement = container.querySelector<HTMLElement>('.pdf-reader-scroll');
    const pages = container.querySelectorAll<HTMLElement>('.pdf-rendered-page');
    expect(scrollElement).not.toBeNull();
    expect(pages).toHaveLength(2);

    vi.spyOn(scrollElement!, 'getBoundingClientRect').mockReturnValue(rect(0, 600));
    vi.spyOn(pages[0]!, 'getBoundingClientRect').mockReturnValue(rect(-800, 0));
    vi.spyOn(pages[1]!, 'getBoundingClientRect').mockReturnValue(rect(0, 800));

    fireEvent.scroll(scrollElement!);

    await waitFor(() =>
      expect(onStatusChange).toHaveBeenLastCalledWith('teacher', {
        currentPage: 2,
        pageCount: 2,
      }),
    );
  });
});

function createPdfResult(): ExportPdfArtifactResult {
  return {
    variant: 'teacher',
    success: true,
    pdfDataBase64: window.btoa('test-pdf'),
    diagnostics: [],
    durationMs: 10,
    log: '',
  };
}

function rect(top: number, bottom: number): DOMRect {
  return {
    x: 0,
    y: top,
    top,
    bottom,
    left: 0,
    right: 600,
    width: 600,
    height: bottom - top,
    toJSON: () => ({}),
  } as DOMRect;
}

async function waitForAnimationFrames(count: number): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
  }
}
