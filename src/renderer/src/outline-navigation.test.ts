import { describe, expect, it } from 'vitest';

import {
  addQuestion,
  addSection,
  createDefaultQuestion,
  createDefaultSection,
  createEmptyExamDocument,
  createExamDocumentFromTemplate,
  parseRichContentInput,
  type CreateId,
  type ExamQuestion,
} from '../../shared/document';
import { buildOutlineNavigation, getVisibleOutlineBadges } from './outline-navigation';

describe('outline navigation', () => {
  it('builds document, section, and question summaries', () => {
    const createId = sequenceIdFactory();
    let document = createEmptyExamDocument('outline-doc');
    const choiceSection = createDefaultSection(createId, 'singleChoice');
    const problemSection = createDefaultSection(createId, 'problem');
    const choiceQuestion = createDefaultQuestion('singleChoice', createId);
    const blankQuestion = createDefaultQuestion('blank', createId);
    const problemQuestion = createProblemWithTwoSubQuestions(createId);

    blankQuestion.blanks = blankQuestion.blanks?.map((blank) => ({ ...blank, answer: [] }));

    document = addSection(document, choiceSection);
    document = addSection(document, problemSection);
    document = addQuestion(document, choiceSection.id, choiceQuestion);
    document = addQuestion(document, choiceSection.id, blankQuestion);
    document = addQuestion(document, problemSection.id, problemQuestion);

    const outline = buildOutlineNavigation(document);

    expect(outline.stats).toEqual({ sectionCount: 2, questionCount: 3, totalPoints: 22 });
    expect(outline.sections[0]).toMatchObject({
      numberLabel: '一、',
      scoreSummary: '2 题 · 每小题 5 分 · 共 10 分',
    });
    expect(outline.sections[0]?.questions.map((question) => question.number)).toEqual([1, 2]);
    expect(outline.sections[1]?.questions[0]).toMatchObject({
      number: 3,
      typeLabel: '解答题',
      pointsLabel: '12分',
      detailLabels: ['2 小题'],
    });
    expect(outline.sections[0]?.questions[1]?.detailLabels).toEqual(['1 空']);
  });

  it('marks answer, solution, score, and review states', () => {
    const createId = sequenceIdFactory();
    const singleChoice = createDefaultQuestion('singleChoice', createId);
    const blankQuestion = createDefaultQuestion('blank', createId);
    const problemQuestion = createProblemWithTwoSubQuestions(createId);

    singleChoice.correctChoiceIds = undefined;
    blankQuestion.blanks = blankQuestion.blanks?.map((blank) => ({
      ...blank,
      answer: parseRichContentInput('1', { context: 'blankAnswer' }).blocks,
    }));
    blankQuestion.solution = parseRichContentInput('代入即可。', { context: 'solution' }).blocks;
    problemQuestion.subQuestionGroup!.items[0]!.scoreMarks = [{ id: 'score-1', points: 4 }];
    problemQuestion.subQuestionGroup!.items[0]!.scoreMode = 'levels';

    const document = {
      ...createEmptyExamDocument('outline-badges'),
      sections: [
        {
          ...createDefaultSection(createId, 'custom'),
          questions: [singleChoice, blankQuestion, problemQuestion],
        },
      ],
    };
    const outline = buildOutlineNavigation(document);

    expect(outline.sections[0]?.questions[0]?.badges.map((badge) => badge.label)).toContain(
      '未设答案',
    );
    expect(outline.sections[0]?.questions[1]?.badges.map((badge) => badge.label)).toEqual([
      '已设答案',
      '有解析',
    ]);
    expect(outline.sections[0]?.questions[2]?.badges.map((badge) => badge.label)).toEqual([
      '分值需确认',
      '部分小题缺评分',
      '有评分档',
    ]);
  });

  it('uses section resets and explicit starts in question summaries', () => {
    const createId = sequenceIdFactory();
    const firstSection = createDefaultSection(createId, 'singleChoice');
    const resetSection = createDefaultSection(createId, 'blank');
    const customSection = createDefaultSection(createId, 'problem');
    const document = {
      ...createEmptyExamDocument('outline-numbering'),
      sections: [
        {
          ...firstSection,
          questions: [
            createDefaultQuestion('singleChoice', createId),
            createDefaultQuestion('singleChoice', createId),
          ],
        },
        {
          ...resetSection,
          numbering: { reset: true },
          questions: [createDefaultQuestion('blank', createId)],
        },
        {
          ...customSection,
          numbering: { start: 8 },
          questions: [createDefaultQuestion('problem', createId)],
        },
      ],
    };

    const outline = buildOutlineNavigation(document);

    expect(outline.sections.map((section) => section.questions[0]?.number)).toEqual([1, 1, 8]);
  });

  it('sorts and compresses visible badges', () => {
    const badges = getVisibleOutlineBadges(
      [
        { label: '有解析', tone: 'info', priority: 60 },
        { label: '有评分点', tone: 'info', priority: 80 },
        { label: '未设答案', tone: 'warning', priority: 10 },
      ],
      2,
    );

    expect(badges.visible.map((badge) => badge.label)).toEqual(['未设答案', '有解析']);
    expect(badges.hiddenCount).toBe(1);
  });

  it('reports judgement answer state without treating false as missing', () => {
    const createId = sequenceIdFactory();
    const unanswered = createDefaultQuestion('judgement', createId);
    const answered = createDefaultQuestion('judgement', createId);
    answered.judgement = { correctAnswer: false };
    const document = {
      ...createEmptyExamDocument('outline-judgement'),
      sections: [
        {
          ...createDefaultSection(createId, 'judgement'),
          questions: [unanswered, answered],
        },
      ],
    };

    const outline = buildOutlineNavigation(document);

    expect(outline.sections[0]?.questions[0]?.typeLabel).toBe('判断题');
    expect(outline.sections[0]?.questions[0]?.badges[0]?.label).toBe('未设答案');
    expect(outline.sections[0]?.questions[1]?.badges[0]?.label).toBe('已设答案');
  });

  it('uses the full math exam as a 4-section, 19-question navigation baseline', () => {
    const document = createExamDocumentFromTemplate('math-full-exam', sequenceIdFactory());
    const outline = buildOutlineNavigation(document);

    expect(outline.stats).toEqual({ sectionCount: 4, questionCount: 19, totalPoints: 150 });
    expect(outline.sections.map((section) => section.questions.length)).toEqual([8, 3, 3, 5]);
    expect(
      outline.sections.flatMap((section) => section.questions.map((item) => item.number)),
    ).toEqual(Array.from({ length: 19 }, (_, index) => index + 1));
    expect(outline.sections.map((section) => section.numberLabel)).toEqual([
      '一、',
      '二、',
      '三、',
      '四、',
    ]);
    expect(
      outline.sections
        .flatMap((section) => section.questions)
        .every((item) => item.badges.every((badge) => badge.tone !== 'warning')),
    ).toBe(true);
  });
});

function createProblemWithTwoSubQuestions(createId: CreateId): ExamQuestion {
  const problem = createDefaultQuestion('problem', createId);

  return {
    ...problem,
    subQuestionGroup: {
      exportAs: 'enumerate',
      listKind: 'enumerate',
      items: [
        {
          id: createId('subquestion'),
          stem: parseRichContentInput('求第一问。', { context: 'subQuestionStem' }).blocks,
          scoreMode: 'additive',
          scoreMarks: [],
        },
        {
          id: createId('subquestion'),
          stem: parseRichContentInput('求第二问。', { context: 'subQuestionStem' }).blocks,
          scoreMode: 'additive',
          scoreMarks: [],
        },
      ],
    },
  };
}

function sequenceIdFactory(): CreateId {
  let index = 0;

  return (prefix: string) => {
    index += 1;
    return `${prefix}-${index}`;
  };
}
