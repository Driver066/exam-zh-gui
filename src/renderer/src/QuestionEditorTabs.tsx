import { useRef, type KeyboardEvent, type ReactNode } from 'react';

import { TooltipAnchor } from './TooltipAnchor';
import {
  getQuestionEditorTabKeyboardTarget,
  type QuestionEditorTabDescriptor,
  type QuestionEditorTabId,
} from './question-editor-state';

export interface QuestionEditorTabPanel {
  id: QuestionEditorTabId;
  content: ReactNode;
}

export function QuestionEditorTabs({
  questionId,
  descriptors,
  panels,
  activeTab,
  onChange,
}: {
  questionId: string;
  descriptors: readonly QuestionEditorTabDescriptor[];
  panels: readonly QuestionEditorTabPanel[];
  activeTab: QuestionEditorTabId;
  onChange(tabId: QuestionEditorTabId): void;
}) {
  const tabRefs = useRef<Partial<Record<QuestionEditorTabId, HTMLButtonElement | null>>>({});
  const availableTabs = descriptors.map((descriptor) => descriptor.id);
  const safeQuestionId = questionId.replace(/[^a-zA-Z0-9_-]/g, '-');

  function selectAndFocus(tabId: QuestionEditorTabId): void {
    onChange(tabId);
    requestAnimationFrame(() => tabRefs.current[tabId]?.focus());
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    tabId: QuestionEditorTabId,
  ): void {
    if (
      event.key !== 'ArrowLeft' &&
      event.key !== 'ArrowRight' &&
      event.key !== 'Home' &&
      event.key !== 'End'
    ) {
      return;
    }

    event.preventDefault();
    selectAndFocus(getQuestionEditorTabKeyboardTarget(availableTabs, tabId, event.key));
  }

  return (
    <div className="question-editor-tabs">
      <div
        className="question-editor-tablist"
        role="tablist"
        aria-label="题目编辑内容"
        style={{ gridTemplateColumns: `repeat(${descriptors.length}, minmax(0, 1fr))` }}
      >
        {descriptors.map((descriptor) => {
          const selected = descriptor.id === activeTab;
          const tabId = `question-tab-${safeQuestionId}-${descriptor.id}`;
          const panelId = `question-tabpanel-${safeQuestionId}-${descriptor.id}`;

          return (
            <TooltipAnchor
              key={descriptor.id}
              text={descriptor.tooltip}
              className="question-editor-tab-tooltip"
            >
              <button
                ref={(element) => {
                  tabRefs.current[descriptor.id] = element;
                }}
                id={tabId}
                type="button"
                role="tab"
                className={`question-editor-tab ${
                  descriptor.tone === 'warning' ? 'question-editor-tab-warning' : ''
                }`}
                aria-selected={selected}
                aria-controls={panelId}
                tabIndex={selected ? 0 : -1}
                onClick={() => onChange(descriptor.id)}
                onKeyDown={(event) => handleKeyDown(event, descriptor.id)}
              >
                <span className="question-editor-tab-label">{descriptor.label}</span>
                <span className="question-editor-tab-summary">{descriptor.summary}</span>
              </button>
            </TooltipAnchor>
          );
        })}
      </div>

      <div className="question-editor-tabpanels">
        {panels.map((panel) => {
          const tabId = `question-tab-${safeQuestionId}-${panel.id}`;
          const panelId = `question-tabpanel-${safeQuestionId}-${panel.id}`;

          return (
            <div
              key={panel.id}
              id={panelId}
              className="question-editor-tabpanel"
              role="tabpanel"
              aria-labelledby={tabId}
              hidden={panel.id !== activeTab}
            >
              {panel.content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
