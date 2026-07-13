// @vitest-environment jsdom

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import './test/setup-dom';
import { ChoiceAnswerPicker } from './ChoiceAnswerPicker';
import type { ChoiceAnswerOption } from './choice-answer-picker-state';

const options: ChoiceAnswerOption[] = [
  { id: 'a', label: 'A', summary: '第一项' },
  { id: 'b', label: 'B', summary: '第二项' },
  { id: 'c', label: 'C', summary: '第三项' },
];

function PickerHarness({ multiple, initial }: { multiple: boolean; initial: string[] }) {
  const [selectedIds, setSelectedIds] = useState(initial);
  return (
    <>
      <ChoiceAnswerPicker
        multiple={multiple}
        options={options}
        selectedIds={selectedIds}
        onChange={setSelectedIds}
      />
      <output aria-label="当前答案">{selectedIds.join(',') || 'none'}</output>
      <button type="button">外部按钮</button>
    </>
  );
}

describe('ChoiceAnswerPicker', () => {
  it('selects a single answer, closes, and returns focus to the stable trigger', async () => {
    const user = userEvent.setup();
    render(<PickerHarness multiple={false} initial={[]} />);

    const trigger = screen.getByRole('button', { name: '正确答案：未设置' });
    const controlsId = trigger.getAttribute('aria-controls');
    expect(controlsId).toBeTruthy();
    await user.click(trigger);

    const listbox = screen.getByRole('listbox', { name: '选择正确答案' });
    expect(listbox.id).toBe(controlsId);
    expect(within(listbox).getAllByRole('option')).toHaveLength(4);
    await waitFor(() =>
      expect(within(listbox).getByRole('option', { name: /未设置/ })).toHaveFocus(),
    );

    await user.keyboard('{ArrowDown}{Enter}');
    expect(screen.getByLabelText('当前答案')).toHaveTextContent('a');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('keeps multiple selection open for Space and Enter and supports all navigation keys', async () => {
    const user = userEvent.setup();
    render(<PickerHarness multiple initial={['a']} />);

    const trigger = screen.getByRole('button', { name: /正确答案：A/ });
    await user.click(trigger);
    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
    await waitFor(() => expect(within(listbox).getByRole('option', { name: /A/ })).toHaveFocus());

    await user.keyboard(' ');
    expect(screen.getByLabelText('当前答案')).toHaveTextContent('none');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{End}');
    expect(within(listbox).getByRole('option', { name: /C/ })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(within(listbox).getByRole('option', { name: /A/ })).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(within(listbox).getByRole('option', { name: /C/ })).toHaveFocus();
    await user.keyboard('{ArrowDown}{Enter}');
    expect(screen.getByLabelText('当前答案')).toHaveTextContent('a');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('keeps warnings and clear controls outside listbox semantics and closes on outside focus', async () => {
    const user = userEvent.setup();
    render(<PickerHarness multiple initial={['a', 'missing']} />);

    const trigger = screen.getByRole('button', { name: /正确答案：A/ });
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    await user.click(trigger);

    const listbox = screen.getByRole('listbox');
    const warning = screen.getByText(/1 个答案引用已失效/);
    const clear = screen.getByRole('button', { name: '清空选择' });
    expect(listbox).not.toContainElement(warning);
    expect(listbox).not.toContainElement(clear);
    await waitFor(() => expect(within(listbox).getByRole('option', { name: /A/ })).toHaveFocus());

    await user.tab();
    expect(clear).toHaveFocus();
    await user.click(clear);
    expect(screen.getByLabelText('当前答案')).toHaveTextContent('none');

    const outside = screen.getByRole('button', { name: '外部按钮' });
    outside.focus();
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    expect(outside).toHaveFocus();
  });
});
