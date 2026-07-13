import type {
  InlineContent,
  InlineRichText,
  RichContentBlock,
  ScoreMark,
  SolutionAnnotation,
} from './model';
import { parseRichContentInput, stringifyRichContentBlocks } from './rich-content';

export type TeacherContentDiagnosticCode =
  | 'empty_score_command'
  | 'negative_score_command'
  | 'malformed_score_command'
  | 'advanced_score_command';

export interface TeacherContentDiagnostic {
  code: TeacherContentDiagnosticCode;
  message: string;
}

export interface TeacherContentConversionSummary {
  scoreMarks: number;
  annotations: number;
}

export interface ParseTeacherSolutionInput {
  input: string;
  solution?: RichContentBlock[];
  scoreMarks?: ScoreMark[];
  annotations?: SolutionAnnotation[];
  createId(prefix: string): string;
}

export interface ReconcileTeacherSolutionBlocksInput {
  blocks: RichContentBlock[];
  solution?: RichContentBlock[];
  scoreMarks?: ScoreMark[];
  annotations?: SolutionAnnotation[];
  createId(prefix: string): string;
}

export interface ParseTeacherSolutionResult {
  solution: RichContentBlock[];
  scoreMarks: ScoreMark[];
  annotations: SolutionAnnotation[];
  diagnostics: TeacherContentDiagnostic[];
  conversions: TeacherContentConversionSummary;
}

export type TeacherReference =
  { type: 'scoreRef'; scoreMarkId: string } | { type: 'annotationRef'; annotationId: string };

export interface InsertTeacherReferenceAtSelectionInput {
  solution?: RichContentBlock[];
  scoreMarks?: ScoreMark[];
  annotations?: SolutionAnnotation[];
  reference: TeacherReference;
  selection: { start: number; end: number };
  createId(prefix: string): string;
}

export interface InsertTeacherReferenceAtSelectionResult extends ParseTeacherSolutionResult {
  selectionStart: number;
  selectionEnd: number;
}

interface ParsedScoreToken {
  index: number;
  kind: 'score' | 'annotation';
  source: string;
  points?: number;
  content?: InlineRichText;
}

interface ExistingReference {
  kind: 'score' | 'annotation';
  id: string;
  payload: string;
  order: number;
}

const TOKEN_PREFIX = '\u0000examzh-score-token:';
const TOKEN_SUFFIX = '\u0000';
const REFERENCE_INSERTION_SENTINEL = '\u0000examzh-reference-insertion\u0000';

export function parseTeacherSolutionInput(
  options: ParseTeacherSolutionInput,
): ParseTeacherSolutionResult {
  const diagnostics: TeacherContentDiagnostic[] = [];
  const tokens: ParsedScoreToken[] = [];
  const tokenizedInput = tokenizeTeacherSolutionSource(options.input, tokens, diagnostics);
  const parsed = parseRichContentInput(tokenizedInput, { context: 'solution' });
  const tokenizedBlocks = transformTextContent(parsed.blocks, splitTokenSentinels);
  const result = reconcileTokenizedTeacherSolution(
    {
      blocks: tokenizedBlocks,
      solution: options.solution,
      scoreMarks: options.scoreMarks,
      annotations: options.annotations,
      createId: options.createId,
    },
    tokens,
    diagnostics,
  );

  return {
    ...result,
    diagnostics: [
      ...parsed.diagnostics.map((item) => ({
        code: 'malformed_score_command' as const,
        message: item.message,
      })),
      ...result.diagnostics,
    ],
  };
}

export function insertTeacherReferenceAtSelection(
  options: InsertTeacherReferenceAtSelectionInput,
): InsertTeacherReferenceAtSelectionResult {
  const source = stringifyRichContentBlocks(options.solution ?? [], [], {
    scoreMarks: options.scoreMarks,
    annotations: options.annotations,
  });
  const start = Math.max(0, Math.min(options.selection.start, source.length));
  const prefix = start > 0 && !/\s/u.test(source[start - 1] ?? '') ? ' ' : '';
  const input = `${source.slice(0, start)}${prefix}${REFERENCE_INSERTION_SENTINEL}${source.slice(start)}`;
  const parsed = parseTeacherSolutionInput({
    input,
    solution: options.solution,
    scoreMarks: options.scoreMarks,
    annotations: options.annotations,
    createId: options.createId,
  });
  const solution = transformTextContent(parsed.solution, (text) =>
    replaceReferenceInsertionSentinel(text, options.reference),
  );
  const scoreMarks = parsed.scoreMarks.map((item) =>
    options.reference.type === 'scoreRef' && item.id === options.reference.scoreMarkId
      ? { ...item, placement: 'inline' as const }
      : item,
  );
  const command = renderTeacherReferenceCommand(options.reference, scoreMarks, parsed.annotations);
  const cursor = start + prefix.length + command.length;

  return {
    ...parsed,
    solution,
    scoreMarks,
    selectionStart: cursor,
    selectionEnd: cursor,
  };
}

export function reconcileTeacherSolutionBlocks(
  options: ReconcileTeacherSolutionBlocksInput,
): ParseTeacherSolutionResult {
  const diagnostics: TeacherContentDiagnostic[] = [];
  const tokens: ParsedScoreToken[] = [];
  const tokenized = transformTextContent(options.blocks, (text) =>
    tokenizeScoreCommands(text, tokens, diagnostics),
  );

  return reconcileTokenizedTeacherSolution({ ...options, blocks: tokenized }, tokens, diagnostics);
}

function reconcileTokenizedTeacherSolution(
  options: ReconcileTeacherSolutionBlocksInput,
  tokens: ParsedScoreToken[],
  diagnostics: TeacherContentDiagnostic[],
): ParseTeacherSolutionResult {
  const tokenized = options.blocks;
  const scoreMarks = (options.scoreMarks ?? []).map(cloneScoreMark);
  const annotations = (options.annotations ?? []).map(cloneAnnotation);
  const existingRefs = collectExistingReferences(
    options.solution ?? [],
    options.scoreMarks ?? [],
    options.annotations ?? [],
  );
  const assignments = reconcileTokens(tokens, existingRefs);
  const conversions: TeacherContentConversionSummary = { scoreMarks: 0, annotations: 0 };
  const usedScoreIds = new Set(
    assignments.filter((item) => item?.kind === 'score').map((item) => item!.id),
  );
  const usedAnnotationIds = new Set(
    assignments.filter((item) => item?.kind === 'annotation').map((item) => item!.id),
  );

  tokens.forEach((token, index) => {
    const existing = assignments[index];

    if (token.kind === 'score') {
      if (existing?.kind === 'score') {
        updateScoreMark(scoreMarks, existing.id, token.points ?? 0);
        return;
      }

      const reusable = scoreMarks.find(
        (item) =>
          !usedScoreIds.has(item.id) &&
          item.placement !== 'inline' &&
          item.points === (token.points ?? 0),
      );
      const id = reusable?.id ?? options.createId('score');

      if (reusable) {
        reusable.placement = 'inline';
        conversions.scoreMarks += 1;
      } else {
        scoreMarks.push({ id, points: token.points ?? 0, placement: 'inline' });
        conversions.scoreMarks += 1;
      }

      usedScoreIds.add(id);
      assignments[index] = { kind: 'score', id, payload: String(token.points ?? 0), order: index };
      return;
    }

    if (existing?.kind === 'annotation') {
      updateAnnotation(annotations, existing.id, token.content ?? []);
      return;
    }

    const payload = stringifyInlineRichText(token.content ?? []);
    const reusable = annotations.find(
      (item) =>
        !usedAnnotationIds.has(item.id) && stringifyInlineRichText(item.content) === payload,
    );
    const id = reusable?.id ?? options.createId('annotation');
    if (reusable) {
      reusable.content = token.content ?? [];
      conversions.annotations += 1;
    } else {
      annotations.push({ id, content: token.content ?? [] });
    }
    usedAnnotationIds.add(id);
    assignments[index] = {
      kind: 'annotation',
      id,
      payload,
      order: index,
    };
    if (!reusable) conversions.annotations += 1;
  });

  return {
    solution: replaceTokenSentinels(tokenized, assignments),
    scoreMarks,
    annotations,
    diagnostics,
    conversions,
  };
}

function tokenizeTeacherSolutionSource(
  input: string,
  tokens: ParsedScoreToken[],
  diagnostics: TeacherContentDiagnostic[],
): string {
  let output = '';
  let cursor = 0;

  while (cursor < input.length) {
    if (input[cursor] === '$' && input[cursor - 1] !== '\\') {
      const delimiter = input.startsWith('$$', cursor) ? '$$' : '$';
      const end = input.indexOf(delimiter, cursor + delimiter.length);
      if (end === -1) {
        output += input.slice(cursor);
        break;
      }
      output += input.slice(cursor, end + delimiter.length);
      cursor = end + delimiter.length;
      continue;
    }

    if (isScoreCommandStart(input, cursor)) {
      const parsed = readScoreCommand(input, cursor, tokens, diagnostics);
      output += parsed.value;
      cursor = parsed.end;
      continue;
    }

    output += input[cursor];
    cursor += 1;
  }

  return output;
}

function splitTokenSentinels(text: string): InlineContent[] {
  const content: InlineContent[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const start = text.indexOf(TOKEN_PREFIX, cursor);
    if (start === -1) {
      pushText(content, text.slice(cursor));
      break;
    }
    pushText(content, text.slice(cursor, start));
    const end = text.indexOf(TOKEN_SUFFIX, start + TOKEN_PREFIX.length);
    if (end === -1) {
      pushText(content, text.slice(start));
      break;
    }
    content.push({
      type: 'rawLatex',
      latex: text.slice(start, end + TOKEN_SUFFIX.length),
    });
    cursor = end + TOKEN_SUFFIX.length;
  }

  return content;
}

export function stringifyInlineRichText(content: InlineRichText | undefined): string {
  return (content ?? [])
    .map((item) => {
      if (item.type === 'text') return item.text;
      if (item.type === 'inlineMath') return `$${item.latex}$`;
      return item.latex;
    })
    .join('');
}

export function parseInlineRichText(input: string): InlineRichText {
  const parsed = parseRichContentInput(input);
  const content: InlineRichText = [];

  parsed.blocks.forEach((block, blockIndex) => {
    if (blockIndex > 0 && content.length > 0) content.push({ type: 'text', text: ' ' });

    if (block.type === 'paragraph') {
      block.children.forEach((child) => {
        if (child.type === 'text' || child.type === 'inlineMath' || child.type === 'rawLatex') {
          content.push({ ...child });
        }
      });
    } else if (block.type === 'displayMath') {
      content.push({ type: 'inlineMath', latex: block.latex });
    } else if (block.type === 'rawLatex') {
      content.push({ type: 'rawLatex', latex: block.latex });
    }
  });

  return content;
}

export function collectScoreReferenceIds(blocks: RichContentBlock[] | undefined): string[] {
  return collectReferenceIds(blocks, 'scoreRef');
}

export function collectAnnotationReferenceIds(blocks: RichContentBlock[] | undefined): string[] {
  return collectReferenceIds(blocks, 'annotationRef');
}

export function removeScoreReferences(
  blocks: RichContentBlock[] | undefined,
  scoreMarkId: string,
): RichContentBlock[] {
  return removeReferences(
    blocks ?? [],
    (item) => item.type === 'scoreRef' && item.scoreMarkId === scoreMarkId,
  );
}

export function removeAnnotationReferences(
  blocks: RichContentBlock[] | undefined,
  annotationId: string,
): RichContentBlock[] {
  return removeReferences(
    blocks ?? [],
    (item) => item.type === 'annotationRef' && item.annotationId === annotationId,
  );
}

export function appendScoreReference(
  blocks: RichContentBlock[] | undefined,
  scoreMarkId: string,
): RichContentBlock[] {
  return appendInlineReference(blocks, { type: 'scoreRef', scoreMarkId });
}

export function appendAnnotationReference(
  blocks: RichContentBlock[] | undefined,
  annotationId: string,
): RichContentBlock[] {
  return appendInlineReference(blocks, { type: 'annotationRef', annotationId });
}

export function moveScoreMarkToSummary(scoreMarks: ScoreMark[], scoreMarkId: string): ScoreMark[] {
  return scoreMarks.map((item) =>
    item.id === scoreMarkId ? { ...item, placement: undefined } : item,
  );
}

export function buildReferenceContextSummary(
  blocks: RichContentBlock[] | undefined,
  reference:
    { type: 'scoreRef'; scoreMarkId: string } | { type: 'annotationRef'; annotationId: string },
  radius = 18,
): string | null {
  const marker =
    reference.type === 'scoreRef'
      ? `\u0000score:${reference.scoreMarkId}\u0000`
      : `\u0000annotation:${reference.annotationId}\u0000`;
  const text = stringifyContextBlocks(blocks ?? [], reference, marker);
  const index = text.indexOf(marker);

  if (index === -1) return null;

  const before = text.slice(Math.max(0, index - radius), index).trimStart();
  const after = text.slice(index + marker.length, index + marker.length + radius).trimEnd();
  return `${before.length < index ? '…' : ''}${before}〔此处〕${after}${
    index + marker.length + after.length < text.length ? '…' : ''
  }`;
}

export function findTeacherReferenceTextRange(
  blocks: RichContentBlock[] | undefined,
  scoreMarks: ScoreMark[] | undefined,
  annotations: SolutionAnnotation[] | undefined,
  reference:
    { type: 'scoreRef'; scoreMarkId: string } | { type: 'annotationRef'; annotationId: string },
): { start: number; end: number } | null {
  const sentinel = '\u0000examzh-reference-location\u0000';
  const transformed = transformInlineContent(blocks ?? [], (item) => {
    if (
      (reference.type === 'scoreRef' &&
        item.type === 'scoreRef' &&
        item.scoreMarkId === reference.scoreMarkId) ||
      (reference.type === 'annotationRef' &&
        item.type === 'annotationRef' &&
        item.annotationId === reference.annotationId)
    ) {
      return [{ type: 'rawLatex', latex: sentinel }];
    }
    return [item];
  });
  const withSentinel = stringifyRichContentBlocks(transformed, [], { scoreMarks, annotations });
  const start = withSentinel.indexOf(sentinel);
  if (start === -1) return null;
  const actual =
    reference.type === 'scoreRef'
      ? `\\score{${scoreMarks?.find((item) => item.id === reference.scoreMarkId)?.points ?? ''}}`
      : `\\score{${stringifyInlineRichText(
          annotations?.find((item) => item.id === reference.annotationId)?.content,
        )}}`;
  return { start, end: start + actual.length };
}

function replaceReferenceInsertionSentinel(
  text: string,
  reference: TeacherReference,
): InlineContent[] {
  const content: InlineContent[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const start = text.indexOf(REFERENCE_INSERTION_SENTINEL, cursor);
    if (start === -1) {
      pushText(content, text.slice(cursor));
      break;
    }

    pushText(content, text.slice(cursor, start));
    content.push(
      reference.type === 'scoreRef'
        ? { type: 'scoreRef', scoreMarkId: reference.scoreMarkId }
        : { type: 'annotationRef', annotationId: reference.annotationId },
    );
    cursor = start + REFERENCE_INSERTION_SENTINEL.length;
  }

  return content;
}

function renderTeacherReferenceCommand(
  reference: TeacherReference,
  scoreMarks: ScoreMark[],
  annotations: SolutionAnnotation[],
): string {
  if (reference.type === 'scoreRef') {
    return `\\score{${scoreMarks.find((item) => item.id === reference.scoreMarkId)?.points ?? ''}}`;
  }

  return `\\score{${stringifyInlineRichText(
    annotations.find((item) => item.id === reference.annotationId)?.content,
  )}}`;
}

export function isScoreLevelOrderDescending(scoreMarks: ScoreMark[]): boolean {
  return scoreMarks.every(
    (item, index) => index === 0 || scoreMarks[index - 1]!.points >= item.points,
  );
}

export function sortScoreLevelsDescending(scoreMarks: ScoreMark[]): ScoreMark[] {
  return scoreMarks
    .map((item, index) => ({ item, index }))
    .sort((left, right) => right.item.points - left.item.points || left.index - right.index)
    .map(({ item }) => item);
}

function tokenizeScoreCommands(
  text: string,
  tokens: ParsedScoreToken[],
  diagnostics: TeacherContentDiagnostic[],
): InlineContent[] {
  const content: InlineContent[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const start = findNextScoreCommand(text, cursor);

    if (start === -1) {
      pushText(content, text.slice(cursor));
      break;
    }

    pushText(content, text.slice(cursor, start));
    const parsed = readScoreCommand(text, start, tokens, diagnostics);
    content.push({ type: 'rawLatex', latex: parsed.value });
    cursor = parsed.end;
  }

  return content;
}

function findNextScoreCommand(input: string, start: number): number {
  let index = input.indexOf('\\score', start);
  while (index !== -1 && !isScoreCommandStart(input, index)) {
    index = input.indexOf('\\score', index + '\\score'.length);
  }
  return index;
}

function isScoreCommandStart(input: string, start: number): boolean {
  if (!input.startsWith('\\score', start) || input[start - 1] === '\\') return false;
  const next = input[start + '\\score'.length];
  return next === undefined || next === '[' || next === '{' || /\s/u.test(next);
}

function readScoreCommand(
  input: string,
  start: number,
  tokens: ParsedScoreToken[],
  diagnostics: TeacherContentDiagnostic[],
): { value: string; end: number } {
  const next = start + '\\score'.length;

  if (input[next] === '[') {
    const optionalEnd = findBalancedEnd(input, next, '[', ']');
    const argumentStart = optionalEnd === -1 ? -1 : skipWhitespace(input, optionalEnd + 1);
    const argumentEnd =
      argumentStart >= 0 && input[argumentStart] === '{'
        ? findBalancedEnd(input, argumentStart, '{', '}')
        : -1;
    const end = argumentEnd === -1 ? input.length : argumentEnd + 1;
    diagnostics.push({
      code: 'advanced_score_command',
      message: '带可选参数的 \\score 命令已按高级 LaTeX 保留，未转换为评分方案。',
    });
    return { value: input.slice(start, end), end };
  }

  const argumentStart = skipWhitespace(input, next);
  if (input[argumentStart] !== '{') {
    diagnostics.push({
      code: 'malformed_score_command',
      message: '\\score 命令缺少参数花括号。',
    });
    return { value: input.slice(start), end: input.length };
  }

  const argumentEnd = findBalancedEnd(input, argumentStart, '{', '}');
  if (argumentEnd === -1) {
    diagnostics.push({
      code: 'malformed_score_command',
      message: '\\score 命令缺少结束花括号。',
    });
    return { value: input.slice(start), end: input.length };
  }

  const end = argumentEnd + 1;
  const source = input.slice(start, end);
  const argument = input.slice(argumentStart + 1, argumentEnd).trim();

  if (argument.length === 0) {
    diagnostics.push({
      code: 'empty_score_command',
      message: '\\score{} 需要填写分值或批注内容。',
    });
    return { value: source, end };
  }

  if (/^-\s*(?:\d+(?:\.\d+)?|\.\d+)$/u.test(argument)) {
    diagnostics.push({
      code: 'negative_score_command',
      message: '评分分值不能为负数，命令已按原样保留。',
    });
    return { value: source, end };
  }

  const numeric = argument.match(/^(?:\d+(?:\.\d+)?|\.\d+)$/u);
  const token: ParsedScoreToken = numeric
    ? { index: tokens.length, kind: 'score', source, points: Number(argument) }
    : {
        index: tokens.length,
        kind: 'annotation',
        source,
        content: parseInlineRichText(argument),
      };
  tokens.push(token);
  return { value: tokenSentinel(token.index), end };
}

function reconcileTokens(
  tokens: ParsedScoreToken[],
  existingRefs: ExistingReference[],
): Array<ExistingReference | undefined> {
  const assignments: Array<ExistingReference | undefined> = new Array(tokens.length);
  const used = new Set<string>();

  tokens.forEach((token, tokenIndex) => {
    const payload =
      token.kind === 'score' ? String(token.points ?? 0) : stringifyInlineRichText(token.content);
    const exact = existingRefs.find(
      (item) =>
        item.kind === token.kind &&
        item.payload === payload &&
        !used.has(`${item.kind}:${item.id}`),
    );

    if (exact) {
      assignments[tokenIndex] = exact;
      used.add(`${exact.kind}:${exact.id}`);
    }
  });

  (['score', 'annotation'] as const).forEach((kind) => {
    const remainingTokens = tokens
      .map((token, index) => ({ token, index }))
      .filter(({ token, index }) => token.kind === kind && !assignments[index]);
    const remainingRefs = existingRefs.filter(
      (item) => item.kind === kind && !used.has(`${item.kind}:${item.id}`),
    );

    if (remainingTokens.length !== remainingRefs.length) return;

    remainingTokens.forEach(({ index }, refIndex) => {
      const ref = remainingRefs[refIndex];
      if (!ref) return;
      assignments[index] = ref;
      used.add(`${ref.kind}:${ref.id}`);
    });
  });

  return assignments;
}

function collectExistingReferences(
  blocks: RichContentBlock[],
  scoreMarks: ScoreMark[],
  annotations: SolutionAnnotation[],
): ExistingReference[] {
  const scoreById = new Map(scoreMarks.map((item) => [item.id, item]));
  const annotationById = new Map(annotations.map((item) => [item.id, item]));
  const refs: ExistingReference[] = [];

  visitInlineContent(blocks, (item) => {
    if (item.type === 'scoreRef') {
      const mark = scoreById.get(item.scoreMarkId);
      if (mark)
        refs.push({ kind: 'score', id: mark.id, payload: String(mark.points), order: refs.length });
    } else if (item.type === 'annotationRef') {
      const annotation = annotationById.get(item.annotationId);
      if (annotation) {
        refs.push({
          kind: 'annotation',
          id: annotation.id,
          payload: stringifyInlineRichText(annotation.content),
          order: refs.length,
        });
      }
    }
  });

  return refs;
}

function replaceTokenSentinels(
  blocks: RichContentBlock[],
  assignments: Array<ExistingReference | undefined>,
): RichContentBlock[] {
  return transformInlineContent(blocks, (item) => {
    if (item.type !== 'rawLatex') return [item];
    const tokenIndex = readTokenSentinel(item.latex);
    if (tokenIndex === null) return [item];
    const assignment = assignments[tokenIndex];
    if (!assignment) return [];
    return assignment.kind === 'score'
      ? [{ type: 'scoreRef', scoreMarkId: assignment.id }]
      : [{ type: 'annotationRef', annotationId: assignment.id }];
  });
}

function transformTextContent(
  blocks: RichContentBlock[],
  transform: (text: string) => InlineContent[],
): RichContentBlock[] {
  return transformInlineContent(blocks, (item) =>
    item.type === 'text' ? transform(item.text) : [item],
  );
}

function transformInlineContent(
  blocks: RichContentBlock[],
  transform: (item: InlineContent) => InlineContent[],
): RichContentBlock[] {
  return blocks.map((block) => {
    if (block.type === 'paragraph') {
      return { ...block, children: mergeText(block.children.flatMap(transform)) };
    }
    if (block.type === 'list') {
      return {
        ...block,
        items: block.items.map((item) => transformInlineContent(item, transform)),
      };
    }
    if (block.type === 'textFigure') {
      return { ...block, text: transformInlineContent(block.text, transform) };
    }
    return block;
  });
}

function removeReferences(
  blocks: RichContentBlock[],
  predicate: (item: InlineContent) => boolean,
): RichContentBlock[] {
  return transformInlineContent(blocks, (item) => (predicate(item) ? [] : [item]));
}

function appendInlineReference(
  blocks: RichContentBlock[] | undefined,
  reference: InlineContent,
): RichContentBlock[] {
  const next = (blocks ?? []).map((block) => ({ ...block }));
  const last = next[next.length - 1];

  if (last?.type === 'paragraph') {
    last.children = [...last.children, { type: 'text', text: ' ' }, reference];
    return next;
  }

  next.push({ type: 'paragraph', children: [reference] });
  return next;
}

function collectReferenceIds(
  blocks: RichContentBlock[] | undefined,
  type: 'scoreRef' | 'annotationRef',
): string[] {
  const ids: string[] = [];
  visitInlineContent(blocks ?? [], (item) => {
    if (type === 'scoreRef' && item.type === 'scoreRef') ids.push(item.scoreMarkId);
    if (type === 'annotationRef' && item.type === 'annotationRef') ids.push(item.annotationId);
  });
  return ids;
}

function visitInlineContent(
  blocks: RichContentBlock[],
  visit: (item: InlineContent) => void,
): void {
  blocks.forEach((block) => {
    if (block.type === 'paragraph') block.children.forEach(visit);
    else if (block.type === 'list') block.items.forEach((item) => visitInlineContent(item, visit));
    else if (block.type === 'textFigure') visitInlineContent(block.text, visit);
  });
}

function stringifyContextBlocks(
  blocks: RichContentBlock[],
  reference:
    { type: 'scoreRef'; scoreMarkId: string } | { type: 'annotationRef'; annotationId: string },
  marker: string,
): string {
  const pieces: string[] = [];
  visitInlineContent(blocks, (item) => {
    if (item.type === 'text') pieces.push(item.text.replace(/\s+/gu, ' '));
    else if (item.type === 'inlineMath') pieces.push(`$${item.latex}$`);
    else if (item.type === 'rawLatex') pieces.push(item.latex);
    else if (
      item.type === 'scoreRef' &&
      reference.type === 'scoreRef' &&
      item.scoreMarkId === reference.scoreMarkId
    )
      pieces.push(marker);
    else if (
      item.type === 'annotationRef' &&
      reference.type === 'annotationRef' &&
      item.annotationId === reference.annotationId
    )
      pieces.push(marker);
  });
  return pieces.join('');
}

function cloneScoreMark(item: ScoreMark): ScoreMark {
  return { ...item, description: item.description?.map((part) => ({ ...part })) };
}

function cloneAnnotation(item: SolutionAnnotation): SolutionAnnotation {
  return { ...item, content: item.content.map((part) => ({ ...part })) };
}

function updateScoreMark(scoreMarks: ScoreMark[], id: string, points: number): void {
  const item = scoreMarks.find((candidate) => candidate.id === id);
  if (!item) return;
  item.points = points;
  item.placement = 'inline';
}

function updateAnnotation(
  annotations: SolutionAnnotation[],
  id: string,
  content: InlineRichText,
): void {
  const item = annotations.find((candidate) => candidate.id === id);
  if (item) item.content = content;
}

function findBalancedEnd(input: string, start: number, open: string, close: string): number {
  let depth = 0;
  for (let index = start; index < input.length; index += 1) {
    if (input[index] === open && input[index - 1] !== '\\') depth += 1;
    if (input[index] === close && input[index - 1] !== '\\') depth -= 1;
    if (depth === 0) return index;
  }
  return -1;
}

function skipWhitespace(input: string, start: number): number {
  let index = start;
  while (/\s/u.test(input[index] ?? '')) index += 1;
  return index;
}

function tokenSentinel(index: number): string {
  return `${TOKEN_PREFIX}${index}${TOKEN_SUFFIX}`;
}

function readTokenSentinel(value: string): number | null {
  if (!value.startsWith(TOKEN_PREFIX) || !value.endsWith(TOKEN_SUFFIX)) return null;
  const index = Number(value.slice(TOKEN_PREFIX.length, -TOKEN_SUFFIX.length));
  return Number.isInteger(index) ? index : null;
}

function pushText(content: InlineContent[], text: string): void {
  if (text.length > 0) content.push({ type: 'text', text });
}

function mergeText(content: InlineContent[]): InlineContent[] {
  const merged: InlineContent[] = [];
  content.forEach((item) => {
    const previous = merged[merged.length - 1];
    if (item.type === 'text' && previous?.type === 'text') previous.text += item.text;
    else merged.push(item);
  });
  return merged;
}
