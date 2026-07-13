import { describe, expect, it } from 'vitest';

import {
  buildPageFooterContent,
  compileFooterTemplate,
  validateFooterTemplate,
} from './page-options';

describe('page footer options', () => {
  it('builds subject, empty-subject, page-only, and hidden footer content', () => {
    expect(buildPageFooterContent(undefined, '物理')).toBe('物理试题第;页（共~;页）');
    expect(buildPageFooterContent(undefined, '  ')).toBe('试题第;页（共~;页）');
    expect(buildPageFooterContent({ footerMode: 'pageOnly' }, '数学')).toBe('第;页（共~;页）');
    expect(buildPageFooterContent({ showFooter: false }, '数学')).toBeUndefined();
  });

  it('compiles custom templates with zero, one, or two page placeholders', () => {
    expect(compileFooterTemplate('{{科目}}考试', '物理')).toBe('物理考试');
    expect(compileFooterTemplate('第{{页码}}页', '数学')).toBe('第;页');
    expect(compileFooterTemplate('第{{页码}}页，共{{总页数}}页', '数学')).toBe('第;页，共;页');
  });

  it('rejects unsupported, duplicate, reordered, and raw semicolon templates', () => {
    expect(validateFooterTemplate('{{学校}}')).toMatchObject({ valid: false });
    expect(validateFooterTemplate('{{页码}}{{页码}}')).toMatchObject({ valid: false });
    expect(validateFooterTemplate('{{总页数}}{{页码}}')).toMatchObject({ valid: false });
    expect(validateFooterTemplate('第;页')).toMatchObject({ valid: false });
  });
});
