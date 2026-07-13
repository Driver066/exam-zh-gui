import { CURRENT_SCHEMA_VERSION, type ExamDocument, type ExamQuestion } from './model';

export function createEmptyExamDocument(documentId: string): ExamDocument {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    documentId,
    metadata: {
      title: '未命名试卷',
      subject: '数学',
    },
    setup: {
      answerMode: 'student',
    },
    frontMatter: {
      informationFields: [],
      notices: [],
    },
    sections: [],
    assets: [],
  };
}

export function createRawLatexQuestion(id: string, rawLatex: string): ExamQuestion {
  return {
    id,
    type: 'rawLatex',
    stem: [],
    rawLatex,
  };
}
