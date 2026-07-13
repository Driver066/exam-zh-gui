import { describe, expect, it } from 'vitest';

import { resolveExternalLinkUrl } from './external-links';

describe('external link allowlist', () => {
  it('resolves known external link targets', () => {
    expect(resolveExternalLinkUrl('authorGitHub')).toBe('https://github.com/Driver066');
    expect(resolveExternalLinkUrl('projectIssues')).toBe(
      'https://github.com/Driver066/exam-zh-gui/issues',
    );
  });

  it('rejects unknown external link targets', () => {
    expect(resolveExternalLinkUrl('https://example.com')).toBeNull();
    expect(resolveExternalLinkUrl(null)).toBeNull();
  });
});
