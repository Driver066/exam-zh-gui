export type MathSnippetSource = 'standardLatex' | 'examZhMath' | 'examZhPaper' | 'appPlaceholder';

export type MathSnippetStatus = 'core' | 'advanced' | 'planned';

export type MathSnippetCategoryId =
  | 'relation'
  | 'operator'
  | 'structure'
  | 'setLogic'
  | 'geometry'
  | 'function'
  | 'calculus'
  | 'constant'
  | 'complex'
  | 'paper';

export type MathSnippetTabId =
  'recent' | 'frequent' | 'standardLatex' | 'examZhMath' | 'examZhPaper';

export type MathSnippetContext =
  | 'choiceStem'
  | 'blankStem'
  | 'judgementStem'
  | 'problemStem'
  | 'subQuestionStem'
  | 'choiceOption'
  | 'solution'
  | 'blankAnswer'
  | 'generic';

export interface MathSnippet {
  id: string;
  label: string;
  insertText: string;
  description: string;
  source: MathSnippetSource;
  category: MathSnippetCategoryId;
  previewLatex?: string;
  status: MathSnippetStatus;
  applicableContexts?: MathSnippetContext[];
  aliases?: string[];
  keywords?: string[];
  manualRef?: string;
  cursorOffset?: number;
  insertion?: MathSnippetInsertion;
}

export type MathSnippetInsertion = MathSnippetWrapper | MathSnippetTemplate;

export interface MathSnippetWrapper {
  kind: 'wrapper';
  prefix: string;
  suffix: string;
}

export interface MathSnippetTemplate {
  kind: 'template';
  parts: string[];
}

export interface MathSnippetCategoryGroup {
  id: MathSnippetCategoryId | MathSnippetTabId;
  label: string;
  category?: MathSnippetCategoryId;
  snippets: MathSnippet[];
}

export interface MathSnippetCategory {
  id: MathSnippetCategoryId;
  label: string;
}

export interface MathSnippetTab {
  id: MathSnippetTabId;
  label: string;
}

export interface TextSelection {
  start: number;
  end: number;
}

export interface TextInsertionResult {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

export interface MathSnippetSlotState {
  slots: TextSelection[];
  activeIndex: number;
  structureEnd: number;
}

export interface MathSnippetInsertionResult extends TextInsertionResult {
  slotState?: MathSnippetSlotState;
}

export interface MathSnippetSlotNavigationResult {
  slotState?: MathSnippetSlotState;
  selection: TextSelection;
}

export const recentMathSnippetLimit = 12;

export const mathSnippetTabs: MathSnippetTab[] = [
  { id: 'frequent', label: '常用' },
  { id: 'standardLatex', label: '标准 LaTeX' },
  { id: 'examZhMath', label: '中文考试' },
  { id: 'examZhPaper', label: '试卷片段' },
];

export const mathSnippetCategories: MathSnippetCategory[] = [
  { id: 'relation', label: '比较与关系' },
  { id: 'operator', label: '运算' },
  { id: 'structure', label: '式子结构' },
  { id: 'setLogic', label: '集合与逻辑' },
  { id: 'geometry', label: '几何与向量' },
  { id: 'function', label: '函数' },
  { id: 'calculus', label: '微积分' },
  { id: 'constant', label: '常数' },
  { id: 'complex', label: '复数' },
  { id: 'paper', label: '试卷片段' },
];

export const frequentMathSnippetIds = [
  'frac',
  'dfrac',
  'sqrt',
  'auto-paren',
  'sup',
  'sub',
  'eq',
  'le',
  'ge',
  'pi',
  'eu',
  'iu',
  'vec-single',
  'vec-multi',
  'fillin-ref',
  'stem-line',
  'paren',
  'judgement-paren',
] as const;

export const mathSnippetRegistry: MathSnippet[] = [
  {
    id: 'eq',
    label: '=',
    insertText: '$=$',
    description: '等于',
    source: 'standardLatex',
    category: 'relation',
    previewLatex: '=',
    status: 'core',
  },
  {
    id: 'neq',
    label: '≠',
    insertText: '$\\ne$',
    description: '不等于',
    source: 'standardLatex',
    category: 'relation',
    previewLatex: '\\ne',
    status: 'core',
  },
  {
    id: 'le',
    label: '≤',
    insertText: '$\\le$',
    description: '小于等于',
    source: 'standardLatex',
    category: 'relation',
    previewLatex: '\\le',
    status: 'core',
  },
  {
    id: 'ge',
    label: '≥',
    insertText: '$\\ge$',
    description: '大于等于',
    source: 'standardLatex',
    category: 'relation',
    previewLatex: '\\ge',
    status: 'core',
  },
  {
    id: 'approx',
    label: '≈',
    insertText: '$\\approx$',
    description: '约等于',
    source: 'standardLatex',
    category: 'relation',
    previewLatex: '\\approx',
    status: 'core',
  },
  {
    id: 'sim-standard',
    label: '~*',
    insertText: '$\\sim*$',
    description: '标准 LaTeX 相似；exam-zh 星号形式保留原版外观',
    source: 'standardLatex',
    category: 'relation',
    previewLatex: '\\sim',
    status: 'advanced',
  },
  {
    id: 'cong-standard',
    label: '≅*',
    insertText: '$\\cong*$',
    description: '标准 LaTeX 全等；exam-zh 星号形式保留原版外观',
    source: 'standardLatex',
    category: 'relation',
    previewLatex: '\\backcong',
    status: 'advanced',
  },
  {
    id: 'sup',
    label: '上标',
    insertText: '${}^{}$',
    description: '上标模板',
    source: 'standardLatex',
    category: 'structure',
    previewLatex: 'x^2',
    status: 'core',
    insertion: { kind: 'template', parts: ['{', '}^{', '}'] },
  },
  {
    id: 'sub',
    label: '下标',
    insertText: '${}_{}$',
    description: '下标模板',
    source: 'standardLatex',
    category: 'structure',
    previewLatex: 'x_i',
    status: 'core',
    insertion: { kind: 'template', parts: ['{', '}_{', '}'] },
  },
  {
    id: 'frac',
    label: '分式',
    insertText: '$\\frac{}{}$',
    description: '分式模板',
    source: 'standardLatex',
    category: 'structure',
    previewLatex: '\\frac{a}{b}',
    status: 'core',
    insertion: { kind: 'template', parts: ['\\frac{', '}{', '}'] },
  },
  {
    id: 'dfrac',
    label: '大分式',
    insertText: '$\\dfrac{}{}$',
    description: '行内显示较大的分式模板',
    source: 'standardLatex',
    category: 'structure',
    previewLatex: '\\dfrac{a}{b}',
    status: 'core',
    insertion: { kind: 'template', parts: ['\\dfrac{', '}{', '}'] },
  },
  {
    id: 'sqrt',
    label: '根式',
    insertText: '$\\sqrt{}$',
    description: '平方根模板',
    source: 'standardLatex',
    category: 'structure',
    previewLatex: '\\sqrt{x}',
    status: 'core',
    insertion: { kind: 'wrapper', prefix: '\\sqrt{', suffix: '}' },
  },
  {
    id: 'auto-paren',
    label: '( )',
    insertText: '$\\left(\\right)$',
    description: '自动匹配内容高度的圆括号',
    source: 'standardLatex',
    category: 'structure',
    previewLatex: '\\left(\\vphantom{\\dfrac{a}{b}}\\;\\right)',
    status: 'core',
    insertion: { kind: 'wrapper', prefix: '\\left(', suffix: '\\right)' },
  },
  {
    id: 'auto-bracket',
    label: '[ ]',
    insertText: '$\\left[\\right]$',
    description: '自动匹配内容高度的方括号',
    source: 'standardLatex',
    category: 'structure',
    previewLatex: '\\left[\\vphantom{\\dfrac{a}{b}}\\;\\right]',
    status: 'core',
    insertion: { kind: 'wrapper', prefix: '\\left[', suffix: '\\right]' },
  },
  {
    id: 'auto-brace',
    label: '{ }',
    insertText: '$\\left\\{\\right\\}$',
    description: '自动匹配内容高度的花括号',
    source: 'standardLatex',
    category: 'structure',
    previewLatex: '\\left\\{\\vphantom{\\dfrac{a}{b}}\\;\\right\\}',
    status: 'core',
    insertion: { kind: 'wrapper', prefix: '\\left\\{', suffix: '\\right\\}' },
  },
  {
    id: 'abs',
    label: '|x|',
    insertText: '$\\left|\\right|$',
    description: '绝对值模板',
    source: 'standardLatex',
    category: 'structure',
    previewLatex: '\\left|x\\right|',
    status: 'core',
    insertion: { kind: 'wrapper', prefix: '\\left|', suffix: '\\right|' },
  },
  {
    id: 'in',
    label: '∈',
    insertText: '$\\in$',
    description: '属于',
    source: 'standardLatex',
    category: 'setLogic',
    previewLatex: '\\in',
    status: 'core',
  },
  {
    id: 'notin',
    label: '∉',
    insertText: '$\\notin$',
    description: '不属于',
    source: 'standardLatex',
    category: 'setLogic',
    previewLatex: '\\notin',
    status: 'core',
  },
  {
    id: 'subset',
    label: '⊂',
    insertText: '$\\subset*$',
    description: '标准 LaTeX 真子集；exam-zh 星号形式保留原版外观',
    source: 'standardLatex',
    category: 'setLogic',
    previewLatex: '\\subset',
    status: 'core',
  },
  {
    id: 'nsubset-standard',
    label: '⊄*',
    insertText: '$\\nsubset*$',
    description: '标准 LaTeX 非真子集；exam-zh 星号形式保留原版外观',
    source: 'standardLatex',
    category: 'setLogic',
    previewLatex: '\\nsubset',
    status: 'advanced',
  },
  {
    id: 'subseteq-standard',
    label: '⊆*',
    insertText: '$\\subseteq*$',
    description: '标准 LaTeX 子集；exam-zh 星号形式保留原版外观',
    source: 'standardLatex',
    category: 'setLogic',
    previewLatex: '\\subseteq',
    status: 'advanced',
  },
  {
    id: 'nsubseteq-standard',
    label: '⊈*',
    insertText: '$\\nsubseteq*$',
    description: '标准 LaTeX 非子集；exam-zh 星号形式保留原版外观',
    source: 'standardLatex',
    category: 'setLogic',
    previewLatex: '\\nsubseteq',
    status: 'advanced',
  },
  {
    id: 'subsetneqq-standard',
    label: '⫋*',
    insertText: '$\\subsetneqq*$',
    description: '标准 LaTeX 真子集；exam-zh 星号形式保留原版外观',
    source: 'standardLatex',
    category: 'setLogic',
    previewLatex: '\\subsetneqq',
    status: 'advanced',
  },
  {
    id: 'supset-standard',
    label: '⊃*',
    insertText: '$\\supset*$',
    description: '标准 LaTeX 反向真子集；exam-zh 星号形式保留原版外观',
    source: 'standardLatex',
    category: 'setLogic',
    previewLatex: '\\supset',
    status: 'advanced',
  },
  {
    id: 'nsupset-standard',
    label: '⊅*',
    insertText: '$\\nsupset*$',
    description: '标准 LaTeX 反向非真子集；exam-zh 星号形式保留原版外观',
    source: 'standardLatex',
    category: 'setLogic',
    previewLatex: '\\nsupset',
    status: 'advanced',
  },
  {
    id: 'supseteq-standard',
    label: '⊇*',
    insertText: '$\\supseteq*$',
    description: '标准 LaTeX 反向子集；exam-zh 星号形式保留原版外观',
    source: 'standardLatex',
    category: 'setLogic',
    previewLatex: '\\supseteq',
    status: 'advanced',
  },
  {
    id: 'nsupseteq-standard',
    label: '⊉*',
    insertText: '$\\nsupseteq*$',
    description: '标准 LaTeX 反向非子集；exam-zh 星号形式保留原版外观',
    source: 'standardLatex',
    category: 'setLogic',
    previewLatex: '\\nsupseteq',
    status: 'advanced',
  },
  {
    id: 'supsetneqq-standard',
    label: '⫌*',
    insertText: '$\\supsetneqq*$',
    description: '标准 LaTeX 反向真子集；exam-zh 星号形式保留原版外观',
    source: 'standardLatex',
    category: 'setLogic',
    previewLatex: '\\supsetneqq',
    status: 'advanced',
  },
  {
    id: 'cup',
    label: '∪',
    insertText: '$\\cup*$',
    description: '标准 LaTeX 并集；exam-zh 星号形式保留原版外观',
    source: 'standardLatex',
    category: 'setLogic',
    previewLatex: '\\cup',
    status: 'core',
  },
  {
    id: 'cap',
    label: '∩',
    insertText: '$\\cap*$',
    description: '标准 LaTeX 交集；exam-zh 星号形式保留原版外观',
    source: 'standardLatex',
    category: 'setLogic',
    previewLatex: '\\cap',
    status: 'core',
  },
  {
    id: 'parallel',
    label: '∥',
    insertText: '$\\parallel$',
    description: 'exam-zh 平行符号；上游 v0.2.6 没有星号原版入口',
    source: 'examZhMath',
    category: 'geometry',
    previewLatex: '\\parallel',
    status: 'advanced',
    manualRef: '3.4.3',
  },
  {
    id: 'perp',
    label: '⊥',
    insertText: '$\\perp$',
    description: '垂直',
    source: 'standardLatex',
    category: 'geometry',
    previewLatex: '\\perp',
    status: 'core',
  },
  {
    id: 'angle',
    label: '∠',
    insertText: '$\\angle$',
    description: '角',
    source: 'standardLatex',
    category: 'geometry',
    previewLatex: '\\angle',
    status: 'core',
  },
  {
    id: 'triangle',
    label: '△',
    insertText: '$\\triangle$',
    description: '三角形',
    source: 'standardLatex',
    category: 'geometry',
    previewLatex: '\\triangle',
    status: 'core',
  },
  {
    id: 'degree',
    label: '°',
    insertText: '$^\\circ$',
    description: '角度',
    source: 'standardLatex',
    category: 'geometry',
    previewLatex: '30^\\circ',
    status: 'core',
  },
  {
    id: 'sin',
    label: 'sin',
    insertText: '$\\sin x$',
    description: '正弦函数',
    source: 'standardLatex',
    category: 'function',
    previewLatex: '\\sin x',
    status: 'core',
  },
  {
    id: 'cos',
    label: 'cos',
    insertText: '$\\cos x$',
    description: '余弦函数',
    source: 'standardLatex',
    category: 'function',
    previewLatex: '\\cos x',
    status: 'core',
  },
  {
    id: 'tan',
    label: 'tan',
    insertText: '$\\tan x$',
    description: '正切函数',
    source: 'standardLatex',
    category: 'function',
    previewLatex: '\\tan x',
    status: 'core',
  },
  {
    id: 'lim',
    label: 'lim',
    insertText: '$\\lim_{x\\to }$',
    description: '极限模板',
    source: 'standardLatex',
    category: 'calculus',
    previewLatex: '\\lim_{x\\to 0}',
    status: 'core',
  },
  {
    id: 'sum',
    label: 'Σ',
    insertText: '$\\sum_{}^{}$',
    description: '求和模板',
    source: 'standardLatex',
    category: 'calculus',
    previewLatex: '\\sum_{i=1}^{n}',
    status: 'core',
  },
  {
    id: 'int',
    label: '∫',
    insertText: '$\\int_{}^{}$',
    description: '积分模板',
    source: 'standardLatex',
    category: 'calculus',
    previewLatex: '\\int_{a}^{b}',
    status: 'core',
  },
  {
    id: 'derivative',
    label: "f'",
    insertText: "$f'(x)$",
    description: '导数模板',
    source: 'standardLatex',
    category: 'calculus',
    previewLatex: "f'(x)",
    status: 'core',
  },
  {
    id: 'pi',
    label: 'π',
    insertText: '$\\uppi$',
    description: '圆周率',
    source: 'examZhMath',
    category: 'constant',
    previewLatex: '\\uppi',
    status: 'core',
    keywords: ['圆周率', 'pi'],
    manualRef: '3.4.1',
  },
  {
    id: 'eu',
    label: 'e',
    insertText: '$\\eu$',
    description: '正体自然常数',
    source: 'examZhMath',
    category: 'constant',
    previewLatex: '\\eu',
    status: 'core',
    aliases: ['\\upe'],
    keywords: ['自然常数', 'Euler'],
    manualRef: '3.4.1',
  },
  {
    id: 'iu',
    label: 'i',
    insertText: '$\\iu$',
    description: '正体虚数单位',
    source: 'examZhMath',
    category: 'complex',
    previewLatex: '\\iu',
    status: 'core',
    aliases: ['\\upi'],
    keywords: ['虚数单位'],
    manualRef: '3.4.1',
  },
  {
    id: 'vec-single',
    label: '向量 x',
    insertText: '$\\vec{}$',
    description: 'exam-zh 的单字母向量会显示为加粗斜体',
    source: 'examZhMath',
    category: 'geometry',
    previewLatex: '\\boldsymbol{x}',
    status: 'advanced',
    manualRef: '3.4.2',
    insertion: { kind: 'wrapper', prefix: '\\vec{', suffix: '}' },
  },
  {
    id: 'vec-multi',
    label: '向量 AB',
    insertText: '$\\vec{}$',
    description: 'exam-zh 的多字母向量会显示为箭头向量',
    source: 'examZhMath',
    category: 'geometry',
    previewLatex: '\\overrightarrow{AB}',
    status: 'advanced',
    manualRef: '3.4.2',
    insertion: { kind: 'wrapper', prefix: '\\vec{', suffix: '}' },
  },
  {
    id: 'parallelogram',
    label: '▱',
    insertText: '$\\parallelogram$',
    description: 'exam-zh 平行四边形符号',
    source: 'examZhMath',
    category: 'geometry',
    previewLatex: '\\parallelogram',
    status: 'advanced',
    manualRef: '3.4.3',
  },
  {
    id: 'nparallel',
    label: '∦',
    insertText: '$\\nparallel$',
    description: 'exam-zh 不平行符号',
    source: 'examZhMath',
    category: 'geometry',
    previewLatex: '\\nparallel',
    status: 'advanced',
    manualRef: '3.4.3',
  },
  {
    id: 'paralleleq',
    label: '//=',
    insertText: '$\\paralleleq$',
    description: 'exam-zh 平行且相等符号',
    source: 'examZhMath',
    category: 'geometry',
    previewLatex: '\\paralleleq',
    status: 'advanced',
    manualRef: '3.4.3',
  },
  {
    id: 'examzh-subset',
    label: '⊂',
    insertText: '$\\subset$',
    description: 'exam-zh 重定义真子集符号',
    source: 'examZhMath',
    category: 'setLogic',
    previewLatex: '\\subset',
    status: 'advanced',
    manualRef: '3.4.3',
  },
  {
    id: 'nsubset',
    label: '⊄',
    insertText: '$\\nsubset$',
    description: 'exam-zh 非真子集符号',
    source: 'examZhMath',
    category: 'setLogic',
    previewLatex: '\\nsubset',
    status: 'advanced',
    manualRef: '3.4.3',
  },
  {
    id: 'subseteq',
    label: '⊆',
    insertText: '$\\subseteq$',
    description: 'exam-zh 子集符号',
    source: 'examZhMath',
    category: 'setLogic',
    previewLatex: '\\subseteq',
    status: 'advanced',
    manualRef: '3.4.3',
  },
  {
    id: 'nsubseteq',
    label: '⊈',
    insertText: '$\\nsubseteq$',
    description: 'exam-zh 非子集符号',
    source: 'examZhMath',
    category: 'setLogic',
    previewLatex: '\\nsubseteq',
    status: 'advanced',
    manualRef: '3.4.3',
  },
  {
    id: 'subsetneqq',
    label: '⫋',
    insertText: '$\\subsetneqq$',
    description: 'exam-zh 真子集符号',
    source: 'examZhMath',
    category: 'setLogic',
    previewLatex: '\\subsetneqq',
    status: 'advanced',
    manualRef: '3.4.3',
  },
  {
    id: 'nsubsetneqq',
    label: 'n⫋',
    insertText: '$\\nsubsetneqq$',
    description: 'exam-zh 非真子集符号',
    source: 'examZhMath',
    category: 'setLogic',
    previewLatex: '\\nsubsetneqq',
    status: 'advanced',
    manualRef: '3.4.3',
  },
  {
    id: 'supset',
    label: '⊃',
    insertText: '$\\supset$',
    description: 'exam-zh 反向真子集符号',
    source: 'examZhMath',
    category: 'setLogic',
    previewLatex: '\\supset',
    status: 'advanced',
    manualRef: '3.4.3',
  },
  {
    id: 'nsupset',
    label: '⊅',
    insertText: '$\\nsupset$',
    description: 'exam-zh 反向非真子集符号',
    source: 'examZhMath',
    category: 'setLogic',
    previewLatex: '\\nsupset',
    status: 'advanced',
    manualRef: '3.4.3',
  },
  {
    id: 'supseteq',
    label: '⊇',
    insertText: '$\\supseteq$',
    description: 'exam-zh 反向子集符号',
    source: 'examZhMath',
    category: 'setLogic',
    previewLatex: '\\supseteq',
    status: 'advanced',
    manualRef: '3.4.3',
  },
  {
    id: 'nsupseteq',
    label: '⊉',
    insertText: '$\\nsupseteq$',
    description: 'exam-zh 反向非子集符号',
    source: 'examZhMath',
    category: 'setLogic',
    previewLatex: '\\nsupseteq',
    status: 'advanced',
    manualRef: '3.4.3',
  },
  {
    id: 'supsetneqq',
    label: '⫌',
    insertText: '$\\supsetneqq$',
    description: 'exam-zh 反向真子集符号',
    source: 'examZhMath',
    category: 'setLogic',
    previewLatex: '\\supsetneqq',
    status: 'advanced',
    manualRef: '3.4.3',
  },
  {
    id: 'examzh-cap',
    label: '∩',
    insertText: '$\\cap$',
    description: 'exam-zh 重定义交集符号',
    source: 'examZhMath',
    category: 'setLogic',
    previewLatex: '\\cap',
    status: 'advanced',
    manualRef: '3.4.3',
  },
  {
    id: 'examzh-cup',
    label: '∪',
    insertText: '$\\cup$',
    description: 'exam-zh 重定义并集符号',
    source: 'examZhMath',
    category: 'setLogic',
    previewLatex: '\\cup',
    status: 'advanced',
    manualRef: '3.4.3',
  },
  {
    id: 'nsupsetneqq',
    label: 'n⫌',
    insertText: '$\\nsupsetneqq$',
    description: 'exam-zh 反向非真子集符号',
    source: 'examZhMath',
    category: 'setLogic',
    previewLatex: '\\nsupsetneqq',
    status: 'advanced',
    manualRef: '3.4.3',
  },
  {
    id: 'sim',
    label: '~',
    insertText: '$\\sim$',
    description: 'exam-zh 相似符号',
    source: 'examZhMath',
    category: 'relation',
    previewLatex: '\\sim',
    status: 'advanced',
    manualRef: '3.4.3',
  },
  {
    id: 'nsim',
    label: '≁',
    insertText: '$\\nsim$',
    description: 'exam-zh 不相似符号',
    source: 'examZhMath',
    category: 'relation',
    previewLatex: '\\nsim',
    status: 'advanced',
    manualRef: '3.4.3',
  },
  {
    id: 'cong',
    label: '≅',
    insertText: '$\\cong$',
    description: 'exam-zh 全等符号',
    source: 'examZhMath',
    category: 'relation',
    previewLatex: '\\cong',
    status: 'advanced',
    manualRef: '3.4.3',
  },
  {
    id: 'ncong',
    label: '≇',
    insertText: '$\\ncong$',
    description: 'exam-zh 不全等符号',
    source: 'examZhMath',
    category: 'relation',
    previewLatex: '\\ncong',
    status: 'advanced',
    manualRef: '3.4.3',
  },
  {
    id: 'euler',
    label: 'e^{ix}',
    insertText: '$\\eu^{\\iu x}$',
    description: '欧拉公式片段',
    source: 'examZhMath',
    category: 'complex',
    previewLatex: '\\eu^{\\iu x}',
    status: 'core',
    keywords: ['欧拉公式'],
    manualRef: '3.4.1',
  },
  {
    id: 'paren',
    label: '选择括号',
    insertText: '{{选择括号}}',
    description: '选择题答案括号位置',
    source: 'appPlaceholder',
    category: 'paper',
    status: 'core',
    applicableContexts: ['choiceStem'],
  },
  {
    id: 'judgement-paren',
    label: '判断括号',
    insertText: '{{判断括号}}',
    description: '判断题答案括号位置',
    source: 'appPlaceholder',
    category: 'paper',
    status: 'core',
    applicableContexts: ['judgementStem'],
  },
  {
    id: 'fillin-ref',
    label: '第1空',
    insertText: '{{第1空}}',
    description: '填空占位',
    source: 'appPlaceholder',
    category: 'paper',
    status: 'core',
    applicableContexts: ['blankStem'],
  },
  {
    id: 'stem-line',
    label: '横线',
    insertText: '{{横线}}',
    description: '题干留空横线',
    source: 'appPlaceholder',
    category: 'paper',
    status: 'core',
    applicableContexts: ['choiceStem', 'blankStem', 'problemStem', 'subQuestionStem'],
  },
  {
    id: 'score',
    label: '评分/批注',
    insertText: '\\score{}',
    description: '输入数字会转换为评分点，输入文字会转换为解析批注，并保留当前位置',
    source: 'examZhPaper',
    category: 'paper',
    status: 'core',
    applicableContexts: ['solution'],
    cursorOffset: 7,
  },
];

export function getVisibleMathSnippetTabs(
  recentSnippetIds: string[] = [],
  context?: MathSnippetContext,
): MathSnippetTab[] {
  const tabs = mathSnippetTabs.filter(
    (tab) => getMathSnippetGroupsForTab(tab.id, recentSnippetIds, context).length > 0,
  );
  const recentSnippets = getSnippetsForTab('recent', recentSnippetIds, context);

  return recentSnippets.length > 0 ? [{ id: 'recent', label: '最近' }, ...tabs] : tabs;
}

export function getMathSnippetGroupsForTab(
  tabId: MathSnippetTabId,
  recentSnippetIds: string[] = [],
  context?: MathSnippetContext,
): MathSnippetCategoryGroup[] {
  const snippets = getSnippetsForTab(tabId, recentSnippetIds, context);
  if (snippets.length === 0) {
    return [];
  }

  if (!isMathSnippetCategoryTab(tabId)) {
    return [{ id: tabId, label: '', snippets }];
  }

  return mathSnippetCategories.flatMap((category) => {
    const categorySnippets = snippets.filter((snippet) => snippet.category === category.id);

    return categorySnippets.length > 0
      ? [
          {
            id: category.id,
            label: category.label,
            category: category.id,
            snippets: categorySnippets,
          },
        ]
      : [];
  });
}

export function isMathSnippetCategoryTab(
  tabId: MathSnippetTabId,
): tabId is 'standardLatex' | 'examZhMath' {
  return tabId === 'standardLatex' || tabId === 'examZhMath';
}

export function findMathSnippet(snippetId: string): MathSnippet | undefined {
  return mathSnippetRegistry.find((snippet) => snippet.id === snippetId);
}

export function isMathPreviewSnippet(snippet: MathSnippet): boolean {
  return (
    (snippet.source === 'standardLatex' || snippet.source === 'examZhMath') &&
    snippet.previewLatex !== undefined
  );
}

export function formatMathSnippetTooltip(snippet: MathSnippet): string {
  const aliases = snippet.aliases?.length ? `；等价命令：${snippet.aliases.join('、')}` : '';

  return `${snippet.description}：${snippet.insertText}${aliases}`;
}

export function isMathSnippetApplicable(
  snippet: MathSnippet,
  context: MathSnippetContext | undefined,
): boolean {
  return !snippet.applicableContexts || !context || snippet.applicableContexts.includes(context);
}

export function updateRecentMathSnippetIds(
  currentIds: string[],
  snippetId: string,
  limit = recentMathSnippetLimit,
): string[] {
  if (!findMathSnippet(snippetId)) {
    return currentIds;
  }

  return [snippetId, ...currentIds.filter((id) => id !== snippetId)].slice(0, limit);
}

export function insertTextAtSelection(
  value: string,
  insertText: string,
  selection?: TextSelection | null,
): TextInsertionResult {
  const start = clampSelectionIndex(selection?.start ?? value.length, value.length);
  const end = clampSelectionIndex(selection?.end ?? start, value.length);
  const selectionStart = Math.min(start, end);
  const selectionEnd = Math.max(start, end);
  const nextValue = `${value.slice(0, selectionStart)}${insertText}${value.slice(selectionEnd)}`;
  const nextCursor = selectionStart + insertText.length;

  return {
    value: nextValue,
    selectionStart: nextCursor,
    selectionEnd: nextCursor,
  };
}

export function insertMathSnippetAtSelection(
  value: string,
  snippet: MathSnippet,
  selection?: TextSelection | null,
): MathSnippetInsertionResult {
  if (!snippet.insertion) {
    const result = insertTextAtSelection(value, snippet.insertText, selection);
    if (snippet.cursorOffset === undefined) return result;

    const insertionStart = result.selectionStart - snippet.insertText.length;
    const cursor = insertionStart + snippet.cursorOffset;
    return { ...result, selectionStart: cursor, selectionEnd: cursor };
  }

  const normalized = normalizeSelection(value, selection);
  const selectedText = value.slice(normalized.start, normalized.end);
  const selectedFormula = unwrapCompleteInlineMath(selectedText);
  const selectedContent = selectedFormula ?? selectedText;
  const insideMath =
    selectedFormula === null &&
    isSelectionInsideInlineMath(value, normalized.start, normalized.end);
  const outerPrefix = insideMath ? '' : '$';
  const outerSuffix = insideMath ? '' : '$';
  const structure = buildMathSnippetStructure(snippet.insertion, selectedContent);
  const insertText = `${outerPrefix}${structure.value}${outerSuffix}`;
  const insertionStart = normalized.start;
  const slotOffset = insertionStart + outerPrefix.length;
  const slots = structure.slots.map((slot) => ({
    start: slot.start + slotOffset,
    end: slot.end + slotOffset,
  }));
  const activeIndex = selectedContent.length > 0 && slots.length > 1 ? 1 : 0;
  const activeSlot = slots[activeIndex] ?? {
    start: insertionStart + insertText.length,
    end: insertionStart + insertText.length,
  };

  return {
    value: `${value.slice(0, normalized.start)}${insertText}${value.slice(normalized.end)}`,
    selectionStart: activeSlot.start,
    selectionEnd: activeSlot.end,
    slotState:
      slots.length > 0
        ? {
            slots,
            activeIndex,
            structureEnd: insertionStart + insertText.length,
          }
        : undefined,
  };
}

export function moveMathSnippetSlot(
  state: MathSnippetSlotState,
  direction: 'next' | 'previous',
): MathSnippetSlotNavigationResult {
  const nextIndex = state.activeIndex + (direction === 'next' ? 1 : -1);

  if (direction === 'next' && nextIndex >= state.slots.length) {
    return {
      selection: { start: state.structureEnd, end: state.structureEnd },
    };
  }

  const activeIndex = Math.min(state.slots.length - 1, Math.max(0, nextIndex));
  return {
    slotState: { ...state, activeIndex },
    selection: state.slots[activeIndex]!,
  };
}

export function updateMathSnippetSlotStateForEdit(
  state: MathSnippetSlotState,
  previousValue: string,
  nextValue: string,
): MathSnippetSlotState | undefined {
  if (previousValue === nextValue) return state;

  const change = findTextChange(previousValue, nextValue);
  const activeSlot = state.slots[state.activeIndex];
  if (!activeSlot || change.oldStart < activeSlot.start || change.oldEnd > activeSlot.end) {
    return undefined;
  }

  const delta = change.newEnd - change.oldEnd;
  return {
    activeIndex: state.activeIndex,
    structureEnd: state.structureEnd + delta,
    slots: state.slots.map((slot, index) => {
      if (index < state.activeIndex) return slot;
      if (index === state.activeIndex) return { start: slot.start, end: slot.end + delta };
      return { start: slot.start + delta, end: slot.end + delta };
    }),
  };
}

function buildMathSnippetStructure(
  insertion: MathSnippetInsertion,
  selectedContent: string,
): { value: string; slots: TextSelection[] } {
  if (insertion.kind === 'wrapper') {
    return {
      value: `${insertion.prefix}${selectedContent}${insertion.suffix}`,
      slots: [
        {
          start: insertion.prefix.length,
          end: insertion.prefix.length + selectedContent.length,
        },
      ],
    };
  }

  if (insertion.parts.length < 2) {
    return { value: insertion.parts[0] ?? '', slots: [] };
  }

  let nextValue = insertion.parts[0] ?? '';
  const slots: TextSelection[] = [];
  for (let index = 0; index < insertion.parts.length - 1; index += 1) {
    const content = index === 0 ? selectedContent : '';
    const start = nextValue.length;
    nextValue += content;
    slots.push({ start, end: nextValue.length });
    nextValue += insertion.parts[index + 1] ?? '';
  }

  return { value: nextValue, slots };
}

function normalizeSelection(value: string, selection?: TextSelection | null): TextSelection {
  const start = clampSelectionIndex(selection?.start ?? value.length, value.length);
  const end = clampSelectionIndex(selection?.end ?? start, value.length);
  return { start: Math.min(start, end), end: Math.max(start, end) };
}

function unwrapCompleteInlineMath(value: string): string | null {
  if (value.length < 2 || value[0] !== '$' || value[value.length - 1] !== '$') return null;
  return value.slice(1, -1);
}

function isSelectionInsideInlineMath(value: string, start: number, end: number): boolean {
  let openingDollar = -1;
  for (let index = 0; index < start; index += 1) {
    if (value[index] !== '$' || isEscapedAt(value, index)) continue;
    openingDollar = openingDollar < 0 ? index : -1;
  }

  if (openingDollar < 0) return false;
  for (let index = start; index < value.length; index += 1) {
    if (value[index] !== '$' || isEscapedAt(value, index)) continue;
    return end <= index;
  }

  return false;
}

function isEscapedAt(value: string, index: number): boolean {
  let slashCount = 0;
  for (let cursor = index - 1; cursor >= 0 && value[cursor] === '\\'; cursor -= 1) {
    slashCount += 1;
  }
  return slashCount % 2 === 1;
}

function findTextChange(
  previousValue: string,
  nextValue: string,
): { oldStart: number; oldEnd: number; newEnd: number } {
  let start = 0;
  while (
    start < previousValue.length &&
    start < nextValue.length &&
    previousValue[start] === nextValue[start]
  ) {
    start += 1;
  }

  let oldEnd = previousValue.length;
  let newEnd = nextValue.length;
  while (oldEnd > start && newEnd > start && previousValue[oldEnd - 1] === nextValue[newEnd - 1]) {
    oldEnd -= 1;
    newEnd -= 1;
  }

  return { oldStart: start, oldEnd, newEnd };
}

function getSnippetsForTab(
  tabId: MathSnippetTabId,
  recentSnippetIds: string[],
  context: MathSnippetContext | undefined,
): MathSnippet[] {
  switch (tabId) {
    case 'recent':
      return recentSnippetIds.flatMap((snippetId) => {
        const snippet = findMathSnippet(snippetId);
        return snippet && isMathSnippetApplicable(snippet, context) ? [snippet] : [];
      });
    case 'frequent':
      return frequentMathSnippetIds.flatMap((snippetId) => {
        const snippet = findMathSnippet(snippetId);
        return snippet && isMathSnippetApplicable(snippet, context) ? [snippet] : [];
      });
    case 'standardLatex':
      return mathSnippetRegistry.filter(
        (snippet) =>
          snippet.source === 'standardLatex' && isMathSnippetApplicable(snippet, context),
      );
    case 'examZhMath':
      return mathSnippetRegistry.filter(
        (snippet) => snippet.source === 'examZhMath' && isMathSnippetApplicable(snippet, context),
      );
    case 'examZhPaper':
      return mathSnippetRegistry.filter(
        (snippet) =>
          (snippet.source === 'examZhPaper' || snippet.source === 'appPlaceholder') &&
          isMathSnippetApplicable(snippet, context),
      );
  }
}

function clampSelectionIndex(index: number, max: number): number {
  return Math.min(Math.max(index, 0), max);
}
