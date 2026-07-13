export interface IpcError {
  code: string;
  message: string;
}

export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: IpcError };

export function ok<T>(data: T): IpcResult<T> {
  return { ok: true, data };
}

export function fail<T = never>(code: string, message: string): IpcResult<T> {
  return { ok: false, error: { code, message } };
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function documentValidationErrorMessage(error: unknown): string {
  const issues = readValidationIssues(error);

  if (issues.length === 0) {
    return errorMessage(error);
  }

  const messages = [...new Set(issues.map((issue) => issue.message).filter(Boolean))];
  const summary = messages.slice(0, 3).join('；');
  const suffix = messages.length > 3 ? `；另有 ${messages.length - 3} 个问题` : '';

  return `试卷内容需要处理：${summary}${suffix}`;
}

function readValidationIssues(error: unknown): Array<{ message: string }> {
  if (typeof error !== 'object' || error === null || !('issues' in error)) {
    return [];
  }

  const issues = (error as { issues?: unknown }).issues;

  if (!Array.isArray(issues)) {
    return [];
  }

  return issues.filter(
    (issue): issue is { message: string } =>
      typeof issue === 'object' &&
      issue !== null &&
      'message' in issue &&
      typeof (issue as { message?: unknown }).message === 'string',
  );
}
