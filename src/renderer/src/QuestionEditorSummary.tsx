import { Fragment } from 'react';

import { CompactRichContent } from './CompactRichContent';
import type { QuestionEditorSummary } from './question-editor-state';

export function QuestionCollapsedSummary({ summary }: { summary: QuestionEditorSummary }) {
  return (
    <span className="question-collapsed-summary">
      <span className="question-collapsed-stem">
        {summary.stemBlocks ? (
          <CompactRichContent blocks={summary.stemBlocks} fallback="未填写题干" />
        ) : (
          summary.stemText
        )}
      </span>
      <QuestionAnswerSummary summary={summary} />
    </span>
  );
}

export function QuestionAnswerSummary({ summary }: { summary: QuestionEditorSummary }) {
  return (
    <span
      className={`question-answer-summary ${
        summary.tone === 'warning' ? 'question-answer-summary-warning' : ''
      }`}
    >
      <span className="question-answer-lead">{summary.answerLead}</span>
      {summary.answerParts.length > 0 ? <span aria-hidden="true"> · </span> : null}
      {summary.answerParts.map((part, index) => (
        <Fragment key={part.key}>
          {index > 0 ? <span aria-hidden="true">；</span> : null}
          <span
            className={`question-answer-part ${
              part.tone === 'warning' ? 'question-answer-part-warning' : ''
            }`}
          >
            {part.label ? <span className="question-answer-label">{part.label}</span> : null}
            {part.blocks ? <CompactRichContent blocks={part.blocks} /> : part.text}
          </span>
        </Fragment>
      ))}
    </span>
  );
}
