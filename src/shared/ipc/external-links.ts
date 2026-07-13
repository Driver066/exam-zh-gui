export type ExternalLinkTarget = 'authorGitHub' | 'projectIssues';

const externalLinkUrls: Record<ExternalLinkTarget, string> = {
  authorGitHub: 'https://github.com/Driver066',
  projectIssues: 'https://github.com/Driver066/exam-zh-gui/issues',
};

export function resolveExternalLinkUrl(target: unknown): string | null {
  if (target !== 'authorGitHub' && target !== 'projectIssues') {
    return null;
  }

  return externalLinkUrls[target];
}
