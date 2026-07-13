import type { RichContentBlock } from '../../shared/document';

export interface ChoiceAnswerOption {
  id: string;
  label: string;
  summary: string;
  content?: RichContentBlock[];
}

export interface ChoiceAnswerTriggerSummary {
  text: string;
  invalidCount: number;
}

export function formatChoiceAnswerTrigger(
  options: ChoiceAnswerOption[],
  selectedIds: string[],
  multiple: boolean,
): ChoiceAnswerTriggerSummary {
  const optionMap = new Map(options.map((option) => [option.id, option]));
  const selected = selectedIds.flatMap((id) => {
    const option = optionMap.get(id);
    return option ? [option] : [];
  });
  const invalidCount = selectedIds.length - selected.length;

  if (selected.length === 0) {
    return { text: invalidCount > 0 ? '答案引用失效' : '未设置', invalidCount };
  }

  if (!multiple) {
    return { text: formatAnswerOption(selected[0]!), invalidCount };
  }

  const visible = selected.slice(0, 2).map(formatAnswerOption).join('；');
  const remaining = selected.length - 2;
  return { text: remaining > 0 ? `${visible}；+${remaining} 项` : visible, invalidCount };
}

export function toggleMultipleChoiceAnswer(
  options: ChoiceAnswerOption[],
  selectedIds: string[],
  choiceId: string,
): string[] {
  const selected = new Set(selectedIds);
  if (selected.has(choiceId)) selected.delete(choiceId);
  else selected.add(choiceId);
  return options.map((option) => option.id).filter((id) => selected.has(id));
}

function formatAnswerOption(option: ChoiceAnswerOption): string {
  return `${option.label} ${option.summary || '暂无内容'}`;
}
