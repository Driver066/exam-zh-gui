import type { BlankSlot, ExamDocument, ExamZhOptionBag, ExamZhOptionValue } from './model';

export function buildEffectiveFillinOptions(
  document: Pick<ExamDocument, 'setup'>,
  blank?: BlankSlot,
): ExamZhOptionBag {
  const options: ExamZhOptionBag = {};
  const fillin = document.setup.fillin;

  if (fillin?.type !== undefined) {
    options.type = fillin.type;
  }

  if (fillin?.width !== undefined) {
    options.width = fillin.width;
  }

  if (document.setup.answerMode === 'teacher' && fillin?.answerColor === 'red') {
    options['text-color'] = 'red';
  }

  applyScopedFillinOptions(options, fillin?.examZhOptions);
  applyExamSetupFillinOptions(options, document.setup.examZhOptions);
  options['show-answer'] = document.setup.answerMode === 'teacher';

  if (blank) {
    if (blank.width !== undefined) {
      options.width = blank.width;
    }

    if (blank.type !== undefined) {
      options.type = blank.type;
    }

    if (blank.noAnswerType !== undefined) {
      options['no-answer-type'] = blank.noAnswerType;
    }

    if (blank.widthType !== undefined) {
      options['width-type'] = blank.widthType;
    }

    if (blank.parenType !== undefined) {
      options['paren-type'] = blank.parenType;
    }

    applyScopedFillinOptions(options, blank.examZhOptions);
  }

  return options;
}

function applyExamSetupFillinOptions(
  target: ExamZhOptionBag,
  source: ExamZhOptionBag | undefined,
): void {
  if (!source) {
    return;
  }

  for (const [key, value] of Object.entries(source)) {
    if (key.startsWith('fillin/')) {
      target[key.slice('fillin/'.length)] = value;
    } else if (key === 'fillin' && isOptionBagValue(value)) {
      applyScopedFillinOptions(target, value);
    }
  }
}

function applyScopedFillinOptions(
  target: ExamZhOptionBag,
  source: ExamZhOptionBag | undefined,
): void {
  if (!source) {
    return;
  }

  for (const [key, value] of Object.entries(source)) {
    if (key.startsWith('fillin/')) {
      target[key.slice('fillin/'.length)] = value;
    } else if (key === 'fillin' && isOptionBagValue(value)) {
      applyScopedFillinOptions(target, value);
    } else {
      target[key] = value;
    }
  }
}

function isOptionBagValue(value: ExamZhOptionValue): value is ExamZhOptionBag {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
