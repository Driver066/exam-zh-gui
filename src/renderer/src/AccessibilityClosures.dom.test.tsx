// @vitest-environment jsdom

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import './test/setup-dom';
import { DeleteConfirmationProvider } from './DeleteConfirmation';
import { QuestionActionsMenu } from './QuestionActionsMenu';
import { SectionActionsMenu } from './SectionActionsMenu';
import { ScoringSchemeTable, SolutionAnnotationTable } from './TeacherContentTables';
import { TooltipAnchor } from './TooltipAnchor';

describe('accessibility closure components', () => {
  it('links question and section triggers to their menus and restores focus with Escape', async () => {
    const user = userEvent.setup();
    render(
      <DeleteConfirmationProvider>
        <QuestionActionsMenu
          questionId="q1"
          canMoveUp
          canMoveDown
          onMove={() => undefined}
          onDuplicate={() => undefined}
          onDelete={() => undefined}
        />
        <SectionActionsMenu
          sectionId="s1"
          canMoveUp
          canMoveDown
          onMove={() => undefined}
          onInsert={() => undefined}
          onDuplicate={() => undefined}
          onDelete={() => undefined}
        />
      </DeleteConfirmationProvider>,
    );

    const questionTrigger = screen.getByRole('button', { name: '题目操作' });
    await user.click(questionTrigger);
    const questionMenu = screen.getByRole('menu', { name: '题目操作' });
    expect(questionTrigger).toHaveAttribute('aria-controls', questionMenu.id);
    await waitFor(() =>
      expect(within(questionMenu).getByRole('menuitem', { name: '上移一题' })).toHaveFocus(),
    );
    await user.keyboard('{Escape}');
    await waitFor(() => expect(questionTrigger).toHaveFocus());
    expect(questionTrigger).not.toHaveAttribute('aria-controls');

    const sectionTrigger = screen.getByRole('button', { name: '节操作' });
    await user.click(sectionTrigger);
    const sectionMenu = screen.getByRole('menu', { name: '试卷节操作' });
    expect(sectionTrigger).toHaveAttribute('aria-controls', sectionMenu.id);
    await waitFor(() =>
      expect(within(sectionMenu).getByRole('menuitem', { name: '上移一节' })).toHaveFocus(),
    );
    await user.keyboard('{End}');
    expect(within(sectionMenu).getByRole('menuitem', { name: '删除节' })).toHaveFocus();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(sectionTrigger).toHaveFocus());
    expect(sectionTrigger).not.toHaveAttribute('aria-controls');
  });

  it('only describes a focused tooltip anchor while the tooltip is visible', async () => {
    const user = userEvent.setup();
    let unhandledEscapes = 0;
    render(
      <div
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !event.defaultPrevented) {
            unhandledEscapes += 1;
          }
        }}
      >
        <TooltipAnchor text="说明文字">
          <button type="button">帮助</button>
        </TooltipAnchor>
      </div>,
    );

    const button = screen.getByRole('button', { name: '帮助' });
    expect(button).not.toHaveAttribute('aria-describedby');

    await user.tab();
    const tooltip = await screen.findByRole('tooltip');
    expect(button).toHaveAttribute('aria-describedby', tooltip.id);
    expect(button).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(button).not.toHaveAttribute('aria-describedby');
    expect(button).toHaveFocus();
    expect(unhandledEscapes).toBe(0);

    await user.keyboard('{Escape}');
    expect(unhandledEscapes).toBe(1);
    expect(button).toHaveFocus();
  });

  it('preserves captions, column headers, and row headers in teacher tables', () => {
    render(
      <>
        <ScoringSchemeTable
          ownerLabel="第 1 题"
          expectedPoints={2}
          scoreMode="additive"
          scoreMarks={[
            {
              id: 'score-1',
              points: 2,
              description: [{ type: 'text', text: '过程正确' }],
            },
          ]}
          createId={(prefix) => `${prefix}-new`}
          onScoreModeChange={() => undefined}
          onChange={() => undefined}
          onDelete={() => undefined}
          onLocate={() => undefined}
          onReinsert={() => undefined}
          onInputWarning={() => undefined}
        />
        <SolutionAnnotationTable
          ownerLabel="第 1 题"
          annotations={[{ id: 'annotation-1', content: [{ type: 'text', text: '此处补充说明' }] }]}
          onChange={() => undefined}
          onDelete={() => undefined}
          onLocate={() => undefined}
          onReinsert={() => undefined}
        />
      </>,
    );

    const scoring = screen.getByRole('table', { name: '第 1 题评分方案' });
    expect(within(scoring).getAllByRole('columnheader')).toHaveLength(4);
    expect(within(scoring).getByRole('rowheader', { name: /1.*表尾/ })).toBeInTheDocument();

    const annotations = screen.getByRole('table', { name: '第 1 题解析批注' });
    expect(within(annotations).getAllByRole('columnheader')).toHaveLength(3);
    expect(within(annotations).getByRole('rowheader')).toBeInTheDocument();
  });
});
