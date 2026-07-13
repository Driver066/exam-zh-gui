import { createEmptyExamDocument } from './defaults';
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
  BlankSlot,
  ExamDocument,
  ExamQuestion,
  ExamSection,
  InlineContent,
  RichContentBlock,
  ScoreMark,
  ScoreMode,
  SolutionAnnotation,
  SubQuestion,
} from './model';
import { parseRichContentInput } from './rich-content';
import { parseInlineRichText } from './teacher-content';

interface ChoiceQuestionSpec {
  type: 'singleChoice' | 'multipleChoice';
  stem: string;
  choices: string[];
  correctIndexes: number[];
  points: number;
  solution: string;
  scoreDescription: string;
  maxColumns?: number;
  fixedColumns?: number;
}

interface SubQuestionSpec {
  stem: string;
  solution: string;
  scoreMode?: ScoreMode;
  scoreMarks: Array<{ points: number; description: string }>;
}

export function createFullMathExamTemplate(createId: CreateId): ExamDocument {
  const document = createEmptyExamDocument(createId('document'));

  document.metadata = {
    title: '高中数学完整试卷示例',
    subject: '数学',
    grade: '高三',
    durationMinutes: 120,
    totalPoints: 150,
  };
  document.setup = {
    answerMode: 'teacher',
    choices: { maxColumns: 4 },
    fillin: { answerColor: 'red' },
    examZhOptions: { 'paren/text-color': 'red' },
  };
  document.frontMatter = {
    secret: true,
    informationFields: [
      { label: '姓名：', kind: 'line', width: '5em' },
      { label: '班级：', kind: 'line', width: '5em' },
      { label: '考号：', kind: 'squares', length: 8 },
    ],
    informationPlacement: 'belowSubject',
    notices: [
      ...paragraphBlocks('答题前请检查试卷和答题卡是否完整。'),
      ...paragraphBlocks('请将答案填写在答题卡指定位置，解答题应写出必要过程。'),
    ],
  };
  document.sections = [
    createSingleChoiceSection(createId),
    createMultipleChoiceSection(createId),
    createBlankSection(createId),
    createProblemSection(createId),
  ];

  return document;
}

function createSingleChoiceSection(createId: CreateId): ExamSection {
  const section = createDefaultSection(createId, 'singleChoice');
  const specs: ChoiceQuestionSpec[] = [
    {
      type: 'singleChoice',
      stem: '已知集合 $A=\\{1,2,3\\}$，$B=\\{2,3,4\\}$，则 $A\\cap B=$ {{选择括号}}',
      choices: ['$\\{1,4\\}$', '$\\{2,3\\}$', '$\\{1,2,3\\}$', '$\\{2,3,4\\}$'],
      correctIndexes: [1],
      points: 5,
      solution: '由交集定义，$A$ 与 $B$ 的公共元素为 $2,3$，故 $A\\cap B=\\{2,3\\}$。',
      scoreDescription: '正确求出集合的交集',
    },
    {
      type: 'singleChoice',
      stem: '复数 $z=1+\\sqrt{3}i$ 的模为',
      choices: ['$1$', '$2$', '$\\sqrt{3}$', '$4$'],
      correctIndexes: [1],
      points: 5,
      solution: '$|z|=\\sqrt{1^2+(\\sqrt{3})^2}=2$。',
      scoreDescription: '正确计算复数的模',
    },
    {
      type: 'singleChoice',
      stem: '已知向量 $\\vec a=(1,2)$，$\\vec b=(2,4)$，则',
      choices: [
        '$\\vec a\\parallel\\vec b$',
        '$\\vec a\\perp\\vec b$',
        '$|\\vec a|=|\\vec b|$',
        '$\\vec a+\\vec b=0$',
      ],
      correctIndexes: [0],
      points: 5,
      solution: '因为 $\\vec b=2\\vec a$，所以 $\\vec a\\parallel\\vec b$。',
      scoreDescription: '正确判断向量关系',
    },
    {
      type: 'singleChoice',
      stem: '若 $\\alpha$ 为锐角，且 $\\sin\\alpha=\\dfrac35$，则 $\\cos\\alpha=$',
      choices: ['$-\\dfrac45$', '$-\\dfrac35$', '$\\dfrac35$', '$\\dfrac45$'],
      correctIndexes: [3],
      points: 5,
      solution:
        '由 $\\sin^2\\alpha+\\cos^2\\alpha=1$ 且 $\\alpha$ 为锐角，得 $\\cos\\alpha=\\dfrac45$。',
      scoreDescription: '正确求出余弦值',
    },
    {
      type: 'singleChoice',
      stem: '等差数列 $\\{a_n\\}$ 中，$a_1=2$，公差 $d=3$，则 $a_5=$',
      choices: ['$11$', '$12$', '$14$', '$17$'],
      correctIndexes: [2],
      points: 5,
      solution: '$a_5=a_1+4d=2+4\\times3=14$。',
      scoreDescription: '正确使用等差数列通项公式',
    },
    {
      type: 'singleChoice',
      stem: '连续抛掷一枚质地均匀的硬币两次，恰有一次正面向上的概率为',
      choices: ['$\\frac14$', '$\\frac13$', '$\\frac12$', '$\\frac34$'],
      correctIndexes: [2],
      points: 5,
      solution:
        '两次抛掷共有 $4$ 个等可能结果，其中恰有一次正面向上有 $2$ 个，故概率为 $\\frac12$。',
      scoreDescription: '正确计算古典概型概率',
    },
    {
      type: 'singleChoice',
      stem: '圆 $x^2+y^2-4x+2y-4=0$ 的圆心与半径分别为',
      choices: ['$(2,-1),\\ 3$', '$(-2,1),\\ 3$', '$(2,-1),\\ 9$', '$(-2,1),\\ 9$'],
      correctIndexes: [0],
      points: 5,
      solution: '配方得 $(x-2)^2+(y+1)^2=9$，故圆心为 $(2,-1)$，半径为 $3$。',
      scoreDescription: '正确配方并读出圆心与半径',
      maxColumns: 2,
    },
    {
      type: 'singleChoice',
      stem: '函数 $f(x)=x^3-3x$ 的导函数为',
      choices: ["$f'(x)=3x^2-3$", "$f'(x)=x^2-3$", "$f'(x)=3x^2$", "$f'(x)=3x-3$"],
      correctIndexes: [0],
      points: 5,
      solution: "逐项求导，得 $f'(x)=3x^2-3$。",
      scoreDescription: '正确求出导函数',
      fixedColumns: 1,
    },
  ];

  section.questions = specs.map((spec) => createChoiceQuestion(createId, spec));
  return section;
}

function createMultipleChoiceSection(createId: CreateId): ExamSection {
  const section = createDefaultSection(createId, 'multipleChoice');
  const specs: ChoiceQuestionSpec[] = [
    {
      type: 'multipleChoice',
      stem: '关于函数 $f(x)=x^2$，下列说法正确的是',
      choices: ['是偶函数', '最小值为 $0$', '在 $\\mathbb R$ 上单调递增', '零点只有 $x=0$'],
      correctIndexes: [0, 1, 3],
      points: 6,
      solution: '$f(-x)=f(x)$，且 $x^2\\geq0$，等号仅在 $x=0$ 时成立；函数并非在整个实数集上递增。',
      scoreDescription: '所有正确结论均选择且无误选',
    },
    {
      type: 'multipleChoice',
      stem: '设 $\\vec a,\\vec b$ 为非零空间向量，且 $\\vec a\\cdot\\vec b=0$，则下列结论正确的是',
      choices: [
        '$\\vec a\\perp\\vec b$',
        '$|\\vec a+\\vec b|^2=|\\vec a|^2+|\\vec b|^2$',
        '$\\vec a\\parallel\\vec b$',
        '$|\\vec a-\\vec b|^2=|\\vec a|^2+|\\vec b|^2$',
      ],
      correctIndexes: [0, 1, 3],
      points: 6,
      solution: '由 $\\vec a\\cdot\\vec b=0$ 可知两向量垂直；展开模长平方可得两个勾股关系。',
      scoreDescription: '正确运用向量数量积与模长关系',
      maxColumns: 2,
    },
    {
      type: 'multipleChoice',
      stem: '一组数据 $x_1,x_2,\\ldots,x_n$ 的平均数为 $10$、方差为 $4$，令 $y_i=x_i+2$，则',
      choices: [
        '$y_i$ 的平均数为 $12$',
        '$y_i$ 的方差为 $4$',
        '$y_i$ 的标准差为 $2$',
        '$y_i$ 的极差比原数据大 $2$',
      ],
      correctIndexes: [0, 1, 2],
      points: 6,
      solution: '所有数据同时加 $2$，平均数增加 $2$，方差、标准差和极差均不变。',
      scoreDescription: '正确判断线性变换对统计量的影响',
      maxColumns: 2,
    },
  ];

  section.questions = specs.map((spec) => createChoiceQuestion(createId, spec));
  return section;
}

function createBlankSection(createId: CreateId): ExamSection {
  const section = createDefaultSection(createId, 'blank');
  section.questions = [
    createBlankQuestion(createId, {
      stemPrefix: '等差数列 $1,3,5,\\ldots$ 的第 $10$ 项为',
      answers: ['$19$'],
      solution: '$a_{10}=1+9\\times2=19$。',
      scoreMarks: [{ points: 5, description: '正确求出第十项' }],
    }),
    createBlankQuestion(createId, {
      stemPrefix: '$\\sin\\frac{\\pi}{6}=$',
      answers: ['$\\frac12$'],
      blankTypes: ['paren'],
      solution: '由特殊角的三角函数值可知 $\\sin\\frac{\\pi}{6}=\\frac12$。',
      scoreMarks: [{ points: 5, description: '正确填写特殊角三角函数值' }],
    }),
    createBlankQuestion(createId, {
      stemPrefix:
        '随机变量 $X$ 的分布为 $P(X=0)=\\frac14$，$P(X=1)=\\frac12$，$P(X=2)=\\frac14$，则 $E(X)=$',
      betweenBlanks: '，$D(X)=$',
      answers: ['$1$', '$\\frac12$'],
      solution: '$E(X)=1$，$E(X^2)=\\frac32$，所以 $D(X)=E(X^2)-\\left[E(X)\\right]^2=\\frac12$。',
      scoreMarks: [
        { points: 2, description: '正确求出数学期望' },
        { points: 3, description: '正确求出方差' },
      ],
    }),
  ];
  return section;
}

function createProblemSection(createId: CreateId): ExamSection {
  const section = createDefaultSection(createId, 'problem');
  section.questions = [
    createProblemQuestion(
      createId,
      15,
      '在 $\\triangle ABC$ 中，$A=\\frac{\\pi}{3}$，$b=2$，$c=3$。',
      [
        {
          stem: '求边 $a$ 的长。',
          solution: '由余弦定理，$a^2=b^2+c^2-2bc\\cos A=4+9-6=7$，故 $a=\\sqrt7$。',
          scoreMarks: [
            { points: 3, description: '正确写出余弦定理' },
            { points: 4, description: '正确求出边长' },
          ],
        },
        {
          stem: '求 $\\triangle ABC$ 的面积。',
          solution:
            '$S_{\\triangle ABC}=\\frac12bc\\sin A=\\frac12\\times2\\times3\\times\\frac{\\sqrt3}{2}=\\frac{3\\sqrt3}{2}$。',
          scoreMarks: [
            { points: 3, description: '正确写出面积公式' },
            { points: 5, description: '正确求出三角形面积' },
          ],
        },
      ],
    ),
    createProblemQuestion(
      createId,
      15,
      '一个袋中装有 $3$ 个红球和 $2$ 个蓝球，随机不放回地取出 $2$ 个球。',
      [
        {
          stem: '求取出的两个球都是红球的概率。',
          solution: '所求概率为 $\\frac{\\binom32}{\\binom52}=\\frac3{10}$。',
          scoreMarks: [
            { points: 3, description: '正确写出组合数概率' },
            { points: 4, description: '正确化简概率' },
          ],
        },
        {
          stem: '设取出的红球个数为 $X$，写出 $X$ 的分布列并求 $E(X)$。',
          solution:
            '$P(X=0)=\\frac1{10}$，$P(X=1)=\\frac35$，$P(X=2)=\\frac3{10}$，故 $E(X)=\\frac65$。',
          scoreMarks: [
            { points: 5, description: '正确写出随机变量的分布列' },
            { points: 3, description: '正确求出数学期望' },
          ],
        },
      ],
    ),
    createProblemQuestion(createId, 15, '数列 $\\{a_n\\}$ 满足 $a_1=1$，$a_{n+1}=a_n+2n+1$。', [
      {
        stem: '证明 $a_n=n^2$。',
        solution: '因为 $a_{n+1}-a_n=2n+1=(n+1)^2-n^2$，且 $a_1=1$，累加可得 $a_n=n^2$。',
        scoreMarks: [
          { points: 3, description: '识别相邻平方差' },
          { points: 4, description: '完成累加或归纳证明' },
        ],
      },
      {
        stem: '求数列 $\\{a_n\\}$ 的前 $n$ 项和 $S_n$。',
        solution: '$S_n=1^2+2^2+\\cdots+n^2=\\frac{n\\left(n+1\\right)\\left(2n+1\\right)}6$。',
        scoreMarks: [
          { points: 3, description: '将问题转化为平方和' },
          { points: 5, description: '正确写出前 n 项和' },
        ],
      },
    ]),
    createEllipseProblem(createId),
    createDerivativeProblem(createId),
  ];
  return section;
}

function createChoiceQuestion(createId: CreateId, spec: ChoiceQuestionSpec): ExamQuestion {
  const question = createDefaultQuestion(spec.type, createId);
  question.points = spec.points;
  question.stem = richBlocks(spec.stem);
  question.choices = spec.choices.map((content, index) => ({
    ...createChoiceOption(createId, String.fromCharCode(65 + index)),
    content: richBlocks(content),
  }));
  question.correctChoiceIds = spec.correctIndexes.map((index) => question.choices![index]!.id);
  question.solution = richBlocks(spec.solution);
  question.scoreMode = 'additive';
  question.scoreMarks = [describedScoreMark(createId, spec.points, spec.scoreDescription)];

  if (spec.maxColumns !== undefined) {
    question.choicesSetup = { maxColumns: spec.maxColumns };
  }
  if (spec.fixedColumns !== undefined) {
    question.choicesSetup = { examZhOptions: { columns: spec.fixedColumns } };
  }

  return question;
}

function createBlankQuestion(
  createId: CreateId,
  input: {
    stemPrefix: string;
    betweenBlanks?: string;
    answers: string[];
    blankTypes?: Array<BlankSlot['type']>;
    solution: string;
    scoreMarks: Array<{ points: number; description: string }>;
  },
): ExamQuestion {
  const question = createDefaultQuestion('blank', createId);
  const blanks = input.answers.map((answer, index) => {
    const blank = index === 0 ? question.blanks![0]! : createBlankSlot(createId);
    blank.answer = richBlocks(answer);
    blank.type = input.blankTypes?.[index] ?? 'line';
    return blank;
  });
  const children: InlineContent[] = [
    ...inlineChildren(input.stemPrefix),
    { type: 'blankRef', blankId: blanks[0]!.id },
  ];

  if (blanks.length > 1) {
    children.push(...inlineChildren(input.betweenBlanks ?? '，'), {
      type: 'blankRef',
      blankId: blanks[1]!.id,
    });
  }
  children.push({ type: 'text', text: '。' });

  question.points = 5;
  question.blanks = blanks;
  question.stem = [{ type: 'paragraph', children }];
  question.solution = richBlocks(input.solution);
  question.scoreMode = 'additive';
  question.scoreMarks = input.scoreMarks.map((mark) =>
    describedScoreMark(createId, mark.points, mark.description),
  );
  return question;
}

function createProblemQuestion(
  createId: CreateId,
  points: number,
  stem: string,
  subQuestionSpecs: SubQuestionSpec[],
): ExamQuestion {
  const question = createDefaultQuestion('problem', createId);
  question.points = points;
  question.stem = richBlocks(stem);
  question.solution = paragraphBlocks('以下按小题分别作答。');
  question.subQuestionGroup = {
    exportAs: 'enumerate',
    listKind: 'enumerate',
    items: subQuestionSpecs.map((spec) => createScoredSubQuestion(createId, spec)),
  };
  return question;
}

function createScoredSubQuestion(createId: CreateId, spec: SubQuestionSpec): SubQuestion {
  const subQuestion = createSubQuestion(createId);
  subQuestion.stem = richBlocks(spec.stem);
  subQuestion.solution = richBlocks(spec.solution);
  subQuestion.scoreMode = spec.scoreMode ?? 'additive';
  subQuestion.scoreMarks = spec.scoreMarks.map((mark) =>
    describedScoreMark(createId, mark.points, mark.description),
  );
  return subQuestion;
}

function createEllipseProblem(createId: CreateId): ExamQuestion {
  const question = createDefaultQuestion('problem', createId);
  const first = createScoredSubQuestion(createId, {
    stem: '求椭圆的焦点坐标。',
    solution: '由 $a=2$，$b=1$，得 $c=\\sqrt{a^2-b^2}=\\sqrt3$，故焦点为 $(\\pm\\sqrt3,0)$。',
    scoreMarks: [
      { points: 2, description: '正确确定 a 与 b' },
      { points: 3, description: '正确求出焦点坐标' },
    ],
  });
  const second = createScoredSubQuestion(createId, {
    stem: '求椭圆的离心率。',
    solution: '$e=\\frac ca=\\frac{\\sqrt3}{2}$。',
    scoreMarks: [
      { points: 2, description: '正确写出离心率公式' },
      { points: 3, description: '正确求出离心率' },
    ],
  });
  const third = createSubQuestion(createId);
  const summaryMark = describedScoreMark(createId, 2, '正确代入直线方程');
  const inlineMark = {
    ...describedScoreMark(createId, 4, '正确求出两个交点间的距离'),
    placement: 'inline' as const,
  };
  const annotation: SolutionAnnotation = {
    id: createId('annotation'),
    content: parseInlineRichText('需同时取上、下两个交点。'),
  };

  third.stem = richBlocks('直线 $x=1$ 与椭圆交于 $M,N$ 两点，求 $|MN|$。');
  third.scoreMode = 'additive';
  third.scoreMarks = [summaryMark, inlineMark];
  third.solutionAnnotations = [annotation];
  third.solution = [
    {
      type: 'paragraph',
      children: [
        { type: 'text', text: '令 ' },
        { type: 'inlineMath', latex: 'x=1' },
        { type: 'text', text: '，得 ' },
        { type: 'inlineMath', latex: 'y=\\pm\\frac{\\sqrt3}{2}' },
        { type: 'text', text: '。' },
        { type: 'annotationRef', annotationId: annotation.id },
        { type: 'text', text: ' 因此 ' },
        { type: 'inlineMath', latex: '|MN|=\\sqrt3' },
        { type: 'text', text: '。' },
        { type: 'scoreRef', scoreMarkId: inlineMark.id },
      ],
    },
  ];

  question.points = 16;
  question.stem = richBlocks('已知椭圆 $C:\\frac{x^2}{4}+y^2=1$。');
  question.solution = paragraphBlocks('利用椭圆的标准方程与直线交点关系作答。');
  question.subQuestionGroup = {
    exportAs: 'enumerate',
    listKind: 'enumerate',
    items: [first, second, third],
  };
  return question;
}

function createDerivativeProblem(createId: CreateId): ExamQuestion {
  const question = createDefaultQuestion('problem', createId);
  const first = createScoredSubQuestion(createId, {
    stem: "求 $f'(x)$。",
    solution: "$f'(x)=3x^2-6x=3x(x-2)$。",
    scoreMarks: [
      { points: 2, description: '正确使用求导法则' },
      { points: 2, description: '正确化简导函数' },
    ],
  });
  const second = createScoredSubQuestion(createId, {
    stem: '求函数 $f(x)$ 的单调区间。',
    solution:
      "由 $f'(x)=3x(x-2)$ 的符号，得增区间为 $(-\\infty,0)$、$(2,+\\infty)$，减区间为 $(0,2)$。",
    scoreMarks: [
      { points: 2, description: '正确求出临界点' },
      { points: 2, description: '正确判断导数符号' },
      { points: 2, description: '正确写出单调区间' },
    ],
  });
  const third = createScoredSubQuestion(createId, {
    stem: '求 $f(x)$ 在区间 $[0,3]$ 上的最大值和最小值。',
    solution: '比较 $f(0)=2$，$f(2)=-2$，$f(3)=2$，得最大值为 $2$，最小值为 $-2$。',
    scoreMode: 'levels',
    scoreMarks: [
      { points: 6, description: '临界点与端点比较完整，最大值和最小值均正确' },
      { points: 3, description: '方法正确但端点或函数值计算有一处疏漏' },
      { points: 0, description: '未能建立有效的极值比较过程' },
    ],
  });

  question.points = 16;
  question.stem = richBlocks('已知函数 $f(x)=x^3-3x^2+2$。');
  question.solution = paragraphBlocks('结合导函数符号与闭区间端点函数值作答。');
  question.subQuestionGroup = {
    exportAs: 'enumerate',
    listKind: 'enumerate',
    items: [first, second, third],
  };
  return question;
}

function describedScoreMark(createId: CreateId, points: number, description: string): ScoreMark {
  return {
    ...createScoreMark(createId),
    points,
    description: parseInlineRichText(description),
  };
}

function richBlocks(input: string): RichContentBlock[] {
  return parseRichContentInput(input).blocks;
}

function inlineChildren(input: string): InlineContent[] {
  const blocks = richBlocks(input);
  return blocks.flatMap((block) => (block.type === 'paragraph' ? block.children : []));
}
