import { FolderSearch, LoaderCircle, RefreshCw, TriangleAlert } from 'lucide-react';
import {
  GlobalWorkerOptions,
  TextLayer,
  getDocument,
  type PDFDocumentProxy,
  type RenderTask,
} from 'pdfjs-dist/build/pdf.mjs';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';

import type { ExportPdfArtifactResult, PdfExportVariant } from '../../shared/ipc/contracts';
import { calculatePdfFitWidth } from './layout-preferences';
import { waitForPdfLoad } from './pdf-load-timeout';
import {
  selectMostVisiblePdfPage,
  type PdfPageVisibility,
  type PdfReaderPosition,
} from './pdf-reader-state';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PdfPageLayout {
  pageNumber: number;
  width: number;
  height: number;
}

export interface PdfReaderStatus {
  currentPage: number;
  pageCount: number;
}

export interface PdfReaderController {
  jumpToPage(pageNumber: number, behavior?: ScrollBehavior): void;
}

export function PdfReader({
  result,
  initialPosition,
  onPositionChange,
  onStatusChange,
  onControllerChange,
  onActivate,
  onReveal,
  onRenderErrorChange,
  onTextLayerWarningChange,
}: {
  result: ExportPdfArtifactResult;
  initialPosition: PdfReaderPosition;
  onPositionChange(variant: PdfExportVariant, position: PdfReaderPosition): void;
  onStatusChange(variant: PdfExportVariant, status: PdfReaderStatus): void;
  onControllerChange(variant: PdfExportVariant, controller: PdfReaderController | null): void;
  onActivate(variant: PdfExportVariant): void;
  onReveal(artifact: ExportPdfArtifactResult): void;
  onRenderErrorChange(variant: PdfExportVariant, error: string | null): void;
  onTextLayerWarningChange(variant: PdfExportVariant, warning: string | null): void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const previousContainerWidthRef = useRef(0);
  const positionRef = useRef(initialPosition);
  const textLayerWarningRef = useRef<string | null>(null);
  const [mountInitialPosition] = useState(initialPosition);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [pageLayouts, setPageLayouts] = useState<PdfPageLayout[]>([]);
  const [renderState, setRenderState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [renderAttempt, setRenderAttempt] = useState(0);

  const reportPosition = useCallback((): void => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const rootRect = scrollElement.getBoundingClientRect();
    const visibility: PdfPageVisibility[] = [];

    for (const element of scrollElement.querySelectorAll<HTMLElement>('.pdf-rendered-page')) {
      const pageNumber = Number(element.dataset.pageNumber);
      if (!Number.isInteger(pageNumber)) continue;
      const rect = element.getBoundingClientRect();
      const visibleWidth = Math.max(
        0,
        Math.min(rect.right, rootRect.right) - Math.max(rect.left, rootRect.left),
      );
      const visibleHeight = Math.max(
        0,
        Math.min(rect.bottom, rootRect.bottom) - Math.max(rect.top, rootRect.top),
      );
      visibility.push({
        pageNumber,
        visibleArea: visibleWidth * visibleHeight,
        topDistance: Math.abs(rect.top - rootRect.top),
      });
    }

    const currentPage = selectMostVisiblePdfPage(visibility, positionRef.current.currentPage);
    const nextPosition = { currentPage, scrollTop: scrollElement.scrollTop };
    positionRef.current = nextPosition;
    onPositionChange(result.variant, nextPosition);
    onStatusChange(result.variant, { currentPage, pageCount: pageLayouts.length });
  }, [onPositionChange, onStatusChange, pageLayouts.length, result.variant]);

  const schedulePositionReport = useCallback((): void => {
    if (scrollFrameRef.current !== null) return;
    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      reportPosition();
    });
  }, [reportPosition]);

  const jumpToPage = useCallback(
    (pageNumber: number, behavior: ScrollBehavior = 'smooth'): void => {
      const scrollElement = scrollRef.current;
      const pageElement = scrollElement?.querySelector<HTMLElement>(
        `.pdf-rendered-page[data-page-number="${pageNumber}"]`,
      );
      if (!scrollElement || !pageElement) return;

      const rootRect = scrollElement.getBoundingClientRect();
      const pageRect = pageElement.getBoundingClientRect();
      const targetTop = Math.max(0, scrollElement.scrollTop + pageRect.top - rootRect.top - 8);
      const nextPosition = { currentPage: pageNumber, scrollTop: targetTop };
      positionRef.current = nextPosition;
      onPositionChange(result.variant, nextPosition);
      onStatusChange(result.variant, { currentPage: pageNumber, pageCount: pageLayouts.length });
      onActivate(result.variant);
      scrollElement.scrollTo({ top: targetTop, behavior });
    },
    [onActivate, onPositionChange, onStatusChange, pageLayouts.length, result.variant],
  );

  useEffect(() => {
    const controller = { jumpToPage };
    onControllerChange(result.variant, controller);
    return () => onControllerChange(result.variant, null);
  }, [jumpToPage, onControllerChange, result.variant]);

  useEffect(() => {
    const container = pagesContainerRef.current;
    if (!container) return;

    let resizeTimeout: number | null = null;
    const updateContainerWidth = () => {
      const nextWidth = container.clientWidth;
      setContainerWidth((current) => (current === nextWidth ? current : nextWidth));
    };
    const scheduleUpdate = () => {
      if (resizeTimeout !== null) window.clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        resizeTimeout = null;
        updateContainerWidth();
      }, 100);
    };
    const observer = new ResizeObserver(scheduleUpdate);

    updateContainerWidth();
    observer.observe(container);
    return () => {
      observer.disconnect();
      if (resizeTimeout !== null) window.clearTimeout(resizeTimeout);
    };
  }, [result.pdfDataBase64]);

  useEffect(() => {
    const previousWidth = previousContainerWidthRef.current;
    previousContainerWidthRef.current = containerWidth;
    if (previousWidth <= 0 || containerWidth <= 0 || previousWidth === containerWidth) return;

    const pageNumber = positionRef.current.currentPage;
    const frame = window.requestAnimationFrame(() => {
      const scrollElement = scrollRef.current;
      const pageElement = scrollElement?.querySelector<HTMLElement>(
        `.pdf-rendered-page[data-page-number="${pageNumber}"]`,
      );
      if (!scrollElement || !pageElement) return;

      const rootRect = scrollElement.getBoundingClientRect();
      const pageRect = pageElement.getBoundingClientRect();
      const targetTop = Math.max(0, scrollElement.scrollTop + pageRect.top - rootRect.top - 8);
      const nextPosition = { currentPage: pageNumber, scrollTop: targetTop };
      scrollElement.scrollTop = targetTop;
      positionRef.current = nextPosition;
      onPositionChange(result.variant, nextPosition);
      onStatusChange(result.variant, { currentPage: pageNumber, pageCount: pageLayouts.length });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [containerWidth, onPositionChange, onStatusChange, pageLayouts.length, result.variant]);

  useEffect(() => {
    if (!result.pdfDataBase64) return;

    let canceled = false;
    let loadingTask: ReturnType<typeof getDocument> | null = null;
    const resetFrame = window.requestAnimationFrame(() => {
      if (canceled) return;
      setPdfDocument(null);
      setPageLayouts([]);
      setRenderState('loading');
      setRenderError(null);
      textLayerWarningRef.current = null;
      onRenderErrorChange(result.variant, null);
      onTextLayerWarningChange(result.variant, null);
    });

    const loadPdf = async () => {
      loadingTask = getDocument({
        data: base64ToUint8Array(result.pdfDataBase64 ?? ''),
        cMapPacked: true,
        cMapUrl: pdfjsAssetUrl('cmaps'),
        standardFontDataUrl: pdfjsAssetUrl('standard_fonts'),
        wasmUrl: pdfjsAssetUrl('wasm'),
      });
      const nextDocument = await waitForPdfLoad(loadingTask.promise, {
        onTimeout: () => {
          const stalledTask = loadingTask;
          loadingTask = null;
          void stalledTask?.destroy();
        },
      });
      const nextLayouts: PdfPageLayout[] = [];

      for (let pageNumber = 1; pageNumber <= nextDocument.numPages; pageNumber += 1) {
        const page = await nextDocument.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1 });
        nextLayouts.push({ pageNumber, width: viewport.width, height: viewport.height });
      }

      if (canceled) return;
      window.cancelAnimationFrame(resetFrame);
      setRenderError(null);
      textLayerWarningRef.current = null;
      onRenderErrorChange(result.variant, null);
      onTextLayerWarningChange(result.variant, null);
      setPdfDocument(nextDocument);
      setPageLayouts(nextLayouts);
      setRenderState('ready');
      onStatusChange(result.variant, {
        currentPage: Math.max(1, Math.min(mountInitialPosition.currentPage, nextLayouts.length)),
        pageCount: nextLayouts.length,
      });
    };

    void loadPdf().catch((error: unknown) => {
      if (canceled) return;
      window.cancelAnimationFrame(resetFrame);
      const message = error instanceof Error ? error.message : String(error);
      setPdfDocument(null);
      setPageLayouts([]);
      setRenderState('error');
      setRenderError(message);
      onRenderErrorChange(result.variant, message);
    });

    return () => {
      canceled = true;
      window.cancelAnimationFrame(resetFrame);
      void loadingTask?.destroy();
    };
  }, [
    onRenderErrorChange,
    onStatusChange,
    onTextLayerWarningChange,
    mountInitialPosition.currentPage,
    renderAttempt,
    result.pdfDataBase64,
    result.variant,
  ]);

  useEffect(() => {
    if (!pdfDocument || pageLayouts.length === 0) return;

    let secondFrame: number | null = null;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        if (scrollFrameRef.current === secondFrame) scrollFrameRef.current = null;
        const scrollElement = scrollRef.current;
        if (!scrollElement) return;
        const pageElement = scrollElement.querySelector<HTMLElement>(
          `.pdf-rendered-page[data-page-number="${mountInitialPosition.currentPage}"]`,
        );
        const rootRect = scrollElement.getBoundingClientRect();
        const pageTop = pageElement
          ? Math.max(
              0,
              scrollElement.scrollTop + pageElement.getBoundingClientRect().top - rootRect.top - 8,
            )
          : mountInitialPosition.scrollTop;
        const restoredPosition = {
          currentPage: mountInitialPosition.currentPage,
          scrollTop:
            mountInitialPosition.currentPage > 1 ? pageTop : mountInitialPosition.scrollTop,
        };
        scrollElement.scrollTop = restoredPosition.scrollTop;
        positionRef.current = restoredPosition;
        reportPosition();
      });
      scrollFrameRef.current = secondFrame;
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame !== null) {
        window.cancelAnimationFrame(secondFrame);
        if (scrollFrameRef.current === secondFrame) scrollFrameRef.current = null;
      }
    };
  }, [mountInitialPosition, pageLayouts.length, pdfDocument, reportPosition, result.pdfDataBase64]);

  useEffect(
    () => () => {
      if (scrollFrameRef.current !== null) window.cancelAnimationFrame(scrollFrameRef.current);
    },
    [],
  );

  const handlePageRenderError = useCallback(
    (error: unknown): void => {
      const message = error instanceof Error ? error.message : String(error);
      setRenderState('error');
      setRenderError(message);
      onRenderErrorChange(result.variant, message);
    },
    [onRenderErrorChange, result.variant],
  );

  const handleTextLayerWarning = useCallback(
    (error: unknown): void => {
      if (textLayerWarningRef.current) return;
      const message = error instanceof Error ? error.message : String(error);
      textLayerWarningRef.current = message;
      onTextLayerWarningChange(result.variant, message);
    },
    [onTextLayerWarningChange, result.variant],
  );

  return (
    <div
      className="pdf-reader"
      data-variant={result.variant}
      onPointerDownCapture={() => onActivate(result.variant)}
      onWheelCapture={() => onActivate(result.variant)}
      onFocusCapture={() => onActivate(result.variant)}
    >
      <div
        ref={scrollRef}
        className="pdf-reader-scroll"
        onScroll={schedulePositionReport}
        aria-label={`${formatPdfVariant(result.variant)} PDF 阅读区`}
      >
        {renderState === 'loading' ? (
          <div className="pdf-render-status" aria-live="polite">
            <LoaderCircle className="pdf-export-spinner" aria-hidden="true" size={15} />
            正在准备 PDF 页面…
          </div>
        ) : null}
        {renderState === 'error' ? (
          <div className="pdf-render-error" role="alert">
            <TriangleAlert aria-hidden="true" size={16} />
            <div>
              <strong>应用内预览失败</strong>
              <span>PDF 已成功生成，可重试渲染或在 Finder 中打开。</span>
              {renderError ? <small>{renderError}</small> : null}
            </div>
            <div className="pdf-render-error-actions">
              <button
                type="button"
                className="mini-button"
                onClick={() => setRenderAttempt((current) => current + 1)}
              >
                <RefreshCw aria-hidden="true" size={14} /> 重试渲染
              </button>
              {result.pdfPath ? (
                <button type="button" className="mini-button" onClick={() => onReveal(result)}>
                  <FolderSearch aria-hidden="true" size={14} /> Finder
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
        <div ref={pagesContainerRef} className="pdf-canvas-pages" aria-label="PDF 预览">
          {pdfDocument
            ? pageLayouts.map((pageLayout, index) => (
                <LazyPdfPage
                  key={`${result.variant}-${pageLayout.pageNumber}`}
                  pdfDocument={pdfDocument}
                  pageLayout={pageLayout}
                  pageCount={pageLayouts.length}
                  containerWidth={containerWidth}
                  renderAttempt={renderAttempt}
                  renderImmediately={index < 2}
                  onRenderError={handlePageRenderError}
                  onTextLayerWarning={handleTextLayerWarning}
                />
              ))
            : null}
        </div>
      </div>
    </div>
  );
}

function LazyPdfPage({
  pdfDocument,
  pageLayout,
  pageCount,
  containerWidth,
  renderAttempt,
  renderImmediately,
  onRenderError,
  onTextLayerWarning,
}: {
  pdfDocument: PDFDocumentProxy;
  pageLayout: PdfPageLayout;
  pageCount: number;
  containerWidth: number;
  renderAttempt: number;
  renderImmediately: boolean;
  onRenderError(error: unknown): void;
  onTextLayerWarning(error: unknown): void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(renderImmediately);
  const [pageState, setPageState] = useState<'waiting' | 'rendering' | 'ready'>('waiting');
  const cssWidth = containerWidth > 0 ? calculatePdfFitWidth(containerWidth) : 0;

  const localRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (shouldRender || renderImmediately) return;
    const element = localRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      const frame = window.requestAnimationFrame(() => setShouldRender(true));
      return () => window.cancelAnimationFrame(frame);
    }

    const scrollRoot = element.closest('.pdf-reader-scroll');
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { root: scrollRoot, rootMargin: '900px 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [renderImmediately, shouldRender]);

  useEffect(() => {
    if (!shouldRender || cssWidth <= 0) return;

    let canceled = false;
    let renderTask: RenderTask | null = null;
    let textLayer: TextLayer | null = null;
    let textContainer: HTMLDivElement | null = null;

    const renderPage = async () => {
      const page = await pdfDocument.getPage(pageLayout.pageNumber);
      if (canceled) return;
      setPageState('rendering');

      const baseViewport = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: cssWidth / baseViewport.width });
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      textContainer = textLayerRef.current;
      if (!canvas || !context || !textContainer) {
        throw new Error('无法创建 PDF 页面渲染上下文。');
      }

      const outputScale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      context.setTransform(outputScale, 0, 0, outputScale, 0, 0);
      renderTask = page.render({ canvas, canvasContext: context, viewport });
      await renderTask.promise;
      if (canceled) return;

      textContainer?.replaceChildren();
      try {
        const textContent = await page.getTextContent();
        if (canceled) return;
        textLayer = new TextLayer({
          textContentSource: textContent,
          container: textContainer,
          viewport,
        });
        await textLayer.render();
      } catch (error: unknown) {
        if (!canceled) onTextLayerWarning(error);
      }

      if (!canceled) setPageState('ready');
    };

    void renderPage().catch((error: unknown) => {
      if (canceled || (error instanceof Error && error.name === 'RenderingCancelledException')) {
        return;
      }
      setPageState('waiting');
      onRenderError(error);
    });

    return () => {
      canceled = true;
      renderTask?.cancel();
      textLayer?.cancel();
      textContainer?.replaceChildren();
    };
  }, [
    cssWidth,
    onRenderError,
    onTextLayerWarning,
    pageLayout.pageNumber,
    pdfDocument,
    renderAttempt,
    shouldRender,
  ]);

  const pageSurfaceStyle = {
    width: cssWidth > 0 ? `${cssWidth}px` : '100%',
    aspectRatio: `${pageLayout.width} / ${pageLayout.height}`,
    '--scale-factor': cssWidth > 0 ? String(cssWidth / pageLayout.width) : '1',
    '--user-unit': '1',
    '--total-scale-factor': 'calc(var(--scale-factor) * var(--user-unit))',
    '--scale-round-x': '1px',
    '--scale-round-y': '1px',
  } as CSSProperties;

  return (
    <div ref={localRef} className="pdf-rendered-page" data-page-number={pageLayout.pageNumber}>
      <div className="pdf-page-label">
        第 {pageLayout.pageNumber} 页 / 共 {pageCount} 页
      </div>
      <div className={`pdf-page-surface pdf-page-${pageState}`} style={pageSurfaceStyle}>
        <canvas ref={canvasRef} aria-label={`PDF 第 ${pageLayout.pageNumber} 页`} />
        <div ref={textLayerRef} className="pdf-text-layer textLayer" aria-hidden="true" />
        {pageState !== 'ready' ? (
          <span className="pdf-page-loading">
            {pageState === 'rendering' ? '正在渲染…' : '滚动到此页时渲染'}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function pdfjsAssetUrl(directory: 'cmaps' | 'standard_fonts' | 'wasm'): string {
  if (window.location.protocol === 'file:' && window.location.href.includes('/app.asar/')) {
    return new URL(`../../../pdfjs/${directory}/`, window.location.href).toString();
  }
  return new URL(`./pdfjs/${directory}/`, window.location.href).toString();
}

function base64ToUint8Array(value: string): Uint8Array {
  const binary = window.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function formatPdfVariant(variant: PdfExportVariant): string {
  return variant === 'student' ? '学生版' : '教师版';
}
