import { Check, ChevronDown, TriangleAlert } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';

import {
  formatChoiceAnswerTrigger,
  toggleMultipleChoiceAnswer,
  type ChoiceAnswerOption,
} from './choice-answer-picker-state';
import { CompactRichContent } from './CompactRichContent';

export function ChoiceAnswerPicker({
  multiple,
  options,
  selectedIds,
  onChange,
}: {
  multiple: boolean;
  options: ChoiceAnswerOption[];
  selectedIds: string[];
  onChange(selectedIds: string[]): void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const initialFocusIndexRef = useRef(0);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 280 });
  const generatedListboxId = useId();
  const listboxId = `choice-answer-${generatedListboxId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedOptions = selectedIds.flatMap((id) => {
    const option = options.find((candidate) => candidate.id === id);
    return option ? [option] : [];
  });
  const triggerSummary = formatChoiceAnswerTrigger(options, selectedIds, multiple);

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(Math.max(0, window.innerWidth - 16), Math.max(240, rect.width), 420);
    const height = popoverRef.current?.offsetHeight ?? 280;
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
    const below = rect.bottom + 4;
    const top =
      below + height <= window.innerHeight - 8 ? below : Math.max(8, rect.top - height - 4);
    setPosition({ top, left, width });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const frame = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(frame);
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() =>
      optionRefs.current[initialFocusIndexRef.current]?.focus(),
    );
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !popoverRef.current?.contains(target)) close(false);
    };
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as Node;
      if (!popoverRef.current?.contains(target)) close(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('focusin', handleFocusIn);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [close, open, updatePosition]);

  const listOptions = multiple
    ? options
    : [{ id: '', label: '未设置', summary: '不指定正确答案' }, ...options];

  function selectOption(optionId: string): void {
    if (!multiple) {
      onChange(optionId ? [optionId] : []);
      close(true);
      return;
    }
    onChange(toggleMultipleChoiceAnswer(options, selectedIds, optionId));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const items = optionRefs.current.filter((item): item is HTMLButtonElement => item !== null);
    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
    let nextIndex = currentIndex < 0 ? 0 : currentIndex;
    if (event.key === 'ArrowDown') nextIndex = (nextIndex + 1) % items.length;
    else if (event.key === 'ArrowUp') nextIndex = (nextIndex - 1 + items.length) % items.length;
    else if (event.key === 'Home') nextIndex = 0;
    else nextIndex = items.length - 1;
    items[nextIndex]?.focus();
  }

  return (
    <div ref={rootRef} className="choice-answer-picker">
      <span className="choice-answer-picker-label">正确答案</span>
      <button
        ref={triggerRef}
        type="button"
        className={`choice-answer-picker-trigger ${
          triggerSummary.invalidCount > 0 ? 'choice-answer-picker-trigger-warning' : ''
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-invalid={triggerSummary.invalidCount > 0 || undefined}
        aria-label={`正确答案：${triggerSummary.text}`}
        onClick={() =>
          setOpen((current) => {
            if (!current) {
              const selectedIndex = multiple
                ? options.findIndex((option) => selected.has(option.id))
                : selectedIds.length === 0
                  ? 0
                  : options.findIndex((option) => option.id === selectedIds[0]) + 1;
              initialFocusIndexRef.current = Math.max(0, selectedIndex);
            }
            return !current;
          })
        }
      >
        {triggerSummary.invalidCount > 0 ? <TriangleAlert aria-hidden="true" size={15} /> : null}
        <span className="choice-answer-picker-trigger-copy">
          {selectedOptions.length === 0 ? (
            triggerSummary.text
          ) : (
            <>
              {selectedOptions.slice(0, multiple ? 2 : 1).map((option, index) => (
                <span key={option.id} className="choice-answer-picker-trigger-option">
                  {index > 0 ? <span aria-hidden="true">；</span> : null}
                  <strong>{option.label}</strong>
                  <CompactRichContent blocks={option.content} fallback={option.summary} />
                </span>
              ))}
              {multiple && selectedOptions.length > 2 ? (
                <span className="choice-answer-picker-trigger-more">
                  ；+{selectedOptions.length - 2} 项
                </span>
              ) : null}
            </>
          )}
        </span>
        <ChevronDown aria-hidden="true" size={15} />
      </button>

      {open
        ? createPortal(
            <div
              ref={popoverRef}
              className="choice-answer-picker-popover"
              style={position}
              onKeyDown={handleKeyDown}
            >
              {triggerSummary.invalidCount > 0 ? (
                <div className="choice-answer-picker-warning">
                  当前有 {triggerSummary.invalidCount} 个答案引用已失效；重新选择后会清理。
                </div>
              ) : null}
              <div
                id={listboxId}
                role="listbox"
                aria-label="选择正确答案"
                aria-multiselectable={multiple || undefined}
              >
                {listOptions.map((option, index) => {
                  const isSelected = option.id ? selected.has(option.id) : selectedIds.length === 0;
                  return (
                    <button
                      key={option.id || 'unset'}
                      ref={(element) => {
                        optionRefs.current[index] = element;
                      }}
                      type="button"
                      className={`choice-answer-picker-option ${
                        isSelected ? 'choice-answer-picker-option-selected' : ''
                      }`}
                      role="option"
                      aria-selected={isSelected}
                      tabIndex={-1}
                      onClick={() => selectOption(option.id)}
                    >
                      <span className="choice-answer-picker-mark">
                        {multiple ? (
                          <span className="choice-answer-picker-checkbox" aria-hidden="true">
                            {isSelected ? <Check size={13} /> : null}
                          </span>
                        ) : isSelected ? (
                          <Check aria-hidden="true" size={15} />
                        ) : null}
                      </span>
                      <span className="choice-answer-picker-option-copy">
                        <strong>{option.label}</strong>
                        <span>
                          <CompactRichContent
                            blocks={option.content}
                            fallback={option.summary || '暂无内容'}
                          />
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {multiple && selectedIds.length > 0 ? (
                <button
                  type="button"
                  className="choice-answer-picker-clear"
                  onClick={() => onChange([])}
                >
                  清空选择
                </button>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
