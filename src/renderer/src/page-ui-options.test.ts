import { describe, expect, it } from 'vitest';

import { createEmptyExamDocument } from '../../shared/document';
import {
  getA3FooterTypeSelection,
  getPageColumnLineVisible,
  getPageFooterModeSelection,
  getPageFooterVisible,
  getPageSizeSelection,
  setA3FooterType,
  setPageColumnLineVisible,
  setPageFooterMode,
  setPageFooterVisible,
  setPageSize,
} from './page-ui-options';

describe('page UI options', () => {
  it('uses sparse defaults and applies semantic settings', () => {
    let document = createEmptyExamDocument('page-ui');
    expect(getPageSizeSelection(document)).toBe('a4paper');
    expect(getPageFooterVisible(document)).toBe(true);
    expect(getPageFooterModeSelection(document)).toBe('subject');

    document = setPageSize(document, 'a3paper');
    document = setA3FooterType(document, 'common');
    document = setPageColumnLineVisible(document, true);
    document = setPageFooterVisible(document, false);

    expect(document.setup.page).toEqual({
      size: 'a3paper',
      a3FooterType: 'common',
      showColumnLine: true,
      showFooter: false,
    });
    expect(getA3FooterTypeSelection(document)).toBe('common');
    expect(getPageColumnLineVisible(document)).toBe(true);
  });

  it('clears scoped and global conflicts without removing unrelated options', () => {
    let document = createEmptyExamDocument('page-conflicts');
    document.setup.page = {
      examZhOptions: { size: 'unexpected', 'show-head': true },
    };
    document.setup.examZhOptions = {
      'page/size': 'a3paper',
      page: { 'show-foot': false, 'head-content': '页眉' },
      'draft/show-draft': 'manual',
    };

    document = setPageSize(document, 'a4paper');
    document = setPageFooterVisible(document, true);

    expect(document.setup.page?.examZhOptions).toEqual({ 'show-head': true });
    expect(document.setup.examZhOptions).toEqual({
      page: { 'head-content': '页眉' },
      'draft/show-draft': 'manual',
    });
  });

  it('preserves raw footer content until a teacher selects an application mode', () => {
    let document = createEmptyExamDocument('page-footer-preserved');
    document.setup.page = { examZhOptions: { 'foot-content': '原始;页' } };
    expect(getPageFooterModeSelection(document)).toBe('preserved');

    document = setPageFooterMode(document, 'custom', '第{{页码}}页');
    expect(document.setup.page).toEqual({
      footerMode: 'custom',
      footerTemplate: '第{{页码}}页',
    });
  });
});
