import { createEmptyExamDocument } from './defaults';
import { createFullMathExamTemplate } from './full-math-exam-template';
import {
  createBlankSlot,
  createChoiceOption,
  createDefaultQuestion,
  createDefaultSection,
  createScoreMark,
  createSubQuestion,
  paragraphBlocks,
  type CreateId,
} from './editor';
import type {
  ExamDocument,
  ExamQuestion,
  ExamSection,
  InformationField,
  RichContentBlock,
} from './model';
import { parseRichContentInput } from './rich-content';
import { parseInlineRichText } from './teacher-content';

export type ExamDocumentTemplateId =
  'blank-math' | 'math-quiz' | 'math-basic' | 'math-teacher' | 'math-showcase' | 'math-full-exam';

export type ExamDocumentTemplateCategory = 'starter' | 'example';

export interface ExamDocumentTemplate {
  id: ExamDocumentTemplateId;
  category: ExamDocumentTemplateCategory;
  name: string;
  description: string;
}

export const examDocumentTemplates: ExamDocumentTemplate[] = [
  {
    id: 'blank-math',
    category: 'starter',
    name: '空白数学试卷',
    description: '只包含基础试卷信息，适合从零开始编辑。',
  },
  {
    id: 'math-quiz',
    category: 'starter',
    name: '数学随堂小测',
    description: '卷面作答，预建常见空节和科目下方信息栏。',
  },
  {
    id: 'math-basic',
    category: 'starter',
    name: '标准数学试卷（独立答题卷）',
    description: '保留填空黑三角，预建标准卷首和常见空节。',
  },
  {
    id: 'math-teacher',
    category: 'example',
    name: '教师版示例',
    description: '包含答案、解析和评分点，用于检查教师版输出。',
  },
  {
    id: 'math-showcase',
    category: 'example',
    name: '综合功能示例',
    description: '展示当前稳定的卷首、题型、排版和教师内容能力。',
  },
  {
    id: 'math-full-exam',
    category: 'example',
    name: '高中数学完整试卷示例',
    description: '包含 19 题、答案、解析和评分方案，用于完整试卷学习与压力验证。',
  },
];

export function createExamDocumentFromTemplate(
  templateId: ExamDocumentTemplateId,
  createId: CreateId,
): ExamDocument {
  switch (templateId) {
    case 'blank-math':
      return createBlankMathTemplate(createId);
    case 'math-quiz':
      return createMathQuizTemplate(createId);
    case 'math-basic':
      return createMathBasicTemplate(createId);
    case 'math-teacher':
      return createMathTeacherTemplate(createId);
    case 'math-showcase':
      return createMathShowcaseTemplate(createId);
    case 'math-full-exam':
      return createFullMathExamTemplate(createId);
  }
}

function createBlankMathTemplate(createId: CreateId): ExamDocument {
  const document = createMathDocument(createId, '未命名数学试卷', 120);
  document.setup.answerMode = 'student';
  return document;
}

function createMathQuizTemplate(createId: CreateId): ExamDocument {
  const document = createMathDocument(createId, '数学随堂小测', 45);
  document.frontMatter.informationFields = createStudentInformationFields();
  document.frontMatter.informationPlacement = 'belowSubject';
  document.setup.fillin = {
    examZhOptions: {
      'no-answer-type': 'none',
    },
  };
  document.sections = createEmptyMathSections(createId);
  return document;
}

function createMathBasicTemplate(createId: CreateId): ExamDocument {
  const document = createMathDocument(createId, '数学试卷', 120);
  applyStandardAnswerSheetFrontMatter(document);
  document.sections = createEmptyMathSections(createId);
  return document;
}

function createMathTeacherTemplate(createId: CreateId): ExamDocument {
  const document = createMathDocument(createId, '数学试卷（教师版示例）', 120);
  document.metadata.totalPoints = 20;
  document.setup.answerMode = 'teacher';
  document.setup.examZhOptions = { 'paren/text-color': 'red' };
  applyStandardAnswerSheetFrontMatter(document);
  document.sections = [
    createTeacherChoiceSection(createId),
    createTeacherBlankSection(createId),
    createTeacherProblemSection(createId),
  ];
  return document;
}

function createMathShowcaseTemplate(createId: CreateId): ExamDocument {
  const document = createMathDocument(createId, '数学试卷（综合功能示例）', 90);
  document.metadata.totalPoints = 34;
  document.setup = {
    answerMode: 'teacher',
    choices: { maxColumns: 2 },
    judgement: { answerColor: 'red' },
    examZhOptions: { 'paren/text-color': 'red' },
  };
  document.frontMatter = {
    secret: true,
    warning: '本试卷为功能示例',
    informationFields: createStudentInformationFields(),
    informationPlacement: 'belowSubject',
    notices: [
      ...paragraphBlocks('答题前请检查试卷是否完整。'),
      ...paragraphBlocks('请在规定位置填写答案，并写出必要的解题过程。'),
    ],
  };
  document.sections = [
    createShowcaseSingleChoiceSection(createId),
    createShowcaseMultipleChoiceSection(createId),
    createShowcaseBlankSection(createId),
    createShowcaseJudgementSection(createId),
    createShowcaseProblemSection(createId),
  ];
  return document;
}

function createMathDocument(
  createId: CreateId,
  title: string,
  durationMinutes: number,
): ExamDocument {
  const document = createEmptyExamDocument(createId('document'));
  document.metadata = {
    ...document.metadata,
    title,
    subject: '数学',
    durationMinutes,
  };
  document.setup.answerMode = 'student';
  return document;
}

function createEmptyMathSections(createId: CreateId): ExamSection[] {
  return [
    createDefaultSection(createId, 'singleChoice'),
    createDefaultSection(createId, 'blank'),
    createDefaultSection(createId, 'problem'),
  ];
}

function createStudentInformationFields(): InformationField[] {
  return [
    { label: '姓名：', kind: 'line', width: '6em' },
    { label: '班级：', kind: 'line', width: '6em' },
  ];
}

function applyStandardAnswerSheetFrontMatter(document: ExamDocument): void {
  document.frontMatter.secret = true;
  document.frontMatter.notices = [
    ...paragraphBlocks('答题前请检查试卷和答题卡是否完整。'),
    ...paragraphBlocks('请将答案填写在答题卡指定位置。'),
  ];
}

function createTeacherChoiceSection(createId: CreateId): ExamSection {
  const section = createDefaultSection(createId, 'singleChoice');
  const question = createChoiceQuestion(
    createId,
    'singleChoice',
    '设集合 $A=\\{1,2\\}$，则 $A$ 的元素个数是',
    ['1', '2', '3', '4'],
    [1],
  );
  question.points = 5;
  question.solution = paragraphBlocks('根据集合元素个数可得答案。');
  question.scoreMode = 'additive';
  question.scoreMarks = [describedScoreMark(createId, 5, '答案正确')];
  section.questions = [question];
  return section;
}

function createTeacherBlankSection(createId: CreateId): ExamSection {
  const section = createDefaultSection(createId, 'blank');
  const question = createDefaultQuestion('blank', createId);
  const blank = question.blanks![0]!;

  question.points = 5;
  question.stem = [
    {
      type: 'paragraph',
      children: [
        { type: 'text', text: '函数 ' },
        { type: 'inlineMath', latex: 'f(x)=x+1' },
        { type: 'text', text: ' 在 ' },
        { type: 'inlineMath', latex: 'x=0' },
        { type: 'text', text: ' 处的值为' },
        { type: 'blankRef', blankId: blank.id },
      ],
    },
  ];
  blank.answer = richBlocks('$f(0)=1$');
  question.solution = richBlocks('代入 $x=0$ 可得 $f(0)=1$。');
  question.scoreMode = 'additive';
  question.scoreMarks = [describedScoreMark(createId, 5, '计算正确')];
  section.questions = [question];
  return section;
}

function createTeacherProblemSection(createId: CreateId): ExamSection {
  const section = createDefaultSection(createId, 'problem');
  const question = createDefaultQuestion('problem', createId);
  const firstItem = createSubQuestion(createId);
  const secondItem = createSubQuestion(createId);

  question.points = 10;
  question.stem = richBlocks('已知数列 $a_n=n$。');
  question.solution = paragraphBlocks('分步作答即可。');
  firstItem.stem = richBlocks('求 $a_1$。');
  firstItem.solution = richBlocks('由 $a_n=n$ 得 $a_1=1$。');
  firstItem.scoreMode = 'additive';
  firstItem.scoreMarks = [describedScoreMark(createId, 4, '写出首项')];
  secondItem.stem = richBlocks('求前 $3$ 项和。');
  secondItem.solution = richBlocks('$1+2+3=6$。');
  secondItem.scoreMode = 'additive';
  secondItem.scoreMarks = [describedScoreMark(createId, 6, '求和正确')];
  question.subQuestionGroup = {
    exportAs: 'enumerate',
    listKind: 'enumerate',
    items: [firstItem, secondItem],
  };
  section.questions = [question];
  return section;
}

function createShowcaseSingleChoiceSection(createId: CreateId): ExamSection {
  const section = createDefaultSection(createId, 'singleChoice');
  const question = createChoiceQuestion(
    createId,
    'singleChoice',
    '方程 $x^2-1=0$ 的正根是{{选择括号}}',
    ['-2', '-1', '0', '1'],
    [3],
  );
  question.points = 4;
  question.solution = richBlocks('由 $(x-1)(x+1)=0$，正根为 $x=1$。');
  question.scoreMode = 'additive';
  question.scoreMarks = [describedScoreMark(createId, 4, '选择正确')];
  section.questions = [question];
  return section;
}

function createShowcaseMultipleChoiceSection(createId: CreateId): ExamSection {
  const section = createDefaultSection(createId, 'multipleChoice');
  const question = createChoiceQuestion(
    createId,
    'multipleChoice',
    '下列函数中，在定义域内为增函数的是',
    ['$y=x$', '$y=x^3$', '$y=-x$', '$y=x^2$'],
    [0, 1],
  );
  question.points = 6;
  question.choicesSetup = { examZhOptions: { label: '\\circlednumber*' } };
  question.solution = richBlocks('一次函数 $y=x$ 与三次函数 $y=x^3$ 均为增函数。');
  question.scoreMode = 'additive';
  question.scoreMarks = [describedScoreMark(createId, 6, '全部选择正确')];
  section.questions = [question];
  return section;
}

function createShowcaseBlankSection(createId: CreateId): ExamSection {
  const section = createDefaultSection(createId, 'blank');
  const question = createDefaultQuestion('blank', createId);
  const firstBlank = question.blanks![0]!;
  const secondBlank = createBlankSlot(createId);

  question.points = 8;
  question.blanks = [firstBlank, secondBlank];
  question.stem = [
    {
      type: 'paragraph',
      children: [
        { type: 'text', text: '若 ' },
        { type: 'inlineMath', latex: 'a+b=5' },
        { type: 'text', text: '，' },
        { type: 'inlineMath', latex: 'ab=6' },
        { type: 'text', text: '，则 ' },
        { type: 'inlineMath', latex: 'a^2+b^2=' },
        { type: 'blankRef', blankId: firstBlank.id },
        { type: 'text', text: '，' },
        { type: 'inlineMath', latex: '(a-b)^2=' },
        { type: 'blankRef', blankId: secondBlank.id },
        { type: 'text', text: '。' },
      ],
    },
  ];
  firstBlank.answer = richBlocks('$13$');
  secondBlank.answer = richBlocks('$1$');
  question.solution = richBlocks('由 $a^2+b^2=(a+b)^2-2ab=13$，$(a-b)^2=(a+b)^2-4ab=1$。');
  question.scoreMode = 'additive';
  question.scoreMarks = [
    describedScoreMark(createId, 4, '第一空正确'),
    describedScoreMark(createId, 4, '第二空正确'),
  ];
  section.questions = [question];
  return section;
}

function createShowcaseJudgementSection(createId: CreateId): ExamSection {
  const section = createDefaultSection(createId, 'judgement');
  const textQuestion = createDefaultQuestion('judgement', createId);
  const symbolQuestion = createDefaultQuestion('judgement', createId);

  textQuestion.points = 2;
  textQuestion.stem = richBlocks('等腰三角形的两个底角相等。');
  textQuestion.judgement = { correctAnswer: true };
  textQuestion.solution = richBlocks('等腰三角形的两个底角相等，因此命题正确。');
  textQuestion.scoreMode = 'additive';
  textQuestion.scoreMarks = [describedScoreMark(createId, 2, '判断正确')];

  symbolQuestion.points = 2;
  symbolQuestion.stem = [
    {
      type: 'paragraph',
      children: [
        { type: 'text', text: '若 ' },
        { type: 'inlineMath', latex: 'a^2=b^2' },
        { type: 'text', text: '，则必有 ' },
        { type: 'inlineMath', latex: 'a=b' },
        { type: 'text', text: '。' },
        { type: 'judgementRef' },
      ],
    },
  ];
  symbolQuestion.judgement = {
    correctAnswer: false,
    answerStyle: 'symbol',
    placement: 'inline',
  };
  symbolQuestion.solution = richBlocks('由 $a^2=b^2$ 只能得到 $a=\\pm b$，因此命题错误。');
  symbolQuestion.scoreMode = 'additive';
  symbolQuestion.scoreMarks = [describedScoreMark(createId, 2, '判断正确')];

  section.questions = [textQuestion, symbolQuestion];
  return section;
}

function createShowcaseProblemSection(createId: CreateId): ExamSection {
  const section = createDefaultSection(createId, 'problem');
  const question = createDefaultQuestion('problem', createId);
  const firstItem = createSubQuestion(createId);
  const secondItem = createSubQuestion(createId);

  question.points = 12;
  question.stem = richBlocks('已知函数 $f(x)=x^2-2x$。');
  question.solution = paragraphBlocks('结合配方法和函数图像性质作答。');
  firstItem.stem = richBlocks('求函数 $f(x)$ 的对称轴。');
  firstItem.solution = richBlocks('$f(x)=(x-1)^2-1$，故对称轴为 $x=1$。');
  firstItem.scoreMode = 'additive';
  firstItem.scoreMarks = [
    describedScoreMark(createId, 2, '正确配方'),
    describedScoreMark(createId, 4, '写出对称轴'),
  ];
  secondItem.stem = richBlocks('求函数在区间 $[0,2]$ 上的最小值。');
  secondItem.solution = richBlocks('当 $x=1$ 时，函数取得最小值 $-1$。');
  secondItem.scoreMode = 'additive';
  secondItem.scoreMarks = [
    describedScoreMark(createId, 3, '确定最小值点'),
    describedScoreMark(createId, 3, '写出最小值'),
  ];
  question.subQuestionGroup = {
    exportAs: 'enumerate',
    listKind: 'enumerate',
    items: [firstItem, secondItem],
  };
  section.questions = [question];
  return section;
}

function createChoiceQuestion(
  createId: CreateId,
  type: 'singleChoice' | 'multipleChoice',
  stem: string,
  choices: string[],
  correctIndexes: number[],
): ExamQuestion {
  const question = createDefaultQuestion(type, createId);
  question.stem = richBlocks(stem);
  question.choices = choices.map((value, index) => ({
    ...createChoiceOption(createId, String.fromCharCode(65 + index)),
    content: richBlocks(value),
  }));
  question.correctChoiceIds = correctIndexes.map((index) => question.choices![index]!.id);
  return question;
}

function describedScoreMark(createId: CreateId, points: number, description: string) {
  return {
    ...createScoreMark(createId),
    points,
    description: parseInlineRichText(description),
  };
}

function richBlocks(input: string): RichContentBlock[] {
  return parseRichContentInput(input).blocks;
}
