import type { PageSetup } from './model';

export const DEFAULT_PAGE_FOOTER_TEMPLATE = '{{科目}}试题第{{页码}}页（共 {{总页数}} 页）';

export const PAGE_OPTION_KEYS = [
  'size',
  'show-foot',
  'foot-type',
  'foot-content',
  'show-columnline',
  'columnline-width',
  'show-head',
  'head-content',
  'show-chapter',
] as const;

const FOOTER_PLACEHOLDERS = new Set(['科目', '页码', '总页数']);
const PLACEHOLDER_PATTERN = /\{\{([^{}]+)\}\}/gu;

export interface FooterTemplateValidationResult {
  valid: boolean;
  message?: string;
}

export function validateFooterTemplate(template: string): FooterTemplateValidationResult {
  if (template.trim().length === 0) {
    return { valid: false, message: '页脚模板不能为空。' };
  }

  if (template.length > 200) {
    return { valid: false, message: '页脚模板不能超过 200 个字符。' };
  }

  if (template.includes(';')) {
    return { valid: false, message: '页脚模板不能包含分号。' };
  }

  const counts = new Map<string, number>();
  for (const match of template.matchAll(PLACEHOLDER_PATTERN)) {
    const placeholder = match[1]!;

    if (!FOOTER_PLACEHOLDERS.has(placeholder)) {
      return { valid: false, message: `不支持页脚占位符 {{${placeholder}}}。` };
    }

    counts.set(placeholder, (counts.get(placeholder) ?? 0) + 1);
  }

  for (const placeholder of FOOTER_PLACEHOLDERS) {
    if ((counts.get(placeholder) ?? 0) > 1) {
      return { valid: false, message: `页脚占位符 {{${placeholder}}} 只能出现一次。` };
    }
  }

  const pageIndex = template.indexOf('{{页码}}');
  const lastPageIndex = template.indexOf('{{总页数}}');

  if (lastPageIndex !== -1 && (pageIndex === -1 || lastPageIndex < pageIndex)) {
    return { valid: false, message: '{{总页数}} 必须出现在 {{页码}} 之后。' };
  }

  return { valid: true };
}

export function compileFooterTemplate(
  template: string,
  subject: string,
  escapeText: (value: string) => string = (value) => value,
): string {
  const validation = validateFooterTemplate(template);

  if (!validation.valid) {
    throw new Error(validation.message);
  }

  let output = '';
  let cursor = 0;

  for (const match of template.matchAll(PLACEHOLDER_PATTERN)) {
    const index = match.index;
    const placeholder = match[1]!;
    output += escapeText(template.slice(cursor, index));

    if (placeholder === '科目') {
      output += escapeText(subject.trim());
    } else {
      output += ';';
    }

    cursor = index + match[0].length;
  }

  output += escapeText(template.slice(cursor));
  return output;
}

export function buildPageFooterContent(
  page: PageSetup | undefined,
  subject: string,
  escapeText: (value: string) => string = (value) => value,
): string | undefined {
  if (page?.showFooter === false) {
    return undefined;
  }

  switch (page?.footerMode ?? 'subject') {
    case 'pageOnly':
      return '第;页（共~;页）';
    case 'custom':
      return compileFooterTemplate(page?.footerTemplate ?? '', subject, escapeText);
    case 'subject': {
      const subjectPrefix =
        subject.trim().length > 0 ? `${escapeText(subject.trim())}试题第` : '试题第';
      return `${subjectPrefix};页（共~;页）`;
    }
  }
}
