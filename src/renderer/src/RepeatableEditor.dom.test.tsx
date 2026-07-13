// @vitest-environment jsdom

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import './test/setup-dom';
import { DeleteConfirmationProvider } from './DeleteConfirmation';
import {
  RepeatableEditorHeading,
  RepeatableItemHeader,
  RepeatableItemMenu,
} from './RepeatableEditor';

describe('repeatable editor DOM behavior', () => {
  it('connects both disclosures to one controlled region and exposes the add button ref', () => {
    const addButtonRef = createRef<HTMLButtonElement>();
    render(
      <>
        <RepeatableEditorHeading
          title="选项"
          itemCount={2}
          allCollapsed={false}
          onToggleAll={() => undefined}
          addLabel="添加选项"
          addButtonRef={addButtonRef}
          onAdd={() => undefined}
        />
        <RepeatableItemHeader
          identity="A"
          summary="选项内容"
          status="正确"
          collapsed
          controlsId="choice-a-body"
          itemLabel="选项 A"
          onToggle={() => undefined}
        />
        <div id="choice-a-body" hidden />
      </>,
    );

    const disclosures = screen.getAllByRole('button', { name: '展开选项 A' });
    expect(disclosures).toHaveLength(2);
    disclosures.forEach((button) => {
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-controls', 'choice-a-body');
    });
    expect(addButtonRef.current).toBe(screen.getByRole('button', { name: /添加选项/ }));
  });

  it('provides menu relationships, roving keys, separators, Escape, and outside close', async () => {
    const user = userEvent.setup();
    render(
      <>
        <RepeatableItemMenu
          itemLabel="选项 A"
          canMoveUp
          canMoveDown
          onMove={() => undefined}
          onDuplicate={() => undefined}
          deleteKey="choice:a"
          onDelete={() => undefined}
        />
        <button type="button">外部按钮</button>
      </>,
    );

    const trigger = screen.getByRole('button', { name: '选项 A 操作' });
    expect(trigger).not.toHaveAttribute('aria-controls');
    await user.click(trigger);

    const menu = screen.getByRole('menu', { name: '选项 A 操作' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls', menu.id);
    expect(within(menu).getAllByRole('separator')).toHaveLength(2);
    await waitFor(() =>
      expect(within(menu).getByRole('menuitem', { name: '上移选项 A' })).toHaveFocus(),
    );

    await user.keyboard('{End}');
    expect(within(menu).getByRole('menuitem', { name: '删除选项 A' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(within(menu).getByRole('menuitem', { name: '上移选项 A' })).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(within(menu).getByRole('menuitem', { name: '删除选项 A' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(within(menu).getByRole('menuitem', { name: '上移选项 A' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());

    await user.click(trigger);
    const outside = screen.getByRole('button', { name: '外部按钮' });
    await user.click(outside);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(outside).toHaveFocus();
  });

  it('cancels an armed deletion with Escape and focuses the requested fallback after confirmation', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const onDeleteFocus = vi.fn();
    render(
      <DeleteConfirmationProvider>
        <RepeatableItemMenu
          itemLabel="第 1 空"
          deleteKey="blank:1"
          onDelete={onDelete}
          onDeleteFocus={onDeleteFocus}
        />
      </DeleteConfirmationProvider>,
    );

    const trigger = screen.getByRole('button', { name: '第 1 空 操作' });
    await user.click(trigger);
    await user.click(screen.getByRole('menuitem', { name: '删除第 1 空' }));
    expect(screen.getByRole('menuitem', { name: '再次点击删除第 1 空' })).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await user.click(trigger);
    expect(screen.getByRole('menuitem', { name: '删除第 1 空' })).toBeInTheDocument();

    await user.click(screen.getByRole('menuitem', { name: '删除第 1 空' }));
    await user.click(screen.getByRole('menuitem', { name: '再次点击删除第 1 空' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(onDeleteFocus).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
