export const mathJaxPreviewMacros = {
  eu: '\\mathrm{e}',
  upe: '\\mathrm{e}',
  iu: '\\mathrm{i}',
  upi: '\\mathrm{i}',
  uppi: '\\pi',
  parallelogram: '\\mathrel{\\unicode{x25B1}}',
  paralleleq: '\\mathrel{\\overset{\\scriptscriptstyle /\\!/}{=}}',
  nsubset: '\\not\\subset',
  nsupset: '\\not\\supset',
  nsubsetneqq: '\\not\\subsetneqq',
  nsupsetneqq: '\\not\\supsetneqq',
  backcong: '\\cong',
} as const;

export type MathJaxPreviewMacroName = keyof typeof mathJaxPreviewMacros;

export function normalizeExamZhPreviewLatex(latex: string): string {
  return normalizeExamZhVectorPreviewLatex(normalizeExamZhStarredSymbolPreviewLatex(latex));
}

function normalizeExamZhStarredSymbolPreviewLatex(latex: string): string {
  return latex.replace(examZhStarredSymbolPreviewPattern, (_match, command: string) => {
    return examZhStarredSymbolPreviewReplacements[command] ?? `\\${command}`;
  });
}

function normalizeExamZhVectorPreviewLatex(latex: string): string {
  let normalized = '';
  let index = 0;

  while (index < latex.length) {
    const vecStart = latex.indexOf('\\vec', index);

    if (vecStart === -1) {
      normalized += latex.slice(index);
      break;
    }

    normalized += latex.slice(index, vecStart);

    const commandEnd = vecStart + '\\vec'.length;

    if (isAsciiLetter(latex[commandEnd])) {
      normalized += latex.slice(vecStart, commandEnd);
      index = commandEnd;
      continue;
    }

    const argumentStart = skipWhitespace(latex, commandEnd);

    if (latex[argumentStart] !== '{') {
      const argument = latex[argumentStart];

      if (isAsciiLetter(argument)) {
        normalized += `\\boldsymbol{${argument}}`;
        index = argumentStart + 1;
        continue;
      }

      normalized += latex.slice(vecStart, commandEnd);
      index = commandEnd;
      continue;
    }

    const argumentEnd = findClosingBrace(latex, argumentStart);

    if (argumentEnd === -1) {
      normalized += latex.slice(vecStart);
      break;
    }

    const argument = latex.slice(argumentStart + 1, argumentEnd);
    const replacement =
      countVisibleVectorCharacters(argument) === 1
        ? `\\boldsymbol{${argument}}`
        : `\\overrightarrow{${argument}}`;

    normalized += replacement;
    index = argumentEnd + 1;
  }

  return normalized;
}

const examZhStarredSymbolPreviewReplacements: Record<string, string> = {
  subset: '\\subset',
  nsubset: '\\nsubset',
  subseteq: '\\subseteq',
  nsubseteq: '\\nsubseteq',
  subsetneqq: '\\subsetneqq',
  supset: '\\supset',
  nsupset: '\\nsupset',
  supseteq: '\\supseteq',
  nsupseteq: '\\nsupseteq',
  supsetneqq: '\\supsetneqq',
  cap: '\\cap',
  cup: '\\cup',
  sim: '\\sim',
  cong: '\\backcong',
};

const examZhStarredSymbolPreviewPattern =
  /\\(nsubseteq|subsetneqq|subseteq|nsubset|subset|nsupseteq|supsetneqq|supseteq|nsupset|supset|cap|cup|sim|cong)\*/gu;

export function createMathJaxPreviewConfig() {
  return {
    loader: {
      load: ['input/tex', 'output/svg'],
    },
    tex: {
      packages: { '[+]': ['ams', 'newcommand', 'noundefined'] },
      macros: mathJaxPreviewMacros,
    },
    startup: {
      typeset: false,
    },
  };
}

function skipWhitespace(value: string, start: number): number {
  let index = start;

  while (index < value.length && /\s/u.test(value[index] ?? '')) {
    index += 1;
  }

  return index;
}

function findClosingBrace(value: string, openBraceIndex: number): number {
  let depth = 0;

  for (let index = openBraceIndex; index < value.length; index += 1) {
    const character = value[index];

    if (character === '\\') {
      index += 1;
      continue;
    }

    if (character === '{') {
      depth += 1;
      continue;
    }

    if (character === '}') {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function countVisibleVectorCharacters(argument: string): number {
  return Array.from(argument.replace(/\s/gu, '')).length;
}

function isAsciiLetter(character: string | undefined): boolean {
  return character !== undefined && /[A-Za-z]/u.test(character);
}
