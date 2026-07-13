import { ChevronDown, LayoutTemplate } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';

import {
  examDocumentTemplates,
  type ExamDocumentTemplate,
  type ExamDocumentTemplateCategory,
  type ExamDocumentTemplateId,
} from '../../shared/document';
import { TooltipAnchor } from './TooltipAnchor';

interface TemplatePickerProps {
  compact: boolean;
  onSelect(templateId: ExamDocumentTemplateId): void;
}

const templateCategoryLabels: Record<ExamDocumentTemplateCategory, string> = {
  starter: '开始编辑',
  example: '示例与学习',
};

const templateCategories: ExamDocumentTemplateCategory[] = ['starter', 'example'];

export function TemplatePicker({ compact, onSelect }: TemplatePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);

  const closeMenu = useCallback((restoreFocus: boolean) => {
    setOpen(false);

    if (restoreFocus) {
      requestAnimationFrame(() => triggerRef.current?.focus());
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = requestAnimationFrame(() => itemRefs.current[0]?.focus());
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeMenu(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [closeMenu, open]);

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu(true);
      return;
    }

    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      return;
    }

    event.preventDefault();
    const items = itemRefs.current.filter((item): item is HTMLButtonElement => item !== null);
    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
    let nextIndex = currentIndex < 0 ? 0 : currentIndex;

    if (event.key === 'ArrowDown') {
      nextIndex = (nextIndex + 1) % items.length;
    } else if (event.key === 'ArrowUp') {
      nextIndex = (nextIndex - 1 + items.length) % items.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = items.length - 1;
    }

    items[nextIndex]?.focus();
  }

  function selectTemplate(template: ExamDocumentTemplate): void {
    onSelect(template.id);
    closeMenu(true);
  }

  let itemIndex = 0;

  return (
    <div ref={rootRef} className="template-picker">
      <TooltipAnchor
        text="从模板新建"
        className="toolbar-tooltip-anchor"
        disabled={!compact || open}
      >
        <button
          ref={triggerRef}
          type="button"
          className="tool-button template-picker-trigger"
          aria-label="从模板新建"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? 'template-picker-menu' : undefined}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={(event) => {
            if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
              event.preventDefault();
              setOpen(true);
            }
          }}
        >
          <LayoutTemplate aria-hidden="true" size={17} />
          <span>模板</span>
          <ChevronDown aria-hidden="true" className="template-picker-chevron" size={14} />
        </button>
      </TooltipAnchor>

      {open ? (
        <div
          id="template-picker-menu"
          className="template-picker-menu"
          role="menu"
          aria-label="内置试卷模板"
          onKeyDown={handleMenuKeyDown}
        >
          {templateCategories.map((category) => {
            const templates = examDocumentTemplates.filter(
              (template) => template.category === category,
            );

            return (
              <div key={category} className="template-picker-group" role="group">
                <div className="template-picker-group-label">
                  {templateCategoryLabels[category]}
                </div>
                {templates.map((template) => {
                  const currentIndex = itemIndex++;

                  return (
                    <button
                      key={template.id}
                      ref={(element) => {
                        itemRefs.current[currentIndex] = element;
                      }}
                      type="button"
                      className="template-picker-item"
                      role="menuitem"
                      tabIndex={-1}
                      onClick={() => selectTemplate(template)}
                    >
                      <span className="template-picker-item-name">{template.name}</span>
                      <span className="template-picker-item-description">
                        {template.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
