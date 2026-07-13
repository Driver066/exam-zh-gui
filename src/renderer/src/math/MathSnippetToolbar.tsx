import { useMemo, useState } from 'react';

import { TooltipAnchor } from '../TooltipAnchor';
import { MathPreview } from './MathPreview';
import {
  formatMathSnippetTooltip,
  getMathSnippetGroupsForTab,
  getVisibleMathSnippetTabs,
  isMathPreviewSnippet,
  isMathSnippetCategoryTab,
  type MathSnippet,
  type MathSnippetCategoryId,
  type MathSnippetContext,
  type MathSnippetTabId,
} from './symbols';

interface MathSnippetToolbarProps {
  recentSnippetIds: string[];
  context?: MathSnippetContext;
  onInsert(snippet: MathSnippet): void;
}

export function MathSnippetToolbar({
  recentSnippetIds,
  context,
  onInsert,
}: MathSnippetToolbarProps) {
  const [activeTabId, setActiveTabId] = useState<MathSnippetTabId>('frequent');
  const [activeCategoryByTab, setActiveCategoryByTab] = useState<
    Partial<Record<MathSnippetTabId, MathSnippetCategoryId>>
  >({});
  const tabs = useMemo(
    () => getVisibleMathSnippetTabs(recentSnippetIds, context),
    [context, recentSnippetIds],
  );
  const resolvedTabId = tabs.some((tab) => tab.id === activeTabId) ? activeTabId : tabs[0].id;
  const groups = getMathSnippetGroupsForTab(resolvedTabId, recentSnippetIds, context);
  const categoryGroups = isMathSnippetCategoryTab(resolvedTabId)
    ? groups.filter((group) => group.category !== undefined)
    : [];
  const requestedCategory = activeCategoryByTab[resolvedTabId];
  const resolvedCategoryGroup =
    categoryGroups.find((group) => group.category === requestedCategory) ?? categoryGroups[0];
  const showCategoryNavigation = categoryGroups.length > 1;
  const visibleGroups = isMathSnippetCategoryTab(resolvedTabId)
    ? resolvedCategoryGroup
      ? [resolvedCategoryGroup]
      : []
    : groups;

  return (
    <div className="math-snippet-toolbar" aria-label="数学符号与片段">
      <div className="math-snippet-tabs" role="tablist" aria-label="符号面板分类">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === resolvedTabId}
            className={`math-snippet-tab ${tab.id === resolvedTabId ? 'math-snippet-tab-active' : ''}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setActiveTabId(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {showCategoryNavigation ? (
        <div className="math-snippet-categories" role="tablist" aria-label="当前来源中的数学分类">
          {categoryGroups.map((group) => (
            <button
              key={group.id}
              type="button"
              role="tab"
              aria-selected={group.id === resolvedCategoryGroup?.id}
              className={`math-snippet-category ${
                group.id === resolvedCategoryGroup?.id ? 'math-snippet-category-active' : ''
              }`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                if (!group.category) {
                  return;
                }

                setActiveCategoryByTab((current) => ({
                  ...current,
                  [resolvedTabId]: group.category,
                }));
              }}
            >
              {group.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="math-snippet-tab-panel" role="tabpanel">
        {visibleGroups.map((group) => (
          <div
            key={group.id}
            className={`math-snippet-group ${
              !showCategoryNavigation && group.label ? '' : 'math-snippet-group-flat'
            }`}
          >
            {!showCategoryNavigation && group.label ? (
              <span className="math-snippet-group-label">{group.label}</span>
            ) : null}
            <div className="math-snippet-buttons">
              {group.snippets.map((snippet) => (
                <TooltipAnchor
                  key={snippet.id}
                  text={formatMathSnippetTooltip(snippet)}
                  className="math-snippet-tooltip-anchor"
                >
                  <button
                    type="button"
                    className={`math-snippet-button ${
                      isMathPreviewSnippet(snippet) ? 'math-snippet-button-math' : ''
                    }`}
                    aria-label={`${snippet.description}：插入 ${snippet.insertText}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onInsert(snippet)}
                  >
                    {isMathPreviewSnippet(snippet) && snippet.previewLatex ? (
                      <MathPreview
                        latex={snippet.previewLatex}
                        display={false}
                        fallbackLabel={snippet.label}
                      />
                    ) : (
                      snippet.label
                    )}
                  </button>
                </TooltipAnchor>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
