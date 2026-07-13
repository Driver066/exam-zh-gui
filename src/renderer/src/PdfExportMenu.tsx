import {
  CheckCircle2,
  ChevronDown,
  Eye,
  FileDown,
  FolderSearch,
  LoaderCircle,
  RefreshCw,
  TriangleAlert,
  XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

import type { ExportPdfArtifactResult, PdfExportVariant } from '../../shared/ipc/contracts';
import { TooltipAnchor } from './TooltipAnchor';
import {
  getPdfExportItemPresentation,
  isPdfExportSessionBusy,
  isPdfExportSessionFinal,
  type PdfExportItemTone,
  type PdfExportSessionView,
} from './right-workbench';

interface PdfExportMenuProps {
  disabled: boolean;
  compact: boolean;
  defaultVariant: PdfExportVariant;
  compilerSummary: string;
  session: PdfExportSessionView | null;
  selectedVariant?: PdfExportVariant;
  onExport(variants: PdfExportVariant[]): void;
  onPreview(result: ExportPdfArtifactResult): void;
  onInspect(result: ExportPdfArtifactResult): void;
  onReveal(result: ExportPdfArtifactResult): void;
  onRetry(variant: PdfExportVariant): void;
  onClearSession(): void;
}

const exportChoices: Array<{
  variants: PdfExportVariant[];
  label: string;
  description: string;
}> = [
  { variants: ['student'], label: '学生版', description: '不包含答案、解析和评分点' },
  { variants: ['teacher'], label: '教师版', description: '包含答案、解析和评分点' },
  {
    variants: ['student', 'teacher'],
    label: '学生版 + 教师版',
    description: '选择一次文件夹，依次生成两份',
  },
];

export function PdfExportMenu({
  disabled,
  compact,
  defaultVariant,
  compilerSummary,
  session,
  selectedVariant,
  onExport,
  onPreview,
  onInspect,
  onReveal,
  onRetry,
  onClearSession,
}: PdfExportMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const choiceRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const busy = isPdfExportSessionBusy(session);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  function openMenu(): void {
    setOpen(true);
    if (!session) window.requestAnimationFrame(() => choiceRefs.current[0]?.focus());
  }

  function closeMenu(): void {
    setOpen(false);
    toggleRef.current?.focus();
  }

  function handleChoiceKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (session) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
      }
      return;
    }
    const current = choiceRefs.current.indexOf(document.activeElement as HTMLButtonElement);
    let next = current;
    if (event.key === 'ArrowDown')
      next = (current + 1 + exportChoices.length) % exportChoices.length;
    else if (event.key === 'ArrowUp')
      next = (current - 1 + exportChoices.length) % exportChoices.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = exportChoices.length - 1;
    else if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      return;
    } else return;
    event.preventDefault();
    choiceRefs.current[next]?.focus();
  }

  return (
    <div ref={rootRef} className="pdf-export-split">
      <TooltipAnchor text="生成 PDF" className="toolbar-tooltip-anchor" disabled={!compact}>
        <button
          type="button"
          className="tool-button tool-button-primary pdf-export-main"
          aria-label={`生成${variantLabel(defaultVariant)} PDF`}
          disabled={disabled || busy}
          onClick={() => onExport([defaultVariant])}
        >
          {busy ? (
            <LoaderCircle className="pdf-export-spinner" aria-hidden="true" size={17} />
          ) : (
            <FileDown aria-hidden="true" size={17} />
          )}
          <span>{busy ? '生成中' : '生成 PDF'}</span>
        </button>
      </TooltipAnchor>
      <TooltipAnchor text="选择 PDF 版本" className="toolbar-tooltip-anchor">
        <button
          ref={toggleRef}
          type="button"
          className="tool-button tool-button-primary pdf-export-toggle"
          aria-label="选择 PDF 版本或查看导出结果"
          aria-expanded={open}
          aria-haspopup="menu"
          disabled={disabled && !session}
          onClick={() => (open ? closeMenu() : openMenu())}
        >
          <ChevronDown aria-hidden="true" size={15} />
        </button>
      </TooltipAnchor>

      {open ? (
        <div
          className="pdf-export-popover"
          role={session ? 'dialog' : 'menu'}
          aria-label={session ? 'PDF 导出结果' : '选择 PDF 导出版本'}
          onKeyDown={handleChoiceKeyDown}
        >
          {session ? (
            <PdfExportResults
              session={session}
              selectedVariant={selectedVariant}
              onPreview={onPreview}
              onInspect={onInspect}
              onReveal={onReveal}
              onRetry={onRetry}
              onClearSession={onClearSession}
            />
          ) : (
            <>
              <div className="pdf-export-popover-title">生成 PDF</div>
              <div className="pdf-export-choice-list">
                {exportChoices.map((choice, index) => (
                  <button
                    key={choice.variants.join('-')}
                    ref={(element) => {
                      choiceRefs.current[index] = element;
                    }}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      onExport(choice.variants);
                    }}
                  >
                    <strong>{choice.label}</strong>
                    <span>{choice.description}</span>
                  </button>
                ))}
              </div>
              <div className="pdf-export-compiler-summary">当前编译器：{compilerSummary}</div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function PdfExportResults({
  session,
  selectedVariant,
  onPreview,
  onInspect,
  onReveal,
  onRetry,
  onClearSession,
}: {
  session: PdfExportSessionView;
  selectedVariant?: PdfExportVariant;
  onPreview(result: ExportPdfArtifactResult): void;
  onInspect(result: ExportPdfArtifactResult): void;
  onReveal(result: ExportPdfArtifactResult): void;
  onRetry(variant: PdfExportVariant): void;
  onClearSession(): void;
}) {
  const completed = session.items.filter((item) => item.phase === 'complete').length;
  const final = isPdfExportSessionFinal(session);
  return (
    <div className="pdf-export-results" aria-live="polite">
      <div className="pdf-export-results-heading">
        <strong>{final ? '导出结果' : '正在生成 PDF'}</strong>
        <span>
          {completed} / {session.items.length}
        </span>
      </div>
      {session.items.map((item) => {
        const presentation = getPdfExportItemPresentation(item);
        return (
          <div
            key={item.variant}
            className={`pdf-export-result-row ${
              selectedVariant === item.variant ? 'pdf-export-result-selected' : ''
            }`}
          >
            <span className="pdf-export-result-icon">{renderStatusIcon(presentation.tone)}</span>
            <div className="pdf-export-result-copy">
              <strong>{variantLabel(item.variant)}</strong>
              <span>{presentation.label}</span>
              {item.result ? (
                <div className="pdf-export-result-actions">
                  {item.result.success ? (
                    <>
                      <button type="button" onClick={() => onPreview(item.result!)}>
                        <Eye aria-hidden="true" size={13} /> 预览
                      </button>
                      <button type="button" onClick={() => onReveal(item.result!)}>
                        <FolderSearch aria-hidden="true" size={13} /> Finder
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => onInspect(item.result!)}>
                        <Eye aria-hidden="true" size={13} /> 查看日志
                      </button>
                      <button type="button" onClick={() => onRetry(item.variant)}>
                        <RefreshCw aria-hidden="true" size={13} /> 重试
                      </button>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
      {final ? (
        <button type="button" className="pdf-export-new-button" onClick={onClearSession}>
          新的导出
        </button>
      ) : null}
    </div>
  );
}

function renderStatusIcon(tone: PdfExportItemTone) {
  if (tone === 'pending') {
    return <LoaderCircle className="pdf-export-spinner" aria-hidden="true" size={17} />;
  }
  if (tone === 'error') return <XCircle aria-hidden="true" size={17} />;
  return tone === 'warning' ? (
    <TriangleAlert aria-hidden="true" size={17} />
  ) : (
    <CheckCircle2 aria-hidden="true" size={17} />
  );
}

function variantLabel(variant: PdfExportVariant): string {
  return variant === 'teacher' ? '教师版' : '学生版';
}
