import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

export function EditorObjectHeader({
  titleId,
  controlsId,
  title,
  selected,
  expanded,
  summary,
  actions,
  onToggle,
}: {
  titleId: string;
  controlsId: string;
  title: string;
  selected: boolean;
  expanded: boolean;
  summary?: ReactNode;
  actions: ReactNode;
  onToggle(): void;
}) {
  return (
    <header className={`editor-object-header ${expanded ? 'editor-object-header-expanded' : ''}`}>
      <button
        type="button"
        className="editor-object-header-main"
        aria-expanded={expanded}
        aria-controls={controlsId}
        aria-current={selected ? 'location' : undefined}
        onClick={onToggle}
      >
        <span className="editor-object-heading-row">
          {expanded ? (
            <ChevronDown aria-hidden="true" size={17} />
          ) : (
            <ChevronRight aria-hidden="true" size={17} />
          )}
          <span id={titleId} className="editor-object-title">
            {title}
          </span>
        </span>
        {!expanded && summary ? <span className="editor-object-summary">{summary}</span> : null}
      </button>
      <div className="editor-object-actions">{actions}</div>
    </header>
  );
}
