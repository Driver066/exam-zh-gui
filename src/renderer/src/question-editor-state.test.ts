import { describe, expect, it } from 'vitest';

import {
  createDefaultQuestion,
  createEmptyExamDocument,
  createSubQuestion,
  parseRichContentInput,
  type CreateId,
} from '../../shared/document';
import { setQuestionChoiceLabelPreset } from './choice-layout-options';
import {
  buildQuestionEditorSummary,
  buildQuestionEditorTabDescriptors,
  getAvailableQuestionEditorTabs,
  getDefaultQuestionEditorTab,
  getNewQuestionStemSelection,
  getQuestionEditorTabKeyboardTarget,
  removeQuestionEditorTabState,
  resolveQuestionEditorTab,
  setQuestionEditorTab,
  toggleExpandedQuestionId,
} from './question-editor-state';

describe('question editor state', () => {
  it('keeps at most one expanded question and allows all questions to collapse', () => {
    expect(toggleExpandedQuestionId(null, 'question-1')).toBe('question-1');
    expect(toggleExpandedQuestionId('question-1', 'question-2')).toBe('question-2');
    expect(toggleExpandedQuestionId('question-2', 'question-2')).toBeNull();
  });

  it('remembers one active tab per question and removes deleted question state', () => {
    const createId = sequenceIdFactory();
    const first = createDefaultQuestion('singleChoice', createId);
    const second = createDefaultQuestion('blank', createId);
    let state = {};

    state = setQuestionEditorTab(state, first, 'teacher');
    state = setQuestionEditorTab(state, second, 'settings');

    expect(resolveQuestionEditorTab(state, first)).toBe('teacher');
    expect(resolveQuestionEditorTab(state, second)).toBe('settings');
    expect(removeQuestionEditorTabState(state, first.id)).toEqual({ [second.id]: 'settings' });
  });

  it('uses answer by default for structured questions and settings for raw LaTeX', () => {
    const createId = sequenceIdFactory();
    const structured = createDefaultQuestion('singleChoice', createId);
    const raw = createDefaultQuestion('rawLatex', createId);

    expect(getDefaultQuestionEditorTab(structured)).toBe('answer');
    expect(getAvailableQuestionEditorTabs(structured)).toEqual(['answer', 'settings', 'teacher']);
    expect(getDefaultQuestionEditorTab(raw)).toBe('settings');
    expect(getAvailableQuestionEditorTabs(raw)).toEqual(['settings', 'teacher']);
    expect(resolveQuestionEditorTab({ [raw.id]: 'answer' }, raw)).toBe('settings');
  });

  it('resolves tab keyboard navigation with wrapping and raw LaTeX boundaries', () => {
    expect(
      getQuestionEditorTabKeyboardTarget(['answer', 'settings', 'teacher'], 'answer', 'ArrowLeft'),
    ).toBe('teacher');
    expect(
      getQuestionEditorTabKeyboardTarget(
        ['answer', 'settings', 'teacher'],
        'teacher',
        'ArrowRight',
      ),
    ).toBe('answer');
    expect(getQuestionEditorTabKeyboardTarget(['settings', 'teacher'], 'teacher', 'Home')).toBe(
      'settings',
    );
    expect(getQuestionEditorTabKeyboardTarget(['settings', 'teacher'], 'settings', 'End')).toBe(
      'teacher',
    );
  });

  it('selects generated stem text while preserving a new blank placeholder', () => {
    const createId = sequenceIdFactory();
    const choice = createDefaultQuestion('singleChoice', createId);
    const blank = createDefaultQuestion('blank', createId);

    expect(getNewQuestionStemSelection(choice)).toEqual({ start: 0, end: 5 });
    expect(getNewQuestionStemSelection(blank)).toEqual({ start: 0, end: 4 });
  });
});

describe('question editor summaries', () => {
  it('includes effective choice labels and correct option content', () => {
    const createId = sequenceIdFactory();
    const document = createEmptyExamDocument('summary-choice');
    let question = createDefaultQuestion('multipleChoice', createId);
    question.correctChoiceIds = [question.choices![0]!.id, question.choices![2]!.id];
    question.choices![0]!.content = parseRichContentInput('$-2$', {
      context: 'choiceOption',
    }).blocks;
    question.choices![2]!.content = parseRichContentInput('$0$', {
      context: 'choiceOption',
    }).blocks;
    question = setQuestionChoiceLabelPreset(question, 'circlednumber');

    const summary = buildQuestionEditorSummary(document, question);

    expect(summary.answerLead).toBe('4 个选项 · 答案');
    expect(summary.answerParts.map((part) => part.label)).toEqual(['①：', '③：']);
    expect(summary.answerParts.map((part) => part.blocks)).toEqual([
      question.choices![0]!.content,
      question.choices![2]!.content,
    ]);
    expect(summary.tone).toBe('neutral');
  });

  it('reports missing answers, empty choices, and invalid answer references', () => {
    const createId = sequenceIdFactory();
    const document = createEmptyExamDocument('summary-choice-warnings');
    const missing = createDefaultQuestion('singleChoice', createId);
    missing.correctChoiceIds = [];
    const empty = createDefaultQuestion('singleChoice', createId);
    empty.choices![0]!.content = [];
    empty.correctChoiceIds = [empty.choices![0]!.id, 'missing-choice'];

    expect(buildQuestionEditorSummary(document, missing)).toMatchObject({
      tone: 'warning',
      answerParts: [{ text: '未设答案', tone: 'warning' }],
    });
    expect(buildQuestionEditorSummary(document, empty).answerParts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'A：', text: '内容为空', tone: 'warning' }),
        expect.objectContaining({ text: '1 个答案引用失效', tone: 'warning' }),
      ]),
    );
  });

  it('summarizes blank, judgement, problem, and raw LaTeX answers', () => {
    const createId = sequenceIdFactory();
    const document = createEmptyExamDocument('summary-types');
    const blank = createDefaultQuestion('blank', createId);
    const judgement = createDefaultQuestion('judgement', createId);
    const problem = createDefaultQuestion('problem', createId);
    const raw = createDefaultQuestion('rawLatex', createId);

    blank.blanks![0]!.answer = parseRichContentInput('$13$', { context: 'blankAnswer' }).blocks;
    judgement.judgement = { correctAnswer: false, answerStyle: 'symbol' };
    raw.rawLatex = '\\begin{question}raw\\end{question}';

    expect(buildQuestionEditorSummary(document, blank)).toMatchObject({
      answerLead: '1 空 · 答案',
      tone: 'neutral',
    });
    expect(buildQuestionEditorSummary(document, judgement).answerParts[0]?.text).toBe('错误（×）');
    expect(buildQuestionEditorSummary(document, problem).answerParts[0]?.text).toBe('解答待填写');
    expect(buildQuestionEditorSummary(document, raw)).toMatchObject({
      stemText: '\\begin{question}raw\\end{question}',
      answerLead: '原始 LaTeX 内容',
    });
  });
});

describe('question editor tab descriptors', () => {
  it('uses compact normal summaries for each structured question type', () => {
    const createId = sequenceIdFactory();
    const document = createEmptyExamDocument('tab-summaries');
    const choice = createDefaultQuestion('singleChoice', createId);
    const blank = createDefaultQuestion('blank', createId);
    const judgement = createDefaultQuestion('judgement', createId);
    const problem = createDefaultQuestion('problem', createId);

    choice.correctChoiceIds = [choice.choices![0]!.id];
    judgement.judgement = { correctAnswer: true };
    blank.blanks![0]!.answer = parseRichContentInput('13', { context: 'blankAnswer' }).blocks;
    const completedSubQuestion = createSubQuestion(createId);
    completedSubQuestion.solution = parseRichContentInput('完成', {
      context: 'solution',
    }).blocks;
    problem.subQuestionGroup = { items: [completedSubQuestion] };

    expect(buildQuestionEditorTabDescriptors(document, choice)[0]).toMatchObject({
      id: 'answer',
      label: '答案内容',
      summary: '4 个选项',
      tone: 'neutral',
    });
    expect(buildQuestionEditorTabDescriptors(document, blank)[0]?.summary).toBe('1 空');
    expect(buildQuestionEditorTabDescriptors(document, judgement)[0]?.summary).toBe('已设答案');
    expect(buildQuestionEditorTabDescriptors(document, problem)[0]).toMatchObject({
      label: '小题内容',
      summary: '1 小题',
    });
  });

  it('applies answer warning priority before missing-answer summaries', () => {
    const createId = sequenceIdFactory();
    const document = createEmptyExamDocument('tab-warning-priority');
    const question = createDefaultQuestion('singleChoice', createId);
    question.correctChoiceIds = ['missing-choice'];

    const invalid = buildQuestionEditorTabDescriptors(document, question, {
      [`${question.id}:choice:${question.choices![0]!.id}`]: '公式输入不完整',
    })[0];
    expect(invalid).toMatchObject({ summary: '答案引用失效', tone: 'warning' });

    question.correctChoiceIds = [];
    const richWarning = buildQuestionEditorTabDescriptors(document, question, {
      [`${question.id}:choice:${question.choices![0]!.id}`]: '公式输入不完整',
    })[0];
    expect(richWarning).toMatchObject({ summary: '内容需检查', tone: 'warning' });

    const missing = buildQuestionEditorTabDescriptors(document, question)[0];
    expect(missing).toMatchObject({ summary: '未设答案', tone: 'warning' });
  });

  it('summarizes missing blanks, problem completion, settings, and teacher review', () => {
    const createId = sequenceIdFactory();
    const document = createEmptyExamDocument('tab-other-warnings');
    const blank = createDefaultQuestion('blank', createId);
    const problem = createDefaultQuestion('problem', createId);
    const choice = createDefaultQuestion('singleChoice', createId);

    choice.correctChoiceIds = [choice.choices![0]!.id];
    problem.subQuestionGroup = { items: [createSubQuestion(createId)] };
    choice.points = undefined;
    choice.scoreMarks = [{ id: 'score-1', points: 0, description: [] }];

    expect(buildQuestionEditorTabDescriptors(document, blank)[0]?.summary).toBe('1 空未设置');
    expect(buildQuestionEditorTabDescriptors(document, problem)[0]?.summary).toBe('1 小题待完善');
    expect(buildQuestionEditorTabDescriptors(document, choice)[1]).toMatchObject({
      summary: '未设分值',
      tone: 'warning',
    });
    const teacherDescriptor = buildQuestionEditorTabDescriptors(document, choice)[2];
    expect(teacherDescriptor).toMatchObject({
      summary: '评分需确认',
      tone: 'warning',
    });
    expect(teacherDescriptor?.tooltip).not.toContain('。；');
    expect(teacherDescriptor?.tooltip.endsWith('。')).toBe(true);
  });

  it('omits the answer tab for raw LaTeX and reports rich-content warnings in tooltips', () => {
    const createId = sequenceIdFactory();
    const document = createEmptyExamDocument('tab-raw');
    const raw = createDefaultQuestion('rawLatex', createId);
    const question = createDefaultQuestion('singleChoice', createId);
    question.correctChoiceIds = [question.choices![0]!.id];

    expect(buildQuestionEditorTabDescriptors(document, raw).map((tab) => tab.id)).toEqual([
      'settings',
      'teacher',
    ]);
    const descriptor = buildQuestionEditorTabDescriptors(document, question, {
      [`${question.id}:choice:${question.choices![0]!.id}`]: '公式输入不完整',
    })[0];
    expect(descriptor?.tooltip).toContain('公式输入不完整');
  });
});

function sequenceIdFactory(): CreateId {
  let index = 0;
  return (prefix: string) => `${prefix}-${++index}`;
}
