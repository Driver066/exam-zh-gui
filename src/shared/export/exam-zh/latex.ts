import type { ExamZhOptionBag, ExamZhOptionValue } from '../../document/model';

export function escapeLatexText(text: string): string {
  return text.replace(/[\\{}#$%&_~^]/g, (character) => {
    switch (character) {
      case '\\':
        return '\\textbackslash{}';
      case '{':
        return '\\{';
      case '}':
        return '\\}';
      case '#':
        return '\\#';
      case '$':
        return '\\$';
      case '%':
        return '\\%';
      case '&':
        return '\\&';
      case '_':
        return '\\_';
      case '~':
        return '\\textasciitilde{}';
      case '^':
        return '\\textasciicircum{}';
      default:
        return character;
    }
  });
}

export function escapeLatexComment(text: string): string {
  return text.replace(/\r?\n/g, ' ').trim();
}

export function formatOptionalArgument(options: ExamZhOptionBag): string {
  return formatOptionBag(options, { multiline: false });
}

export function formatDisplayOptionBag(options: ExamZhOptionBag): string {
  return formatOptionBag(options, { multiline: true, indentLevel: 1 });
}

export function formatDocumentClassOptions(options: ExamZhOptionBag): string {
  const body = formatOptionBag(options, { multiline: false, compact: true });
  return body ? `[${body}]` : '';
}

export function mergeOptionBags(
  primary: ExamZhOptionBag | undefined,
  secondary: ExamZhOptionBag | undefined,
): ExamZhOptionBag {
  return mergeDefinedOptions(primary ?? {}, secondary ?? {});
}

export function isEmptyOptionBag(options: ExamZhOptionBag | undefined): boolean {
  return !options || Object.keys(options).length === 0;
}

function mergeDefinedOptions(
  primary: ExamZhOptionBag,
  secondary: ExamZhOptionBag,
): ExamZhOptionBag {
  const merged: ExamZhOptionBag = { ...primary };

  for (const [key, value] of Object.entries(secondary)) {
    const existing = merged[key];

    if (isOptionBag(existing) && isOptionBag(value)) {
      merged[key] = mergeDefinedOptions(existing, value);
    } else {
      merged[key] = value;
    }
  }

  return merged;
}

function formatOptionBag(
  options: ExamZhOptionBag,
  settings: {
    multiline: boolean;
    compact?: boolean;
    indentLevel?: number;
  },
): string {
  const entries = Object.entries(options).sort(([left], [right]) => left.localeCompare(right));

  if (entries.length === 0) {
    return '';
  }

  if (!settings.multiline) {
    return entries
      .map(([key, value]) => `${key}${settings.compact ? '=' : ' = '}${formatOptionValue(value)}`)
      .join(', ');
  }

  const indentLevel = settings.indentLevel ?? 0;
  const indent = '  '.repeat(indentLevel);

  return entries
    .map(([key, value]) => `${indent}${key} = ${formatOptionValue(value, indentLevel)},`)
    .join('\n');
}

function formatOptionValue(value: ExamZhOptionValue, indentLevel = 0): string {
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'string') {
    return shouldWrapOptionString(value) ? `{${value}}` : value;
  }

  if (Array.isArray(value)) {
    return `{ ${value.map((item) => formatOptionValue(item, indentLevel)).join(', ')} }`;
  }

  const inner = formatOptionBag(value, { multiline: true, indentLevel: indentLevel + 1 });
  const closingIndent = '  '.repeat(indentLevel);
  return `{\n${inner}\n${closingIndent}}`;
}

function shouldWrapOptionString(value: string): boolean {
  return value.length === 0 || /[,;\n{}]/.test(value);
}

function isOptionBag(value: ExamZhOptionValue | undefined): value is ExamZhOptionBag {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
