// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import './test/setup-dom';
import { QuestionEditorTabs } from './QuestionEditorTabs';
import type { QuestionEditorTabDescriptor, QuestionEditorTabId } from './question-editor-state';

const descriptors: QuestionEditorTabDescriptor[] = [
  { id: 'answer', label: '答案', summary: 'A', tooltip: '编辑答案', tone: 'neutral' },
  { id: 'settings', label: '设置', summary: '5 分', tooltip: '编辑设置', tone: 'neutral' },
  { id: 'teacher', label: '解析与评分', summary: '待完善', tooltip: '编辑解析', tone: 'warning' },
];

function TabsHarness() {
  const [activeTab, setActiveTab] = useState<QuestionEditorTabId>('answer');
  return (
    <QuestionEditorTabs
      questionId="question:1"
      descriptors={descriptors}
      activeTab={activeTab}
      onChange={setActiveTab}
      panels={descriptors.map((descriptor) => ({
        id: descriptor.id,
        content: <p>{descriptor.label}面板</p>,
      }))}
    />
  );
}

function expectActiveTab(label: string) {
  const tablist = screen.getByRole('tablist', { name: '题目编辑内容' });
  const tabs = within(tablist).getAllByRole('tab');
  const active = within(tablist).getByRole('tab', { name: new RegExp(label) });
  expect(active).toHaveAttribute('aria-selected', 'true');
  expect(active).toHaveAttribute('tabindex', '0');
  expect(tabs.filter((tab) => tab.tabIndex === 0)).toHaveLength(1);
  const panelId = active.getAttribute('aria-controls');
  const panel = panelId ? document.getElementById(panelId) : null;
  expect(panel).toHaveAttribute('role', 'tabpanel');
  expect(panel).not.toHaveAttribute('hidden');
  expect(panel).toHaveAttribute('aria-labelledby', active.id);
}

describe('QuestionEditorTabs', () => {
  it('keeps all panels mounted with a complete tab relationship', () => {
    render(<TabsHarness />);

    expectActiveTab('答案');
    const panels = screen.getAllByRole('tabpanel', { hidden: true });
    expect(panels).toHaveLength(3);
    expect(panels.filter((panel) => panel.hidden)).toHaveLength(2);
  });

  it('automatically activates and focuses wrapped arrows, Home, and End', async () => {
    const user = userEvent.setup();
    render(<TabsHarness />);

    const answer = screen.getByRole('tab', { name: /答案/ });
    answer.focus();
    await user.keyboard('{ArrowLeft}');
    await waitFor(() => expect(screen.getByRole('tab', { name: /解析与评分/ })).toHaveFocus());
    expectActiveTab('解析与评分');

    await user.keyboard('{Home}');
    await waitFor(() => expect(answer).toHaveFocus());
    expectActiveTab('答案');

    await user.keyboard('{ArrowRight}');
    await waitFor(() => expect(screen.getByRole('tab', { name: /设置/ })).toHaveFocus());
    expectActiveTab('设置');

    await user.keyboard('{End}');
    await waitFor(() => expect(screen.getByRole('tab', { name: /解析与评分/ })).toHaveFocus());
    expectActiveTab('解析与评分');
  });

  it('supports pointer, Enter, and Space activation without taking over vertical arrows', async () => {
    const user = userEvent.setup();
    render(<TabsHarness />);

    const settings = screen.getByRole('tab', { name: /设置/ });
    await user.click(settings);
    expectActiveTab('设置');

    const teacher = screen.getByRole('tab', { name: /解析与评分/ });
    teacher.focus();
    await user.keyboard('{Enter}');
    expectActiveTab('解析与评分');

    const answer = screen.getByRole('tab', { name: /答案/ });
    answer.focus();
    await user.keyboard(' ');
    expectActiveTab('答案');

    expect(fireEvent.keyDown(answer, { key: 'ArrowDown' })).toBe(true);
    expect(answer).toHaveFocus();
    expectActiveTab('答案');
  });
});
