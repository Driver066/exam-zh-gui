import { describe, expect, it } from 'vitest';

import {
  calculateDocumentStats,
  calculateTotalPointsMismatch,
  createDefaultQuestion,
  createDefaultSection,
  createNoticeBlock,
  createScoreMark,
  createSubQuestion,
  reviewQuestionScoreMarks,
  type CreateId,
} from '../../shared/document';
import { createEmptyExamDocument } from '../../shared/document/factory';
import {
  applyEditorPreviewDraft,
  clearRichContentPreviewDraft,
  clearTextPreviewDraft,
  createEditorPreviewDraft,
  setChoiceLabelPreviewDraft,
  setNoticePreviewDraft,
  setNumberPreviewDraft,
  setRichContentPreviewDraft,
  setTextPreviewDraft,
  type RichContentPreviewDraft,
} from './editor-preview-draft';

describe('editor preview draft overlay', () => {
  it('applies notice drafts without mutating the formal document', () => {
    const document = createEmptyExamDocument('doc-preview-notice');
    const originalNotice = createNoticeBlock('原注意事项');
    const previewNotice = createNoticeBlock('预览注意事项');

    document.frontMatter.notices = [originalNotice];

    const previewDocument = applyEditorPreviewDraft(
      document,
      setNoticePreviewDraft(createEditorPreviewDraft(), { index: 0, blocks: [previewNotice] }),
    );

    expect(previewDocument?.frontMatter.notices).toEqual([previewNotice]);
    expect(document.frontMatter.notices).toEqual([originalNotice]);
  });

  it('applies rich content drafts without mutating the formal document', () => {
    const createId = sequenceIdFactory();
    const document = createEmptyExamDocument('doc-preview-rich-content');
    const section = createDefaultSection(createId, 'singleChoice');
    const question = createDefaultQuestion('singleChoice', createId);
    const subQuestion = createSubQuestion(createId);
    const draftBlock = createNoticeBlock('草稿内容');

    question.subQuestionGroup = {
      exportAs: 'enumerate',
      listKind: 'enumerate',
      items: [subQuestion],
    };
    section.questions = [question];
    document.sections = [section];

    const richContentDrafts: RichContentPreviewDraft[] = [
      {
        target: { kind: 'questionStem', questionId: question.id },
        blocks: [draftBlock],
      },
      {
        target: {
          kind: 'choiceContent',
          questionId: question.id,
          choiceId: question.choices![0]!.id,
        },
        blocks: [draftBlock],
      },
      {
        target: {
          kind: 'subQuestionSolution',
          questionId: question.id,
          subQuestionId: subQuestion.id,
        },
        blocks: [draftBlock],
      },
    ];

    const previewDocument = applyEditorPreviewDraft(
      document,
      richContentDrafts.reduce(
        (draft, richContentDraft) => setRichContentPreviewDraft(draft, richContentDraft),
        createEditorPreviewDraft(),
      ),
    );
    const previewQuestion = previewDocument!.sections[0]!.questions[0]!;

    expect(previewQuestion.stem).toEqual([draftBlock]);
    expect(previewQuestion.choices?.[0]?.content).toEqual([draftBlock]);
    expect(previewQuestion.subQuestionGroup?.items[0]?.solution).toEqual([draftBlock]);
    expect(question.stem).not.toEqual([draftBlock]);
    expect(question.choices?.[0]?.content).not.toEqual([draftBlock]);
    expect(subQuestion.solution).not.toEqual([draftBlock]);
  });

  it('applies blank answer rich content drafts without mutating the formal document', () => {
    const createId = sequenceIdFactory();
    const document = createEmptyExamDocument('doc-preview-blank-answer');
    const section = createDefaultSection(createId, 'blank');
    const question = createDefaultQuestion('blank', createId);
    const blankId = question.blanks![0]!.id;
    const draftBlock = createNoticeBlock('草稿答案');

    section.questions = [question];
    document.sections = [section];

    const previewDocument = applyEditorPreviewDraft(
      document,
      setRichContentPreviewDraft(createEditorPreviewDraft(), {
        target: { kind: 'blankAnswer', questionId: question.id, blankId },
        blocks: [draftBlock],
      }),
    );
    const previewQuestion = previewDocument!.sections[0]!.questions[0]!;

    expect(previewQuestion.blanks?.[0]?.answer).toEqual([draftBlock]);
    expect(question.blanks?.[0]?.answer).toBeUndefined();
  });

  it('clears rich content drafts by target', () => {
    const target = { kind: 'questionStem' as const, questionId: 'question-1' };
    const draft = setRichContentPreviewDraft(createEditorPreviewDraft(), {
      target,
      blocks: [createNoticeBlock('草稿')],
    });

    expect(clearRichContentPreviewDraft(draft, target).richContents).toEqual([]);
  });

  it('applies metadata text drafts without mutating the formal document', () => {
    const document = createEmptyExamDocument('doc-preview-metadata-text');

    document.metadata.title = '正式标题';
    document.metadata.grade = '初一';

    const draftWithTitle = setTextPreviewDraft(createEditorPreviewDraft(), {
      target: { kind: 'metadataText', field: 'title' },
      value: '草稿标题',
    });
    const draftWithTitleAndGrade = setTextPreviewDraft(draftWithTitle, {
      target: { kind: 'metadataText', field: 'grade' },
      value: '',
    });
    const previewDocument = applyEditorPreviewDraft(document, draftWithTitleAndGrade);

    expect(previewDocument?.metadata.title).toBe('草稿标题');
    expect(previewDocument?.metadata.grade).toBeUndefined();
    expect(document.metadata.title).toBe('正式标题');
    expect(document.metadata.grade).toBe('初一');
  });

  it('applies front matter information field drafts without mutating the formal document', () => {
    const document = createEmptyExamDocument('doc-preview-information-field');

    document.frontMatter.informationFields = [
      { label: '姓名：', kind: 'line', width: '6em' },
      { label: '班级：', kind: 'line', width: '6em' },
    ];

    const target = { kind: 'informationFieldLabel' as const, index: 0 };
    const draft = setTextPreviewDraft(createEditorPreviewDraft(), {
      target,
      value: '考生姓名：',
    });
    const previewDocument = applyEditorPreviewDraft(document, draft);

    expect(previewDocument?.frontMatter.informationFields[0]?.label).toBe('考生姓名：');
    expect(previewDocument?.frontMatter.informationFields[1]?.label).toBe('班级：');
    expect(document.frontMatter.informationFields[0]?.label).toBe('姓名：');
    expect(clearTextPreviewDraft(draft, target).texts).toEqual([]);
  });

  it('applies front matter warning drafts without mutating the formal document', () => {
    const document = createEmptyExamDocument('doc-preview-warning');
    document.frontMatter.warning = '正式警告语';

    const target = { kind: 'frontMatterWarning' as const };
    const draft = setTextPreviewDraft(createEditorPreviewDraft(), {
      target,
      value: '草稿警告语',
    });
    const previewDocument = applyEditorPreviewDraft(document, draft);

    expect(previewDocument?.frontMatter.warning).toBe('草稿警告语');
    expect(document.frontMatter.warning).toBe('正式警告语');
    expect(clearTextPreviewDraft(draft, target).texts).toEqual([]);

    const clearedWarningDraft = setTextPreviewDraft(createEditorPreviewDraft(), {
      target,
      value: '   ',
    });
    const previewWithoutWarning = applyEditorPreviewDraft(document, clearedWarningDraft);

    expect(previewWithoutWarning?.frontMatter.warning).toBeUndefined();
    expect(document.frontMatter.warning).toBe('正式警告语');
  });

  it('applies section title drafts and clears them by target', () => {
    const createId = sequenceIdFactory();
    const document = createEmptyExamDocument('doc-preview-section-text');
    const section = createDefaultSection(createId, 'problem');
    const target = { kind: 'sectionTitle' as const, sectionId: section.id };
    const draft = setTextPreviewDraft(createEditorPreviewDraft(), {
      target,
      value: '草稿解答题',
    });

    section.title = '正式解答题';
    document.sections = [section];

    const previewDocument = applyEditorPreviewDraft(document, draft);

    expect(previewDocument?.sections[0]?.title).toBe('草稿解答题');
    expect(document.sections[0]?.title).toBe('正式解答题');
    expect(clearTextPreviewDraft(draft, target).texts).toEqual([]);
  });

  it('applies choice label drafts without rewriting stable ids or answer keys', () => {
    const createId = sequenceIdFactory();
    const document = createEmptyExamDocument('doc-preview-choice');
    const section = createDefaultSection(createId, 'multipleChoice');
    const question = createDefaultQuestion('multipleChoice', createId);

    const [firstChoice, , thirdChoice] = question.choices!;
    question.correctChoiceIds = [thirdChoice!.id, firstChoice!.id];
    section.questions = [question];
    document.sections = [section];

    const previewDocument = applyEditorPreviewDraft(
      document,
      setChoiceLabelPreviewDraft(createEditorPreviewDraft(), {
        questionId: question.id,
        choiceId: firstChoice!.id,
        value: '甲',
      }),
    );
    const previewQuestion = previewDocument?.sections[0]?.questions[0];

    expect(previewQuestion?.choices?.[0]).toMatchObject({ id: firstChoice!.id, label: '甲' });
    expect(previewQuestion?.correctChoiceIds).toEqual([thirdChoice!.id, firstChoice!.id]);
    expect(question.choices?.[0]).toMatchObject({ id: firstChoice!.id, label: 'A' });
  });

  it('applies question point drafts to stats and total mismatch checks', () => {
    const createId = sequenceIdFactory();
    const document = createEmptyExamDocument('doc-preview-points');
    const section = createDefaultSection(createId, 'problem');
    const question = createDefaultQuestion('problem', createId);

    question.points = 5;
    section.questions = [question];
    document.sections = [section];
    document.metadata.totalPoints = 8;

    const previewDocument = applyEditorPreviewDraft(
      document,
      setNumberPreviewDraft(createEditorPreviewDraft(), {
        target: { kind: 'questionPoints', questionId: question.id },
        value: '8',
      }),
    );

    expect(calculateDocumentStats(previewDocument!)).toMatchObject({ totalPoints: 8 });
    expect(calculateTotalPointsMismatch(previewDocument!)).toBeNull();
    expect(calculateDocumentStats(document)).toMatchObject({ totalPoints: 5 });
  });

  it('applies score mark drafts to problem score review', () => {
    const createId = sequenceIdFactory();
    const document = createEmptyExamDocument('doc-preview-score');
    const section = createDefaultSection(createId, 'problem');
    const question = createDefaultQuestion('problem', createId);
    const firstScore = createScoreMark(createId);
    const secondScore = createScoreMark(createId);

    question.points = 10;
    firstScore.points = 4;
    firstScore.description = [{ type: 'text', text: '步骤一' }];
    secondScore.points = 5;
    secondScore.description = [{ type: 'text', text: '步骤二' }];
    question.scoreMarks = [firstScore, secondScore];
    section.questions = [question];
    document.sections = [section];

    const previewDocument = applyEditorPreviewDraft(
      document,
      setNumberPreviewDraft(createEditorPreviewDraft(), {
        target: {
          kind: 'questionScoreMarkPoints',
          questionId: question.id,
          scoreMarkId: secondScore.id,
        },
        value: '6',
      }),
    );
    const previewQuestion = previewDocument!.sections[0]!.questions[0]!;

    expect(reviewQuestionScoreMarks(question)).toContainEqual(
      expect.objectContaining({ code: 'score_total_mismatch' }),
    );
    expect(reviewQuestionScoreMarks(previewQuestion)).toEqual([]);
  });

  it('applies subquestion score mark drafts to problem score review', () => {
    const createId = sequenceIdFactory();
    const document = createEmptyExamDocument('doc-preview-sub-score');
    const section = createDefaultSection(createId, 'problem');
    const question = createDefaultQuestion('problem', createId);
    const firstSubQuestion = createSubQuestion(createId);
    const secondSubQuestion = createSubQuestion(createId);
    const firstScore = createScoreMark(createId);
    const secondScore = createScoreMark(createId);

    question.points = 10;
    firstScore.points = 4;
    firstScore.description = [{ type: 'text', text: '第 1 小题' }];
    secondScore.points = 5;
    secondScore.description = [{ type: 'text', text: '第 2 小题' }];
    firstSubQuestion.scoreMarks = [firstScore];
    secondSubQuestion.scoreMarks = [secondScore];
    question.subQuestionGroup = {
      exportAs: 'enumerate',
      listKind: 'enumerate',
      items: [firstSubQuestion, secondSubQuestion],
    };
    section.questions = [question];
    document.sections = [section];

    const previewDocument = applyEditorPreviewDraft(
      document,
      setNumberPreviewDraft(createEditorPreviewDraft(), {
        target: {
          kind: 'subQuestionScoreMarkPoints',
          questionId: question.id,
          subQuestionId: secondSubQuestion.id,
          scoreMarkId: secondScore.id,
        },
        value: '6',
      }),
    );
    const previewQuestion = previewDocument!.sections[0]!.questions[0]!;

    expect(reviewQuestionScoreMarks(question)).toContainEqual(
      expect.objectContaining({ code: 'subquestion_score_total_mismatch' }),
    );
    expect(reviewQuestionScoreMarks(previewQuestion)).toEqual([]);
  });

  it('uses commit rules for optional and required number drafts', () => {
    const createId = sequenceIdFactory();
    const document = createEmptyExamDocument('doc-preview-number-rules');
    const section = createDefaultSection(createId, 'problem');
    const question = createDefaultQuestion('problem', createId);

    question.points = 5;
    section.questions = [question];
    document.sections = [section];
    document.metadata.totalPoints = 12;

    const blankMetadataPreview = applyEditorPreviewDraft(
      document,
      setNumberPreviewDraft(createEditorPreviewDraft(), {
        target: { kind: 'metadata', field: 'totalPoints' },
        value: '',
      }),
    );
    const invalidMetadataPreview = applyEditorPreviewDraft(
      document,
      setNumberPreviewDraft(createEditorPreviewDraft(), {
        target: { kind: 'metadata', field: 'totalPoints' },
        value: 'abc',
      }),
    );
    const blankRequiredPreview = applyEditorPreviewDraft(
      document,
      setNumberPreviewDraft(createEditorPreviewDraft(), {
        target: { kind: 'questionPoints', questionId: question.id },
        value: '',
      }),
    );

    expect(blankMetadataPreview?.metadata.totalPoints).toBeUndefined();
    expect(invalidMetadataPreview?.metadata.totalPoints).toBe(12);
    expect(blankRequiredPreview?.sections[0]?.questions[0]?.points).toBe(0);
  });
});

function sequenceIdFactory(): CreateId {
  let index = 0;

  return (prefix) => {
    index += 1;
    return `${prefix}-${index}`;
  };
}
