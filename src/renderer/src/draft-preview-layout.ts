export function resolveDraftPreviewChoiceColumns(
  columns: number | undefined,
  maxColumns: number | undefined,
  choiceCount: number,
): number {
  const normalizedChoiceCount = Math.max(0, Math.floor(choiceCount));

  if (normalizedChoiceCount === 0) {
    return 0;
  }

  const configuredColumns = Number.isFinite(columns)
    ? Math.min(4, Math.max(1, Math.floor(columns ?? 1)))
    : undefined;
  const normalizedMaxColumns = Number.isFinite(maxColumns)
    ? Math.min(4, Math.max(1, Math.floor(maxColumns ?? 4)))
    : 4;

  return Math.min(normalizedChoiceCount, configuredColumns ?? normalizedMaxColumns);
}
