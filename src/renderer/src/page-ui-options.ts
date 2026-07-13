import type {
  ExamDocument,
  ExamZhOptionBag,
  ExamZhOptionValue,
  PageSetup,
} from '../../shared/document';

export type PageSizeSelection = 'a4paper' | 'a3paper' | 'custom';
export type PageFooterModeSelection = 'subject' | 'pageOnly' | 'custom' | 'preserved';
export type A3FooterTypeSelection = 'separate' | 'common' | 'custom';

type ManagedPageOptionKey = 'size' | 'show-foot' | 'foot-type' | 'foot-content' | 'show-columnline';

export function getPageSizeSelection(document: Pick<ExamDocument, 'setup'>): PageSizeSelection {
  const value = getEffectivePageOptions(document).size;
  return value === 'a4paper' || value === 'a3paper'
    ? value
    : value === undefined
      ? 'a4paper'
      : 'custom';
}

export function getPageFooterVisible(document: Pick<ExamDocument, 'setup'>): boolean {
  const value = getEffectivePageOptions(document)['show-foot'];
  return typeof value === 'boolean' ? value : true;
}

export function getPageFooterModeSelection(
  document: Pick<ExamDocument, 'setup'>,
): PageFooterModeSelection {
  if (getExplicitPageOption(document, 'foot-content') !== undefined) {
    return 'preserved';
  }

  return document.setup.page?.footerMode ?? 'subject';
}

export function getA3FooterTypeSelection(
  document: Pick<ExamDocument, 'setup'>,
): A3FooterTypeSelection {
  const value = getEffectivePageOptions(document)['foot-type'];
  return value === 'common' || value === 'separate'
    ? value
    : value === undefined
      ? 'separate'
      : 'custom';
}

export function getPageColumnLineVisible(document: Pick<ExamDocument, 'setup'>): boolean {
  const value = getEffectivePageOptions(document)['show-columnline'];
  return typeof value === 'boolean' ? value : false;
}

export function setPageSize(
  document: ExamDocument,
  selection: Exclude<PageSizeSelection, 'custom'>,
): ExamDocument {
  return setSemanticPageValue(document, 'size', selection === 'a4paper' ? undefined : selection);
}

export function setPageFooterVisible(document: ExamDocument, visible: boolean): ExamDocument {
  return setSemanticPageValue(document, 'showFooter', visible ? undefined : false, 'show-foot');
}

export function setPageFooterMode(
  document: ExamDocument,
  mode: Exclude<PageFooterModeSelection, 'preserved'>,
  template?: string,
): ExamDocument {
  let next = removeManagedPageOption(document, 'foot-content');
  const page = { ...(next.setup.page ?? {}) };

  if (mode === 'subject') {
    delete page.footerMode;
    delete page.footerTemplate;
  } else {
    page.footerMode = mode;
    if (mode === 'custom') {
      page.footerTemplate = template;
    } else {
      delete page.footerTemplate;
    }
  }

  next = setPageSetup(next, page);
  return next;
}

export function setA3FooterType(
  document: ExamDocument,
  selection: Exclude<A3FooterTypeSelection, 'custom'>,
): ExamDocument {
  return setSemanticPageValue(
    document,
    'a3FooterType',
    selection === 'separate' ? undefined : selection,
    'foot-type',
  );
}

export function setPageColumnLineVisible(document: ExamDocument, visible: boolean): ExamDocument {
  return setSemanticPageValue(
    document,
    'showColumnLine',
    visible ? true : undefined,
    'show-columnline',
  );
}

function getEffectivePageOptions(document: Pick<ExamDocument, 'setup'>): ExamZhOptionBag {
  const semantic: ExamZhOptionBag = {};
  const page = document.setup.page;

  if (page?.size !== undefined) semantic.size = page.size;
  if (page?.showFooter !== undefined) semantic['show-foot'] = page.showFooter;
  if (page?.a3FooterType !== undefined) semantic['foot-type'] = page.a3FooterType;
  if (page?.showColumnLine !== undefined) semantic['show-columnline'] = page.showColumnLine;

  return {
    ...semantic,
    ...normalizeScopedPageOptions(page?.examZhOptions),
    ...extractGlobalPageOptions(document.setup.examZhOptions),
  };
}

function getExplicitPageOption(
  document: Pick<ExamDocument, 'setup'>,
  key: ManagedPageOptionKey,
): ExamZhOptionValue | undefined {
  const global = extractGlobalPageOptions(document.setup.examZhOptions);
  if (Object.hasOwn(global, key)) return global[key];
  const scoped = normalizeScopedPageOptions(document.setup.page?.examZhOptions);
  return scoped[key];
}

function setSemanticPageValue<K extends keyof PageSetup>(
  document: ExamDocument,
  semanticKey: K,
  value: PageSetup[K] | undefined,
  optionKey: ManagedPageOptionKey = semanticKey === 'size'
    ? 'size'
    : (semanticKey as ManagedPageOptionKey),
): ExamDocument {
  const next = removeManagedPageOption(document, optionKey);
  const page = { ...(next.setup.page ?? {}) };

  if (value === undefined) {
    delete page[semanticKey];
  } else {
    page[semanticKey] = value;
  }

  return setPageSetup(next, page);
}

function removeManagedPageOption(document: ExamDocument, key: ManagedPageOptionKey): ExamDocument {
  const setup = { ...document.setup };
  const page = setup.page ? { ...setup.page } : undefined;
  const scoped = page ? normalizeScopedPageOptions(page.examZhOptions) : undefined;
  if (scoped) delete scoped[key];
  if (page) page.examZhOptions = nonEmptyBag(scoped);

  const global = { ...(setup.examZhOptions ?? {}) };
  delete global[`page/${key}`];
  const nestedPage = isOptionBag(global.page) ? { ...global.page } : undefined;
  if (nestedPage) {
    delete nestedPage[key];
    if (Object.keys(nestedPage).length > 0) global.page = nestedPage;
    else delete global.page;
  }

  setup.examZhOptions = nonEmptyBag(global);
  setup.page = page && hasPageValues(page) ? page : undefined;
  return { ...document, setup };
}

function setPageSetup(document: ExamDocument, page: PageSetup): ExamDocument {
  const setup = { ...document.setup };
  setup.page = hasPageValues(page) ? page : undefined;
  return { ...document, setup };
}

function normalizeScopedPageOptions(options: ExamZhOptionBag | undefined): ExamZhOptionBag {
  if (!options) return {};
  const normalized: ExamZhOptionBag = {};
  const nested = isOptionBag(options.page) ? options.page : undefined;
  if (nested) Object.assign(normalized, nested);

  for (const [key, value] of Object.entries(options)) {
    if (key.startsWith('page/')) normalized[key.slice('page/'.length)] = value;
    else if (key !== 'page' || !isOptionBag(value)) normalized[key] = value;
  }

  return normalized;
}

function extractGlobalPageOptions(options: ExamZhOptionBag | undefined): ExamZhOptionBag {
  if (!options) return {};
  const result: ExamZhOptionBag = {};
  const nested = isOptionBag(options.page) ? options.page : undefined;
  if (nested) Object.assign(result, nested);

  for (const [key, value] of Object.entries(options)) {
    if (key.startsWith('page/')) result[key.slice('page/'.length)] = value;
  }

  return result;
}

function nonEmptyBag(options: ExamZhOptionBag | undefined): ExamZhOptionBag | undefined {
  return options && Object.keys(options).length > 0 ? options : undefined;
}

function hasPageValues(page: PageSetup): boolean {
  return Object.values(page).some((value) => value !== undefined);
}

function isOptionBag(value: ExamZhOptionValue | undefined): value is ExamZhOptionBag {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
