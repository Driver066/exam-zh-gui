import {
  commitChoiceLabelDraft,
  commitNoticeDraft,
  commitNumberDraft,
  setBlankAnswer,
  type NumberDraftCommitMode,
} from '../../shared/document';
import type {
  ExamDocument,
  ExamQuestion,
  RichContentBlock,
  ScoreMark,
  SubQuestion,
} from '../../shared/document/model';

export type MetadataTextPreviewField =
  'title' | 'subject' | 'grade' | 'semester' | 'author' | 'notes';

export interface NoticePreviewDraft {
  index: number;
  blocks: RichContentBlock[];
}

export interface ChoiceLabelPreviewDraft {
  questionId: string;
  choiceId: string;
  value: string;
}

export type NumberPreviewDraftTarget =
  | { kind: 'metadata'; field: 'durationMinutes' | 'totalPoints' }
  | { kind: 'questionPoints'; questionId: string }
  | { kind: 'questionScoreMarkPoints'; questionId: string; scoreMarkId: string }
  | {
      kind: 'subQuestionScoreMarkPoints';
      questionId: string;
      subQuestionId: string;
      scoreMarkId: string;
    };

export interface NumberPreviewDraft {
  target: NumberPreviewDraftTarget;
  value: string;
}

export type RichContentPreviewDraftTarget =
  | { kind: 'questionStem'; questionId: string }
  | { kind: 'questionSolution'; questionId: string }
  | { kind: 'choiceContent'; questionId: string; choiceId: string }
  | { kind: 'blankAnswer'; questionId: string; blankId: string }
  | { kind: 'subQuestionStem'; questionId: string; subQuestionId: string }
  | { kind: 'subQuestionSolution'; questionId: string; subQuestionId: string };

export interface RichContentPreviewDraft {
  target: RichContentPreviewDraftTarget;
  blocks: RichContentBlock[];
}

export type TextPreviewDraftTarget =
  | { kind: 'metadataText'; field: MetadataTextPreviewField }
  | { kind: 'sectionTitle'; sectionId: string }
  | { kind: 'informationFieldLabel'; index: number }
  | { kind: 'frontMatterWarning' };

export interface TextPreviewDraft {
  target: TextPreviewDraftTarget;
  value: string;
}

export interface EditorPreviewDraft {
  notice: NoticePreviewDraft | null;
  choiceLabels: ChoiceLabelPreviewDraft[];
  numbers: NumberPreviewDraft[];
  richContents: RichContentPreviewDraft[];
  texts: TextPreviewDraft[];
}

export function createEditorPreviewDraft(): EditorPreviewDraft {
  return {
    notice: null,
    choiceLabels: [],
    numbers: [],
    richContents: [],
    texts: [],
  };
}

export function isEditorPreviewDraftEmpty(draft: EditorPreviewDraft): boolean {
  return (
    draft.notice === null &&
    draft.choiceLabels.length === 0 &&
    draft.numbers.length === 0 &&
    draft.richContents.length === 0 &&
    draft.texts.length === 0
  );
}

export function setNoticePreviewDraft(
  draft: EditorPreviewDraft,
  notice: NoticePreviewDraft,
): EditorPreviewDraft {
  return {
    ...draft,
    notice,
  };
}

export function clearNoticePreviewDraft(draft: EditorPreviewDraft): EditorPreviewDraft {
  return draft.notice ? { ...draft, notice: null } : draft;
}

export function setChoiceLabelPreviewDraft(
  draft: EditorPreviewDraft,
  choiceLabel: ChoiceLabelPreviewDraft,
): EditorPreviewDraft {
  const nextChoiceLabels = upsertByKey(draft.choiceLabels, choiceLabel, (item) =>
    choiceLabelDraftKey(item.questionId, item.choiceId),
  );

  return {
    ...draft,
    choiceLabels: nextChoiceLabels,
  };
}

export function clearChoiceLabelPreviewDraft(
  draft: EditorPreviewDraft,
  questionId: string,
  choiceId: string,
): EditorPreviewDraft {
  const key = choiceLabelDraftKey(questionId, choiceId);
  const nextChoiceLabels = draft.choiceLabels.filter(
    (item) => choiceLabelDraftKey(item.questionId, item.choiceId) !== key,
  );

  return nextChoiceLabels.length === draft.choiceLabels.length
    ? draft
    : { ...draft, choiceLabels: nextChoiceLabels };
}

export function setNumberPreviewDraft(
  draft: EditorPreviewDraft,
  numberDraft: NumberPreviewDraft,
): EditorPreviewDraft {
  const nextNumbers = upsertByKey(draft.numbers, numberDraft, (item) =>
    numberDraftTargetKey(item.target),
  );

  return {
    ...draft,
    numbers: nextNumbers,
  };
}

export function clearNumberPreviewDraft(
  draft: EditorPreviewDraft,
  target: NumberPreviewDraftTarget,
): EditorPreviewDraft {
  const key = numberDraftTargetKey(target);
  const nextNumbers = draft.numbers.filter((item) => numberDraftTargetKey(item.target) !== key);

  return nextNumbers.length === draft.numbers.length ? draft : { ...draft, numbers: nextNumbers };
}

export function setRichContentPreviewDraft(
  draft: EditorPreviewDraft,
  richContentDraft: RichContentPreviewDraft,
): EditorPreviewDraft {
  const nextRichContents = upsertByKey(draft.richContents, richContentDraft, (item) =>
    richContentDraftTargetKey(item.target),
  );

  return {
    ...draft,
    richContents: nextRichContents,
  };
}

export function clearRichContentPreviewDraft(
  draft: EditorPreviewDraft,
  target: RichContentPreviewDraftTarget,
): EditorPreviewDraft {
  const key = richContentDraftTargetKey(target);
  const nextRichContents = draft.richContents.filter(
    (item) => richContentDraftTargetKey(item.target) !== key,
  );

  return nextRichContents.length === draft.richContents.length
    ? draft
    : { ...draft, richContents: nextRichContents };
}

export function setTextPreviewDraft(
  draft: EditorPreviewDraft,
  textDraft: TextPreviewDraft,
): EditorPreviewDraft {
  const nextTexts = upsertByKey(draft.texts, textDraft, (item) => textDraftTargetKey(item.target));

  return {
    ...draft,
    texts: nextTexts,
  };
}

export function clearTextPreviewDraft(
  draft: EditorPreviewDraft,
  target: TextPreviewDraftTarget,
): EditorPreviewDraft {
  const key = textDraftTargetKey(target);
  const nextTexts = draft.texts.filter((item) => textDraftTargetKey(item.target) !== key);

  return nextTexts.length === draft.texts.length ? draft : { ...draft, texts: nextTexts };
}

export function applyEditorPreviewDraft(
  document: ExamDocument | null,
  draft: EditorPreviewDraft,
): ExamDocument | null {
  if (!document || isEditorPreviewDraftEmpty(draft)) {
    return document;
  }

  let previewDocument = document;

  if (draft.notice) {
    previewDocument = applyNoticeDraft(previewDocument, draft.notice);
  }

  if (draft.richContents.length > 0) {
    previewDocument = applyRichContentDrafts(previewDocument, draft.richContents);
  }

  if (draft.choiceLabels.length > 0) {
    previewDocument = applyChoiceLabelDrafts(previewDocument, draft.choiceLabels);
  }

  if (draft.numbers.length > 0) {
    previewDocument = applyNumberDrafts(previewDocument, draft.numbers);
  }

  if (draft.texts.length > 0) {
    previewDocument = applyTextDrafts(previewDocument, draft.texts);
  }

  return previewDocument;
}

export function previewNumberDraftValue(
  draftValue: string,
  currentValue: number | undefined,
  mode: NumberDraftCommitMode,
): number | undefined {
  return commitNumberDraft(draftValue, currentValue, mode).value;
}

function applyNoticeDraft(document: ExamDocument, draft: NoticePreviewDraft): ExamDocument {
  if (draft.index < 0 || draft.index >= document.frontMatter.notices.length) {
    return document;
  }

  return {
    ...document,
    frontMatter: {
      ...document.frontMatter,
      notices: commitNoticeDraft(document.frontMatter.notices, draft.index, draft.blocks),
    },
  };
}

function applyRichContentDrafts(
  document: ExamDocument,
  drafts: RichContentPreviewDraft[],
): ExamDocument {
  return {
    ...document,
    sections: document.sections.map((section) => ({
      ...section,
      questions: section.questions.map((question) =>
        applyQuestionRichContentDrafts(question, drafts),
      ),
    })),
  };
}

function applyQuestionRichContentDrafts(
  question: ExamQuestion,
  drafts: RichContentPreviewDraft[],
): ExamQuestion {
  let nextQuestion = question;

  drafts.forEach((draft) => {
    switch (draft.target.kind) {
      case 'questionStem':
        if (draft.target.questionId === nextQuestion.id) {
          nextQuestion = { ...nextQuestion, stem: draft.blocks };
        }
        break;
      case 'questionSolution':
        if (draft.target.questionId === nextQuestion.id) {
          nextQuestion = { ...nextQuestion, solution: draft.blocks };
        }
        break;
      case 'choiceContent':
        if (draft.target.questionId === nextQuestion.id) {
          const choiceId = draft.target.choiceId;
          const blocks = draft.blocks;

          nextQuestion = {
            ...nextQuestion,
            choices: (nextQuestion.choices ?? []).map((choice) =>
              choice.id === choiceId ? { ...choice, content: blocks } : choice,
            ),
          };
        }
        break;
      case 'blankAnswer':
        if (draft.target.questionId === nextQuestion.id) {
          nextQuestion = setBlankAnswer(nextQuestion, draft.target.blankId, draft.blocks);
        }
        break;
      case 'subQuestionStem':
      case 'subQuestionSolution':
        if (draft.target.questionId === nextQuestion.id) {
          nextQuestion = applySubQuestionRichContentDraft(nextQuestion, draft);
        }
        break;
    }
  });

  return nextQuestion;
}

function applySubQuestionRichContentDraft(
  question: ExamQuestion,
  draft: RichContentPreviewDraft,
): ExamQuestion {
  const target = draft.target;

  if (target.kind !== 'subQuestionStem' && target.kind !== 'subQuestionSolution') {
    return question;
  }

  if (!question.subQuestionGroup) {
    return question;
  }

  return {
    ...question,
    subQuestionGroup: {
      ...question.subQuestionGroup,
      items: question.subQuestionGroup.items.map((item) => {
        if (item.id !== target.subQuestionId) {
          return item;
        }

        return target.kind === 'subQuestionStem'
          ? { ...item, stem: draft.blocks }
          : { ...item, solution: draft.blocks };
      }),
    },
  };
}

function applyChoiceLabelDrafts(
  document: ExamDocument,
  drafts: ChoiceLabelPreviewDraft[],
): ExamDocument {
  return {
    ...document,
    sections: document.sections.map((section) => ({
      ...section,
      questions: section.questions.map((question) => {
        let nextQuestion = question;

        drafts
          .filter((draft) => draft.questionId === question.id)
          .forEach((draft) => {
            const choiceIndex =
              nextQuestion.choices?.findIndex((choice) => choice.id === draft.choiceId) ?? -1;

            if (choiceIndex >= 0) {
              nextQuestion = commitChoiceLabelDraft(
                nextQuestion,
                choiceIndex,
                draft.value,
              ).question;
            }
          });

        return nextQuestion;
      }),
    })),
  };
}

function applyNumberDrafts(document: ExamDocument, drafts: NumberPreviewDraft[]): ExamDocument {
  const metadata = { ...document.metadata };

  drafts
    .filter((draft) => draft.target.kind === 'metadata')
    .forEach((draft) => {
      if (draft.target.kind !== 'metadata') {
        return;
      }

      const value = previewNumberDraftValue(draft.value, metadata[draft.target.field], 'optional');

      if (value === undefined) {
        delete metadata[draft.target.field];
      } else {
        metadata[draft.target.field] = value;
      }
    });

  return {
    ...document,
    metadata,
    sections: document.sections.map((section) => ({
      ...section,
      questions: section.questions.map((question) => applyQuestionNumberDrafts(question, drafts)),
    })),
  };
}

function applyQuestionNumberDrafts(
  question: ExamQuestion,
  drafts: NumberPreviewDraft[],
): ExamQuestion {
  let nextQuestion = question;

  drafts.forEach((draft) => {
    switch (draft.target.kind) {
      case 'metadata':
        break;
      case 'questionPoints':
        if (draft.target.questionId === question.id) {
          nextQuestion = {
            ...nextQuestion,
            points: previewNumberDraftValue(draft.value, nextQuestion.points, 'required'),
          };
        }
        break;
      case 'questionScoreMarkPoints':
        if (draft.target.questionId === question.id) {
          nextQuestion = {
            ...nextQuestion,
            scoreMarks: updateScoreMarkPoints(nextQuestion.scoreMarks ?? [], draft),
          };
        }
        break;
      case 'subQuestionScoreMarkPoints':
        if (draft.target.questionId === question.id) {
          nextQuestion = {
            ...nextQuestion,
            subQuestionGroup: nextQuestion.subQuestionGroup
              ? {
                  ...nextQuestion.subQuestionGroup,
                  items: nextQuestion.subQuestionGroup.items.map((item) =>
                    updateSubQuestionScoreMarkPoints(item, draft),
                  ),
                }
              : nextQuestion.subQuestionGroup,
          };
        }
        break;
    }
  });

  return nextQuestion;
}

function updateScoreMarkPoints(scoreMarks: ScoreMark[], draft: NumberPreviewDraft): ScoreMark[] {
  if (
    draft.target.kind !== 'questionScoreMarkPoints' &&
    draft.target.kind !== 'subQuestionScoreMarkPoints'
  ) {
    return scoreMarks;
  }

  const { scoreMarkId } = draft.target;

  return scoreMarks.map((scoreMark) =>
    scoreMark.id === scoreMarkId
      ? {
          ...scoreMark,
          points: previewNumberDraftValue(draft.value, scoreMark.points, 'required') ?? 0,
        }
      : scoreMark,
  );
}

function updateSubQuestionScoreMarkPoints(
  subQuestion: SubQuestion,
  draft: NumberPreviewDraft,
): SubQuestion {
  if (
    draft.target.kind !== 'subQuestionScoreMarkPoints' ||
    subQuestion.id !== draft.target.subQuestionId
  ) {
    return subQuestion;
  }

  return {
    ...subQuestion,
    scoreMarks: updateScoreMarkPoints(subQuestion.scoreMarks ?? [], draft),
  };
}

function applyTextDrafts(document: ExamDocument, drafts: TextPreviewDraft[]): ExamDocument {
  const metadata = { ...document.metadata };
  const frontMatter = { ...document.frontMatter };
  const informationFields = document.frontMatter.informationFields.map((field) => ({ ...field }));

  drafts
    .filter((draft) => draft.target.kind === 'metadataText')
    .forEach((draft) => {
      if (draft.target.kind !== 'metadataText') {
        return;
      }

      applyMetadataTextDraft(metadata, draft.target.field, draft.value);
    });

  drafts
    .filter((draft) => draft.target.kind === 'informationFieldLabel')
    .forEach((draft) => {
      if (draft.target.kind !== 'informationFieldLabel') {
        return;
      }

      const field = informationFields[draft.target.index];

      if (field) {
        field.label = draft.value;
      }
    });

  drafts
    .filter((draft) => draft.target.kind === 'frontMatterWarning')
    .forEach((draft) => {
      if (draft.target.kind !== 'frontMatterWarning') {
        return;
      }

      if (draft.value.trim() === '') {
        delete frontMatter.warning;
      } else {
        frontMatter.warning = draft.value;
      }
    });

  return {
    ...document,
    metadata,
    frontMatter: {
      ...frontMatter,
      informationFields,
    },
    sections: document.sections.map((section) => {
      const sectionTitleDraft = drafts.find(
        (draft) => draft.target.kind === 'sectionTitle' && draft.target.sectionId === section.id,
      );

      return sectionTitleDraft ? { ...section, title: sectionTitleDraft.value } : section;
    }),
  };
}

function applyMetadataTextDraft(
  metadata: ExamDocument['metadata'],
  field: MetadataTextPreviewField,
  value: string,
): void {
  if (isOptionalMetadataTextField(field) && value.trim() === '') {
    delete metadata[field];
    return;
  }

  metadata[field] = value;
}

function isOptionalMetadataTextField(field: MetadataTextPreviewField): boolean {
  return field === 'grade' || field === 'semester' || field === 'author' || field === 'notes';
}

function choiceLabelDraftKey(questionId: string, choiceId: string): string {
  return `${questionId}:${choiceId}`;
}

function numberDraftTargetKey(target: NumberPreviewDraftTarget): string {
  switch (target.kind) {
    case 'metadata':
      return `metadata:${target.field}`;
    case 'questionPoints':
      return `question:${target.questionId}:points`;
    case 'questionScoreMarkPoints':
      return `question:${target.questionId}:score:${target.scoreMarkId}`;
    case 'subQuestionScoreMarkPoints':
      return `question:${target.questionId}:sub:${target.subQuestionId}:score:${target.scoreMarkId}`;
  }
}

function richContentDraftTargetKey(target: RichContentPreviewDraftTarget): string {
  switch (target.kind) {
    case 'questionStem':
    case 'questionSolution':
      return `${target.kind}:${target.questionId}`;
    case 'choiceContent':
      return `${target.kind}:${target.questionId}:${target.choiceId}`;
    case 'blankAnswer':
      return `${target.kind}:${target.questionId}:${target.blankId}`;
    case 'subQuestionStem':
    case 'subQuestionSolution':
      return `${target.kind}:${target.questionId}:${target.subQuestionId}`;
  }
}

function textDraftTargetKey(target: TextPreviewDraftTarget): string {
  switch (target.kind) {
    case 'metadataText':
      return `metadata:${target.field}`;
    case 'sectionTitle':
      return `section:${target.sectionId}:title`;
    case 'informationFieldLabel':
      return `frontMatter:information:${target.index}:label`;
    case 'frontMatterWarning':
      return 'frontMatter:warning';
  }
}

function upsertByKey<T>(items: T[], nextItem: T, keyOf: (item: T) => string): T[] {
  const nextKey = keyOf(nextItem);
  const existingIndex = items.findIndex((item) => keyOf(item) === nextKey);

  if (existingIndex < 0) {
    return [...items, nextItem];
  }

  return items.map((item, index) => (index === existingIndex ? nextItem : item));
}
