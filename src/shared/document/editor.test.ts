import { describe, expect, it } from 'vitest';

import { createEmptyExamDocument } from './factory';
import {
  addInformationField,
  addNotice,
  addQuestion,
  addSection,
  appendBlankRefToStem,
  calculateDocumentStats,
  calculateSectionStats,
  calculateTotalPointsMismatch,
  commitChoiceLabelDraft,
  commitNoticeDraft,
  commitNumberDraft,
  addSubQuestionToProblem,
  createBlankSlot,
  createDefaultQuestion,
  createDefaultSection,
  createInformationField,
  createNoticeBlock,
  createScoreMark,
  createSubQuestion,
  duplicateChoiceOptionWithResult,
  duplicateSubQuestionWithResult,
  getChoiceDisplayLabel,
  insertSectionAt,
  duplicateQuestion,
  duplicateQuestionWithResult,
  moveInformationField,
  moveNotice,
  moveQuestion,
  moveSection,
  moveChoiceOption,
  moveSubQuestion,
  removeBlankFromQuestion,
  removeChoiceOption,
  removeNotice,
  removeInformationField,
  replaceInformationField,
  replaceNotice,
  reviewQuestionScoreMarks,
  resolveQuestionSelectionAfterDelete,
  removeSubQuestion,
  updateSubQuestion,
  setBlankAnswer,
} from './editor';
import { CURRENT_SCHEMA_VERSION } from './model';
import { createExamDocumentFromTemplate, examDocumentTemplates } from './templates';
import { parseExamDocument } from './schema';
import { parseRichContentInput } from './rich-content';
import { deserializeExamDocument, serializeExamDocument } from './serialization';

describe('document editor helpers', () => {
  it('adds, moves, and counts sections and questions', () => {
    const createId = sequenceIdFactory();
    let document = createEmptyExamDocument('doc-editor');
    const firstSection = createDefaultSection(createId, 'singleChoice');
    const secondSection = createDefaultSection(createId, 'problem');

    document = addSection(document, firstSection);
    document = addSection(document, secondSection);
    document = moveSection(document, secondSection.id, 'up');

    expect(document.sections.map((section) => section.id)).toEqual([
      secondSection.id,
      firstSection.id,
    ]);

    const question = createDefaultQuestion('singleChoice', createId);
    document = addQuestion(document, firstSection.id, question);

    expect(calculateDocumentStats(document)).toEqual({
      sectionCount: 2,
      questionCount: 1,
      totalPoints: 5,
    });
  });

  it('inserts sections at normalized positions', () => {
    const createId = sequenceIdFactory();
    const first = createDefaultSection(createId, 'singleChoice');
    const second = createDefaultSection(createId, 'blank');
    const before = createDefaultSection(createId, 'custom');
    const middle = createDefaultSection(createId, 'problem');
    const after = createDefaultSection(createId, 'judgement');
    let document = createEmptyExamDocument('doc-insert-section');

    document = addSection(document, first);
    document = addSection(document, second);
    document = insertSectionAt(document, before, -3);
    document = insertSectionAt(document, middle, 1.8);
    document = insertSectionAt(document, after, 99);

    expect(document.sections.map((section) => section.id)).toEqual([
      before.id,
      middle.id,
      first.id,
      second.id,
      after.id,
    ]);
  });

  it('duplicates questions while remapping blank refs', () => {
    const createId = sequenceIdFactory();
    let document = createEmptyExamDocument('doc-duplicate');
    const section = createDefaultSection(createId, 'blank');
    const question = createDefaultQuestion('blank', createId);

    document = addSection(document, section);
    document = addQuestion(document, section.id, question);
    document = duplicateQuestion(document, section.id, question.id, createId);

    const [original, duplicate] = document.sections[0]?.questions ?? [];

    expect(original.id).not.toBe(duplicate.id);
    expect(original.blanks?.[0]?.id).not.toBe(duplicate.blanks?.[0]?.id);
    expect(duplicate.stem[0]).toMatchObject({
      type: 'paragraph',
      children: [
        { type: 'text', text: '请填写：' },
        { type: 'blankRef', blankId: duplicate.blanks?.[0]?.id },
      ],
    });
  });

  it('duplicates choices with fresh stable ids and remapped answers', () => {
    const createId = sequenceIdFactory();
    let document = createEmptyExamDocument('doc-duplicate-choice');
    const section = createDefaultSection(createId, 'singleChoice');
    const question = createDefaultQuestion('singleChoice', createId);
    const originalAnswerId = question.correctChoiceIds![0]!;

    document = addSection(document, section);
    document = addQuestion(document, section.id, question);
    document = duplicateQuestion(document, section.id, question.id, createId);

    const [original, duplicate] = document.sections[0]!.questions;
    const duplicateChoiceIds = duplicate!.choices!.map((choice) => choice.id);

    expect(duplicateChoiceIds).not.toContain(originalAnswerId);
    expect(duplicateChoiceIds).not.toEqual(original!.choices!.map((choice) => choice.id));
    expect(duplicate!.correctChoiceIds).toEqual([duplicateChoiceIds[0]]);
    expect(duplicate!.choices!.map((choice) => choice.label)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('returns the new question id when duplicating for editor selection', () => {
    const createId = sequenceIdFactory();
    let document = createEmptyExamDocument('doc-duplicate-result');
    const section = createDefaultSection(createId, 'singleChoice');
    const question = createDefaultQuestion('singleChoice', createId);

    document = addSection(document, section);
    document = addQuestion(document, section.id, question);
    const result = duplicateQuestionWithResult(document, section.id, question.id, createId);

    expect(result.duplicatedQuestionId).toBe(result.document.sections[0]?.questions[1]?.id);
    expect(result.duplicatedQuestionId).not.toBe(question.id);
  });

  it('selects the next question after delete, then the previous question at the end', () => {
    const createId = sequenceIdFactory();
    const section = createDefaultSection(createId, 'custom');
    const first = createDefaultQuestion('singleChoice', createId);
    const second = createDefaultQuestion('blank', createId);
    const third = createDefaultQuestion('problem', createId);
    section.questions = [first, second, third];

    expect(resolveQuestionSelectionAfterDelete(section, second.id)).toBe(third.id);
    expect(resolveQuestionSelectionAfterDelete(section, third.id)).toBe(second.id);
    expect(resolveQuestionSelectionAfterDelete({ questions: [first] }, first.id)).toBeNull();
    expect(resolveQuestionSelectionAfterDelete(section, 'missing')).toBeNull();
  });

  it('appends blank references to the stem', () => {
    const createId = sequenceIdFactory();
    const question = createDefaultQuestion('blank', createId);
    const blank = createBlankSlot(createId);
    const updated = appendBlankRefToStem(question, blank.id);

    expect(blank).toMatchObject({ command: 'fillin', width: '3em', type: 'line' });

    expect(updated.stem[0]).toMatchObject({
      type: 'paragraph',
      children: expect.arrayContaining([{ type: 'blankRef', blankId: blank.id }]),
    });
  });

  it('sets blank answers on the slot as the single source of truth', () => {
    const createId = sequenceIdFactory();
    const question = createDefaultQuestion('blank', createId);
    const blankId = question.blanks![0]!.id;
    const answer = parseRichContentInput('$f(0)=1$', { context: 'blankAnswer' }).blocks;
    const updated = setBlankAnswer(question, blankId, answer);

    expect(updated.blanks?.[0]?.answer).toEqual(answer);
  });

  it('removes a blank and every matching stem reference together', () => {
    const createId = sequenceIdFactory();
    const question = createDefaultQuestion('blank', createId);
    const blankId = question.blanks![0]!.id;
    const duplicatedReference = appendBlankRefToStem(question, blankId);

    const updated = removeBlankFromQuestion(duplicatedReference, blankId);

    expect(updated.blanks).toEqual([]);
    expect(JSON.stringify(updated.stem)).not.toContain(blankId);
    expect(removeBlankFromQuestion(updated, 'missing')).toBe(updated);
  });

  it('moves questions within a section', () => {
    const createId = sequenceIdFactory();
    let document = createEmptyExamDocument('doc-move-question');
    const section = createDefaultSection(createId, 'custom');
    const firstQuestion = createDefaultQuestion('singleChoice', createId);
    const secondQuestion = createDefaultQuestion('problem', createId);

    document = addSection(document, section);
    document = addQuestion(document, section.id, firstQuestion);
    document = addQuestion(document, section.id, secondQuestion);
    document = moveQuestion(document, section.id, secondQuestion.id, 'up');

    expect(document.sections[0]?.questions.map((question) => question.id)).toEqual([
      secondQuestion.id,
      firstQuestion.id,
    ]);
  });

  it('summarizes section points and metadata total mismatches', () => {
    const createId = sequenceIdFactory();
    const section = createDefaultSection(createId, 'singleChoice');
    const firstQuestion = createDefaultQuestion('singleChoice', createId);
    const secondQuestion = createDefaultQuestion('singleChoice', createId);

    section.questions = [firstQuestion, secondQuestion];

    expect(calculateSectionStats(section)).toEqual({
      questionCount: 2,
      totalPoints: 10,
      commonPoints: 5,
    });

    secondQuestion.points = 6;

    expect(calculateSectionStats(section)).toEqual({
      questionCount: 2,
      totalPoints: 11,
      commonPoints: undefined,
    });

    const document = createEmptyExamDocument('doc-total-mismatch');
    document.metadata.totalPoints = 12;
    document.sections = [section];

    expect(calculateTotalPointsMismatch(document)).toEqual({ configured: 12, calculated: 11 });

    document.metadata.totalPoints = 11;

    expect(calculateTotalPointsMismatch(document)).toBeNull();
  });

  it('formats choice labels from explicit labels or ids', () => {
    expect(getChoiceDisplayLabel({ id: 'A', label: '甲', content: [] })).toBe('甲');
    expect(getChoiceDisplayLabel({ id: 'B', content: [] })).toBe('B');
  });

  it('commits choice label drafts without losing selected answers', () => {
    const createId = sequenceIdFactory();
    const singleChoice = createDefaultQuestion('singleChoice', createId);
    const emptyCommit = commitChoiceLabelDraft(singleChoice, 0, '');

    expect(emptyCommit.question).toEqual(singleChoice);
    expect(emptyCommit.warning).toBeUndefined();

    singleChoice.choices![0] = { ...singleChoice.choices![0], id: '甲乙', label: '甲乙' };
    expect(commitChoiceLabelDraft(singleChoice, 0, '').warning).toBeUndefined();

    const multiChoice = createDefaultQuestion('multipleChoice', createId);
    const originalChoiceIds = multiChoice.choices!.map((choice) => choice.id);
    multiChoice.correctChoiceIds = [originalChoiceIds[2]!, originalChoiceIds[0]!];

    const labelCommit = commitChoiceLabelDraft(multiChoice, 0, '甲乙');

    expect(labelCommit.question.choices?.[0]).toMatchObject({
      id: originalChoiceIds[0],
      label: '甲乙',
    });
    expect(labelCommit.question.correctChoiceIds).toEqual([
      originalChoiceIds[2],
      originalChoiceIds[0],
    ]);
    expect(labelCommit.warning).toBe('选项标识建议为 1 个字符。');
  });

  it('moves default choices with positional labels while preserving selected ids', () => {
    const createId = sequenceIdFactory();
    const question = createDefaultQuestion('multipleChoice', createId);
    const [firstId, secondId] = question.choices!.map((choice) => choice.id);
    question.correctChoiceIds = [secondId!];

    const moved = moveChoiceOption(question, secondId!, 'up');

    expect(moved.choices?.map((choice) => [choice.id, choice.label])).toEqual([
      [secondId, 'A'],
      [firstId, 'B'],
      [question.choices![2]!.id, 'C'],
      [question.choices![3]!.id, 'D'],
    ]);
    expect(moved.correctChoiceIds).toEqual([secondId]);
    expect(moveChoiceOption(moved, secondId!, 'up')).toBe(moved);
  });

  it('preserves custom choice labels and creates safe duplicates', () => {
    const createId = sequenceIdFactory();
    const question = createDefaultQuestion('multipleChoice', createId);
    question.choices![0] = { ...question.choices![0]!, label: '甲' };
    question.correctChoiceIds = [question.choices![0]!.id];

    const moved = moveChoiceOption(question, question.choices![1]!.id, 'up');
    expect(moved.choices?.map((choice) => choice.label)).toEqual(['B', '甲', 'C', 'D']);

    const duplicated = duplicateChoiceOptionWithResult(moved, question.choices![0]!.id, createId);
    expect(duplicated.choiceId).not.toBeNull();
    expect(duplicated.question.choices).toHaveLength(5);
    expect(duplicated.question.choices?.[2]).toMatchObject({
      id: duplicated.choiceId,
      label: 'A',
      content: question.choices![0]!.content,
    });
    expect(duplicated.question.correctChoiceIds).toEqual([question.choices![0]!.id]);

    const removed = removeChoiceOption(duplicated.question, question.choices![0]!.id);
    expect(removed.correctChoiceIds).toBeUndefined();
    expect(removed.choices?.some((choice) => choice.id === question.choices![0]!.id)).toBe(false);
  });

  it('commits number drafts according to optional and required field rules', () => {
    expect(commitNumberDraft('', 45, 'optional')).toEqual({ value: undefined });
    expect(commitNumberDraft('', 5, 'required')).toEqual({ value: 0 });
    expect(commitNumberDraft('03', 0, 'required')).toEqual({ value: 3 });
    expect(commitNumberDraft('abc', 12, 'optional')).toEqual({
      value: 12,
      warning: '请输入大于或等于 0 的数字，已保留原值。',
    });
    expect(commitNumberDraft('-1', 5, 'required')).toEqual({
      value: 0,
      warning: '请输入大于或等于 0 的数字，已按 0 处理。',
    });
  });

  it('adds, removes, moves, and replaces front matter information fields', () => {
    const first = createInformationField('姓名：');
    const second = { ...createInformationField('班级：'), width: '5em' };
    const third = {
      label: '考号：',
      kind: 'squares' as const,
      length: 8,
    };

    let fields = addInformationField([], first);
    fields = addInformationField(fields, second);

    expect(fields).toEqual([first, second]);
    expect(moveInformationField(fields, 1, 'up')).toEqual([second, first]);
    expect(moveInformationField(fields, 0, 'up')).toEqual(fields);

    fields = replaceInformationField(fields, 0, third);
    expect(fields).toEqual([third, second]);
    expect(removeInformationField(fields, 1)).toEqual([third]);
  });

  it('adds, removes, moves, and replaces notice items', () => {
    const first = createNoticeBlock('第一条');
    const second = createNoticeBlock('第二条');
    const third = createNoticeBlock('第三条');

    let notices = addNotice([], first);
    notices = addNotice(notices, second);

    expect(notices).toEqual([first, second]);
    expect(moveNotice(notices, 1, 'up')).toEqual([second, first]);
    expect(moveNotice(notices, 0, 'up')).toEqual(notices);

    notices = replaceNotice(notices, 0, [third, first]);
    expect(notices).toEqual([third, first, second]);
    expect(removeNotice(notices, 1)).toEqual([third, second]);
  });

  it('commits notice drafts only on final submission', () => {
    const first = createNoticeBlock('第一条');
    const second = createNoticeBlock('第二条');
    const replacement = [createNoticeBlock('新的第一条'), createNoticeBlock('新的第二条')];

    expect(commitNoticeDraft([first, second], 0, [])).toEqual([second]);
    expect(commitNoticeDraft([first, second], 0, replacement)).toEqual([
      replacement[0],
      replacement[1],
      second,
    ]);
  });

  it('turns multiple notice paragraphs into multiple notice items', () => {
    const first = createNoticeBlock('第一条');
    const second = createNoticeBlock('第二条');
    const replacement = parseRichContentInput('第一段\n\n第二段').blocks;

    expect(commitNoticeDraft([first, second], 0, replacement)).toEqual([
      {
        type: 'paragraph',
        children: [{ type: 'text', text: '第一段' }],
      },
      {
        type: 'paragraph',
        children: [{ type: 'text', text: '第二段' }],
      },
      second,
    ]);
  });

  it('reviews additive score marks against question points', () => {
    const createId = sequenceIdFactory();
    const question = createDefaultQuestion('singleChoice', createId);

    question.points = 10;
    question.scoreMode = 'additive';
    question.scoreMarks = [
      { id: 'score-1', points: 4, description: [{ type: 'text', text: '步骤' }] },
      { id: 'score-2', points: 6, description: [{ type: 'text', text: '结论' }] },
    ];

    expect(reviewQuestionScoreMarks(question)).toEqual([]);

    question.scoreMarks = [
      { id: 'score-1', points: 4, description: [{ type: 'text', text: '步骤' }] },
    ];

    expect(reviewQuestionScoreMarks(question)).toContainEqual(
      expect.objectContaining({ code: 'score_total_mismatch' }),
    );

    question.scoreMarks = [{ id: 'score-1', points: 0, description: [] }];

    expect(reviewQuestionScoreMarks(question)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'zero_additive_score_mark' }),
        expect.objectContaining({ code: 'empty_score_note' }),
      ]),
    );
  });

  it('reviews score levels by maximum points', () => {
    const createId = sequenceIdFactory();
    const question = createDefaultQuestion('blank', createId);

    question.points = 4;
    question.scoreMode = 'levels';
    question.scoreMarks = [
      {
        id: 'score-0',
        points: 0,
        description: [{ type: 'text', text: '没有有效步骤' }],
      },
      { id: 'score-2', points: 2, description: [{ type: 'text', text: '思路正确' }] },
      { id: 'score-4', points: 4, description: [{ type: 'text', text: '完整正确' }] },
    ];

    expect(reviewQuestionScoreMarks(question)).toEqual([
      expect.objectContaining({ code: 'score_level_order' }),
    ]);

    question.scoreMarks![2] = { id: 'score-3', points: 3, description: [] };

    expect(reviewQuestionScoreMarks(question)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'score_level_max_mismatch' }),
        expect.objectContaining({ code: 'empty_score_note' }),
      ]),
    );
    expect(reviewQuestionScoreMarks(question)).not.toContainEqual(
      expect.objectContaining({ code: 'zero_additive_score_mark' }),
    );
  });

  it('reviews score marks when question points are missing or zero', () => {
    const createId = sequenceIdFactory();
    const question = createDefaultQuestion('singleChoice', createId);

    question.points = 0;
    question.scoreMarks = [
      { id: 'score-1', points: 1, description: [{ type: 'text', text: '答案正确' }] },
    ];

    expect(reviewQuestionScoreMarks(question)).toContainEqual(
      expect.objectContaining({ code: 'score_points_missing' }),
    );
  });

  it('reviews subquestion score marks and partial scoring coverage', () => {
    const createId = sequenceIdFactory();
    const question = createDefaultQuestion('problem', createId);
    const firstItem = createSubquestionWithScore('sub-1', 4);
    const secondItem = createSubquestionWithScore('sub-2', 6);

    question.points = 10;
    question.subQuestionGroup = {
      exportAs: 'enumerate',
      listKind: 'enumerate',
      items: [firstItem, secondItem],
    };

    expect(reviewQuestionScoreMarks(question)).toEqual([]);

    firstItem.scoreMarks = [
      { id: 'score-sub-1', points: 3, description: [{ type: 'text', text: '步骤' }] },
    ];

    expect(reviewQuestionScoreMarks(question)).toContainEqual(
      expect.objectContaining({ code: 'subquestion_score_total_mismatch' }),
    );

    secondItem.scoreMarks = [];

    expect(reviewQuestionScoreMarks(question)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'subquestion_score_total_mismatch' }),
        expect.objectContaining({ code: 'partial_subquestion_score_marks' }),
      ]),
    );

    firstItem.scoreMarks = [];

    expect(reviewQuestionScoreMarks(question)).toEqual([]);
  });

  it('migrates whole problem score marks into the first subquestion', () => {
    const createId = sequenceIdFactory();
    const question = createDefaultQuestion('problem', createId);
    const subQuestion = createSubQuestion(createId);

    question.scoreMode = 'levels';
    question.scoreMarks = [
      { id: 'score-total', points: 4, description: [{ type: 'text', text: '完整正确' }] },
    ];

    const result = addSubQuestionToProblem(question, subQuestion);

    expect(result.migratedWholeScoreMarks).toBe(true);
    expect(result.question.scoreMarks).toEqual([]);
    expect(result.question.scoreMode).toBeUndefined();
    expect(result.question.subQuestionGroup?.items[0]).toMatchObject({
      scoreMode: 'levels',
      scoreMarks: [
        {
          id: 'score-total',
          points: 4,
          description: [{ type: 'text', text: '完整正确' }],
        },
      ],
    });
  });

  it('moves, duplicates, and removes subquestions with fresh nested ids', () => {
    const createId = sequenceIdFactory();
    const question = createDefaultQuestion('problem', createId);
    const first = createSubQuestion(createId);
    const second = createSubQuestion(createId);
    first.scoreMarks = [createScoreMark(createId)];
    question.subQuestionGroup = {
      exportAs: 'enumerate',
      listKind: 'enumerate',
      items: [first, second],
    };

    const moved = moveSubQuestion(question, second.id, 'up');
    expect(moved.subQuestionGroup?.items.map((item) => item.id)).toEqual([second.id, first.id]);
    expect(moveSubQuestion(moved, second.id, 'up')).toBe(moved);

    const duplicated = duplicateSubQuestionWithResult(moved, first.id, createId);
    expect(duplicated.subQuestionId).not.toBeNull();
    expect(duplicated.question.subQuestionGroup?.items.map((item) => item.id)).toEqual([
      second.id,
      first.id,
      duplicated.subQuestionId,
    ]);
    expect(duplicated.question.subQuestionGroup?.items[2]?.scoreMarks?.[0]?.id).not.toBe(
      first.scoreMarks[0]!.id,
    );

    const removed = removeSubQuestion(duplicated.question, duplicated.subQuestionId!);
    expect(removed.subQuestionGroup?.items.map((item) => item.id)).toEqual([second.id, first.id]);
  });

  it('updates a subquestion by stable id', () => {
    const createId = sequenceIdFactory();
    const first = createSubQuestion(createId);
    const second = createSubQuestion(createId);
    const question = addSubQuestionToProblem(
      addSubQuestionToProblem(createDefaultQuestion('problem', createId), first).question,
      second,
    ).question;

    const updated = updateSubQuestion(question, first.id, (item) => ({
      ...item,
      stem: parseRichContentInput('更新后的小题').blocks,
    }));

    expect(updated.subQuestionGroup?.items[0]?.stem).toEqual(
      parseRichContentInput('更新后的小题').blocks,
    );
    expect(updated.subQuestionGroup?.items[1]).toEqual(second);
    expect(updateSubQuestion(updated, 'missing', (item) => item)).toBe(updated);
  });

  it('creates valid round-trippable built-in templates', () => {
    for (const template of examDocumentTemplates) {
      const document = createExamDocumentFromTemplate(template.id, sequenceIdFactory());

      expect(parseExamDocument(document).schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
      expect(deserializeExamDocument(serializeExamDocument(document))).toEqual(document);
    }
  });
});

function sequenceIdFactory() {
  let nextId = 1;
  return (prefix: string) => `${prefix}-${nextId++}`;
}

function createSubquestionWithScore(id: string, points: number) {
  return {
    id,
    stem: [],
    scoreMarks: [
      {
        id: `score-${id}`,
        points,
        description: [{ type: 'text' as const, text: '说明' }],
      },
    ],
  };
}
