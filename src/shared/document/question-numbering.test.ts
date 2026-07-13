import { describe, expect, it } from 'vitest';

import { createDefaultQuestion, createDefaultSection } from './editor';
import { createEmptyExamDocument } from './factory';
import {
  formatQuestionLabel,
  getQuestionLabelPreset,
  getSectionNumberingMode,
  resolveQuestionNumbers,
} from './question-numbering';

describe('question numbering', () => {
  it('continues across sections and applies section resets and custom starts', () => {
    let id = 0;
    const createId = () => `id-${++id}`;
    const document = createEmptyExamDocument('doc-numbering');
    const first = createDefaultSection(createId, 'singleChoice');
    const second = createDefaultSection(createId, 'blank');
    const third = createDefaultSection(createId, 'problem');
    first.questions = [
      createDefaultQuestion('singleChoice', createId),
      createDefaultQuestion('singleChoice', createId),
    ];
    second.numbering = { reset: true };
    second.questions = [createDefaultQuestion('blank', createId)];
    third.numbering = { reset: true, start: 8 };
    third.questions = [createDefaultQuestion('problem', createId)];
    document.sections = [first, second, third];

    const numbers = resolveQuestionNumbers(document);

    expect([...numbers.values()].map((item) => item.number)).toEqual([1, 2, 1, 8]);
    expect(getSectionNumberingMode(first.numbering)).toBe('continue');
    expect(getSectionNumberingMode(second.numbering)).toBe('restart');
    expect(getSectionNumberingMode(third.numbering)).toBe('customStart');
  });

  it('uses the first structured question after raw LaTeX and honors question overrides', () => {
    let id = 0;
    const createId = () => `id-${++id}`;
    const document = createEmptyExamDocument('doc-overrides');
    const section = createDefaultSection(createId, 'custom');
    const raw = createDefaultQuestion('rawLatex', createId);
    raw.rawLatex = '\\customquestion';
    const first = createDefaultQuestion('blank', createId);
    const second = createDefaultQuestion('problem', createId);
    second.index = 12;
    const third = createDefaultQuestion('blank', createId);
    third.examZhOptions = { index: '20' };
    section.numbering = { reset: true, start: 5 };
    section.questions = [raw, first, second, third];
    document.sections = [section];

    const numbers = resolveQuestionNumbers(document);

    expect(numbers.has(raw.id)).toBe(false);
    expect(numbers.get(first.id)?.number).toBe(5);
    expect(numbers.get(second.id)?.number).toBe(12);
    expect(numbers.get(third.id)?.number).toBe(20);
  });

  it('formats all built-in label presets and falls back safely', () => {
    expect(formatQuestionLabel(3, '\\arabic*.')).toBe('3.');
    expect(formatQuestionLabel(3, '\\alph*.')).toBe('c.');
    expect(formatQuestionLabel(3, '\\Alph*.')).toBe('C.');
    expect(formatQuestionLabel(4, '\\roman*.')).toBe('iv.');
    expect(formatQuestionLabel(4, '\\Roman*.')).toBe('IV.');
    expect(formatQuestionLabel(3, '\\circlednumber*')).toBe('③');
    expect(formatQuestionLabel(21, '\\tikzcirclednumber*')).toBe('21');
    expect(formatQuestionLabel(2, '\\custom*.')).toBe('2.');
    expect(getQuestionLabelPreset('\\custom*.')).toBe('custom');
  });

  it('lets question labels override section labels', () => {
    let id = 0;
    const createId = () => `id-${++id}`;
    const document = createEmptyExamDocument('doc-label-overrides');
    const section = createDefaultSection(createId, 'custom');
    const first = createDefaultQuestion('blank', createId);
    const second = createDefaultQuestion('problem', createId);
    second.examZhOptions = { label: '\\Roman*.' };
    section.numbering = { examZhOptions: { label: '\\Alph*.' } };
    section.questions = [first, second];
    document.sections = [section];

    const numbers = resolveQuestionNumbers(document);

    expect(numbers.get(first.id)?.label).toBe('A.');
    expect(numbers.get(second.id)?.label).toBe('II.');
  });
});
