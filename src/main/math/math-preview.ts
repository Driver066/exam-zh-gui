import MathJax from 'mathjax';

import {
  createMathJaxPreviewConfig,
  normalizeExamZhPreviewLatex,
} from '../../shared/math/mathjax-config';
import { createRetryablePromiseCache } from '../../shared/math/retryable-promise-cache';

interface MathJaxNodeRuntime {
  tex2svgPromise(latex: string, options: { display: boolean }): Promise<unknown>;
  startup: {
    adaptor: {
      outerHTML(node: unknown): string;
    };
  };
}

const runtimeCache = createRetryablePromiseCache<'runtime', MathJaxNodeRuntime>();

export async function renderMathPreviewToSvg(latex: string, display: boolean): Promise<string> {
  const runtime = await getMathJaxRuntime();
  const node = await runtime.tex2svgPromise(normalizeExamZhPreviewLatex(latex), { display });

  return runtime.startup.adaptor.outerHTML(node);
}

async function getMathJaxRuntime(): Promise<MathJaxNodeRuntime> {
  return runtimeCache.get('runtime', () =>
    MathJax.init(createMathJaxPreviewConfig()).then(assertMathJaxRuntime),
  );
}

function assertMathJaxRuntime(runtime: unknown): MathJaxNodeRuntime {
  if (!isMathJaxRuntime(runtime)) {
    throw new Error('MathJax 预览运行时没有正确初始化。');
  }

  return runtime;
}

function isMathJaxRuntime(runtime: unknown): runtime is MathJaxNodeRuntime {
  if (!runtime || typeof runtime !== 'object') {
    return false;
  }

  const candidate = runtime as Partial<MathJaxNodeRuntime>;

  return (
    typeof candidate.tex2svgPromise === 'function' &&
    typeof candidate.startup?.adaptor?.outerHTML === 'function'
  );
}
