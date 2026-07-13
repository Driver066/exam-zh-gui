import { useEffect, useState } from 'react';

import { createRetryablePromiseCache } from '../../../shared/math/retryable-promise-cache';

interface MathPreviewProps {
  latex: string;
  display: boolean;
  fallbackLabel?: string;
}

type PreviewState =
  | { key: string; status: 'loading' }
  | { key: string; status: 'ready'; html: string }
  | { key: string; status: 'error'; message: string };

const renderCache = createRetryablePromiseCache<string, string>();

export function MathPreview({ latex, display, fallbackLabel }: MathPreviewProps) {
  const currentKey = createPreviewKey(latex, display);
  const [preview, setPreview] = useState<PreviewState>({
    key: currentKey,
    status: 'loading',
  });
  const [retryVersion, setRetryVersion] = useState(0);

  useEffect(() => {
    let canceled = false;

    void renderMathPreview(currentKey, latex, display)
      .then((html) => {
        if (!canceled) {
          setPreview({ key: currentKey, status: 'ready', html });
        }
      })
      .catch((error: unknown) => {
        if (!canceled) {
          const message = error instanceof Error ? error.message : String(error);
          setPreview({ key: currentKey, status: 'error', message });
        }
      });

    return () => {
      canceled = true;
    };
  }, [currentKey, display, latex, retryVersion]);

  const className = display ? 'preview-display-math' : 'preview-inline-math';

  if (preview.key === currentKey && preview.status === 'ready') {
    const Element = display ? 'div' : 'span';
    return <Element className={className} dangerouslySetInnerHTML={{ __html: preview.html }} />;
  }

  if (preview.key === currentKey && preview.status === 'error') {
    if (fallbackLabel) {
      return (
        <span className={`${className} math-preview-fallback`} aria-label={preview.message}>
          {fallbackLabel}
        </span>
      );
    }

    return (
      <span className={`${className} math-preview-fallback`} aria-label={preview.message}>
        {formatMathSource(latex, display)}
        <span className="math-preview-error">公式预览失败</span>
        <button
          type="button"
          className="math-preview-retry"
          onClick={() => {
            renderCache.delete(currentKey);
            setPreview({ key: currentKey, status: 'loading' });
            setRetryVersion((version) => version + 1);
          }}
        >
          重试
        </button>
      </span>
    );
  }

  return (
    <span className={`${className} math-preview-loading`}>
      {fallbackLabel ?? formatMathSource(latex, display)}
    </span>
  );
}

function formatMathSource(latex: string, display: boolean): string {
  return display ? `$$${latex}$$` : `$${latex}$`;
}

function createPreviewKey(latex: string, display: boolean): string {
  return `${display ? 'display' : 'inline'}:${latex}`;
}

async function renderMathPreview(key: string, latex: string, display: boolean): Promise<string> {
  return renderCache.get(key, () =>
    window.examZhGui.math.render(latex, display).then((result) => {
      if (!result.ok) {
        throw new Error(result.error.message);
      }

      return result.data.svg;
    }),
  );
}
