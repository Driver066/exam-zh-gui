import {
  ArrowDownWideNarrow,
  Info,
  ListEnd,
  LocateFixed,
  Plus,
  TextCursorInput,
} from 'lucide-react';
import { useRef, useState } from 'react';

import {
  buildReferenceContextSummary,
  calculateScoreMarksEffectivePoints,
  collectAnnotationReferenceIds,
  collectScoreReferenceIds,
  commitNumberDraft,
  createScoreMark,
  getScoreItemLabel,
  isScoreLevelOrderDescending,
  moveScoreMarkToSummary,
  parseInlineRichText,
  sortScoreLevelsDescending,
  stringifyInlineRichText,
  type CreateId,
} from '../../shared/document';
import type {
  RichContentBlock,
  ScoreMark,
  ScoreMode,
  SolutionAnnotation,
} from '../../shared/document/model';
import { RepeatableItemMenu } from './RepeatableEditor';
import { getRepeatableDeleteFocusTarget } from './repeatable-editor-state';

export interface ScoringSchemeTableProps {
  ownerLabel: string;
  expectedPoints?: number;
  scoreMode: ScoreMode;
  scoreMarks: ScoreMark[];
  solution?: RichContentBlock[];
  createId: CreateId;
  addDisabled?: boolean;
  helperText?: string;
  onScoreModeChange(scoreMode: ScoreMode): void;
  onChange(scoreMarks: ScoreMark[]): void;
  onDelete(scoreMarkId: string): void;
  onLocate(scoreMarkId: string): void;
  onReinsert(scoreMarkId: string): void;
  onInputWarning(message: string): void;
}

export function ScoringSchemeTable({
  ownerLabel,
  expectedPoints,
  scoreMode,
  scoreMarks,
  solution,
  createId,
  addDisabled = false,
  helperText,
  onScoreModeChange,
  onChange,
  onDelete,
  onLocate,
  onReinsert,
  onInputWarning,
}: ScoringSchemeTableProps) {
  const scoreItemLabel = getScoreItemLabel(scoreMode);
  const effectivePoints = calculateScoreMarksEffectivePoints(scoreMarks, scoreMode);
  const referenceIds = new Set(collectScoreReferenceIds(solution));
  const hasInlineScores = referenceIds.size > 0;
  const orderWarning = scoreMode === 'levels' && !isScoreLevelOrderDescending(scoreMarks);
  const comparison =
    expectedPoints === undefined
      ? `${scoreMode === 'levels' ? '最高档' : '合计'} ${effectivePoints} 分`
      : `${scoreMode === 'levels' ? '最高档' : '合计'} ${effectivePoints} / ${expectedPoints} 分`;
  const totalMismatch = expectedPoints !== undefined && effectivePoints !== expectedPoints;
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  const addScoreMark = () => {
    const mark = createScoreMark(createId);
    const next = [...scoreMarks, mark];
    onChange(scoreMode === 'levels' ? sortScoreLevelsDescending(next) : next);
  };

  return (
    <section
      className="teacher-content-section scoring-scheme"
      aria-label={`${ownerLabel}评分方案`}
    >
      <div className="teacher-content-heading">
        <div className="teacher-content-heading-copy">
          <strong>评分方案</strong>
          <span
            className={
              totalMismatch ? 'teacher-content-summary warning-text' : 'teacher-content-summary'
            }
          >
            {comparison}
          </span>
        </div>
        <div className="teacher-content-heading-actions">
          <select
            className="compact-select"
            aria-label={`${ownerLabel}评分方式`}
            value={scoreMode}
            onChange={(event) => onScoreModeChange(event.target.value as ScoreMode)}
          >
            <option value="additive">累加评分</option>
            <option value="levels">档位评分</option>
          </select>
          <button
            ref={addButtonRef}
            type="button"
            className="mini-button teacher-content-add"
            disabled={addDisabled}
            onClick={addScoreMark}
          >
            <Plus aria-hidden="true" size={15} />
            <span>添加{scoreItemLabel}</span>
          </button>
        </div>
      </div>

      {helperText ? <div className="teacher-content-note">{helperText}</div> : null}
      {hasInlineScores ? (
        <div className="teacher-content-inline-note">
          <Info aria-hidden="true" size={14} />
          <span>原位评分只在解析中导出分值，表现描述不会随 PDF 输出。</span>
        </div>
      ) : null}
      {orderWarning ? (
        <div className="teacher-content-order-warning">
          <span>评分档顺序不是从高分到低分。</span>
          <button
            type="button"
            className="teacher-content-order-action"
            onClick={() => onChange(sortScoreLevelsDescending(scoreMarks))}
          >
            <ArrowDownWideNarrow aria-hidden="true" size={14} />
            <span>按分值降序</span>
          </button>
        </div>
      ) : null}

      {scoreMarks.length > 0 ? (
        <div className="teacher-content-table-scroll">
          <table className="teacher-content-table scoring-table">
            <caption className="sr-only">{ownerLabel}评分方案</caption>
            <colgroup>
              <col className="teacher-content-identity-column" />
              <col />
              <col className="teacher-content-points-column" />
              <col className="teacher-content-actions-column" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">{scoreMode === 'levels' ? '档位' : '序号'}</th>
                <th scope="col">{scoreMode === 'levels' ? '表现描述' : '评分要求'}</th>
                <th scope="col">{scoreMode === 'levels' ? '得分' : '分值'}</th>
                <th scope="col">
                  <span className="sr-only">操作</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {scoreMarks.map((scoreMark, index) => {
                const referenced = referenceIds.has(scoreMark.id);
                const missingPosition = scoreMark.placement === 'inline' && !referenced;
                const descriptionEmpty =
                  stringifyInlineRichText(scoreMark.description).trim().length === 0;
                const locationLabel = missingPosition ? '位置已丢失' : referenced ? '原位' : '表尾';
                return (
                  <tr
                    key={scoreMark.id}
                    ref={(element) => {
                      rowRefs.current[scoreMark.id] = element;
                    }}
                    className={missingPosition ? 'teacher-content-row-warning' : undefined}
                  >
                    <th scope="row" className="teacher-content-identity-cell">
                      <span>{scoreMode === 'levels' ? `第 ${index + 1} 档` : index + 1}</span>
                      <span
                        className={
                          missingPosition
                            ? 'teacher-content-location warning-text'
                            : 'teacher-content-location'
                        }
                      >
                        {locationLabel}
                      </span>
                    </th>
                    <td>
                      <InlineRichTextInput
                        value={scoreMark.description}
                        label={`${scoreItemLabel} ${index + 1} 说明`}
                        placeholder={scoreMode === 'levels' ? '填写表现描述' : '填写得分要求'}
                        warning={descriptionEmpty}
                        onChange={(description) =>
                          onChange(
                            scoreMarks.map((item) =>
                              item.id === scoreMark.id
                                ? {
                                    ...item,
                                    description: description.length > 0 ? description : undefined,
                                  }
                                : item,
                            ),
                          )
                        }
                      />
                    </td>
                    <td className="teacher-content-points-cell">
                      <ScorePointsInput
                        value={scoreMark.points}
                        label={`${scoreItemLabel} ${index + 1} 分值`}
                        onInvalidInput={onInputWarning}
                        onChange={(points) =>
                          onChange(
                            scoreMarks.map((item) =>
                              item.id === scoreMark.id ? { ...item, points } : item,
                            ),
                          )
                        }
                      />
                    </td>
                    <td className="teacher-content-actions-cell">
                      <RepeatableItemMenu
                        itemLabel={`${scoreItemLabel} ${index + 1}`}
                        canMoveUp={index > 0}
                        canMoveDown={index < scoreMarks.length - 1}
                        onMove={(direction) => onChange(moveItem(scoreMarks, index, direction))}
                        onDuplicate={() => {
                          const duplicate: ScoreMark = {
                            ...scoreMark,
                            id: createId('score'),
                            description: scoreMark.description?.map((item) => ({ ...item })),
                            placement: undefined,
                          };
                          onChange([
                            ...scoreMarks.slice(0, index + 1),
                            duplicate,
                            ...scoreMarks.slice(index + 1),
                          ]);
                        }}
                        extraItems={[
                          ...(referenced
                            ? [
                                {
                                  label: '定位到解析',
                                  icon: LocateFixed,
                                  restoreFocus: false,
                                  onSelect: () => onLocate(scoreMark.id),
                                },
                              ]
                            : missingPosition
                              ? [
                                  {
                                    label: '选择插入位置',
                                    icon: TextCursorInput,
                                    restoreFocus: false,
                                    onSelect: () => onReinsert(scoreMark.id),
                                  },
                                  {
                                    label: '转换为表尾评分',
                                    icon: ListEnd,
                                    onSelect: () =>
                                      onChange(moveScoreMarkToSummary(scoreMarks, scoreMark.id)),
                                  },
                                ]
                              : []),
                        ]}
                        deleteKey={`score:${scoreMark.id}`}
                        onDelete={() => onDelete(scoreMark.id)}
                        onDeleteFocus={() => {
                          const targetId = getRepeatableDeleteFocusTarget(
                            scoreMarks.map((item) => item.id),
                            scoreMark.id,
                          );
                          const target = targetId ? rowRefs.current[targetId] : null;
                          if (target) {
                            target
                              .querySelector<HTMLButtonElement>('.repeatable-item-menu-trigger')
                              ?.focus();
                          } else {
                            addButtonRef.current?.focus();
                          }
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="teacher-content-empty">尚未设置评分方案。</div>
      )}
    </section>
  );
}

export interface SolutionAnnotationTableProps {
  ownerLabel: string;
  annotations: SolutionAnnotation[];
  solution?: RichContentBlock[];
  onChange(annotations: SolutionAnnotation[]): void;
  onDelete(annotationId: string): void;
  onLocate(annotationId: string): void;
  onReinsert(annotationId: string): void;
}

export function SolutionAnnotationTable({
  ownerLabel,
  annotations,
  solution,
  onChange,
  onDelete,
  onLocate,
  onReinsert,
}: SolutionAnnotationTableProps) {
  const headingRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  if (annotations.length === 0) return null;

  const referenceIds = collectAnnotationReferenceIds(solution);
  const referenceOrder = new Map(referenceIds.map((id, index) => [id, index]));
  const ordered = annotations
    .map((annotation, index) => ({ annotation, index }))
    .sort((left, right) => {
      const leftOrder = referenceOrder.get(left.annotation.id);
      const rightOrder = referenceOrder.get(right.annotation.id);
      if (leftOrder !== undefined && rightOrder !== undefined) return leftOrder - rightOrder;
      if (leftOrder !== undefined) return -1;
      if (rightOrder !== undefined) return 1;
      return left.index - right.index;
    });

  return (
    <section
      className="teacher-content-section solution-annotations"
      aria-label={`${ownerLabel}解析批注`}
    >
      <div ref={headingRef} className="teacher-content-heading" tabIndex={-1}>
        <div className="teacher-content-heading-copy">
          <strong>解析批注</strong>
          <span className="teacher-content-summary">{annotations.length} 条</span>
        </div>
      </div>
      <div className="teacher-content-table-scroll">
        <table className="teacher-content-table annotation-table">
          <caption className="sr-only">{ownerLabel}解析批注</caption>
          <colgroup>
            <col className="annotation-content-column" />
            <col className="annotation-context-column" />
            <col className="teacher-content-actions-column" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">批注内容</th>
              <th scope="col">上下文位置</th>
              <th scope="col">
                <span className="sr-only">操作</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {ordered.map(({ annotation }) => {
              const referenced = referenceOrder.has(annotation.id);
              const context = buildReferenceContextSummary(solution, {
                type: 'annotationRef',
                annotationId: annotation.id,
              });
              return (
                <tr
                  key={annotation.id}
                  ref={(element) => {
                    rowRefs.current[annotation.id] = element;
                  }}
                  className={!referenced ? 'teacher-content-row-warning' : undefined}
                >
                  <th scope="row" className="annotation-content-cell">
                    <InlineRichTextInput
                      value={annotation.content}
                      label="解析批注内容"
                      placeholder="填写批注内容"
                      allowEmpty={false}
                      onChange={(content) =>
                        onChange(
                          annotations.map((item) =>
                            item.id === annotation.id ? { ...item, content } : item,
                          ),
                        )
                      }
                    />
                  </th>
                  <td
                    className={
                      !referenced ? 'warning-text annotation-context' : 'annotation-context'
                    }
                  >
                    {context ?? '位置已丢失'}
                  </td>
                  <td className="teacher-content-actions-cell">
                    <RepeatableItemMenu
                      itemLabel="解析批注"
                      extraItems={[
                        referenced
                          ? {
                              label: '定位到解析',
                              icon: LocateFixed,
                              restoreFocus: false,
                              onSelect: () => onLocate(annotation.id),
                            }
                          : {
                              label: '选择插入位置',
                              icon: TextCursorInput,
                              restoreFocus: false,
                              onSelect: () => onReinsert(annotation.id),
                            },
                      ]}
                      deleteKey={`annotation:${annotation.id}`}
                      onDelete={() => onDelete(annotation.id)}
                      onDeleteFocus={() => {
                        const targetId = getRepeatableDeleteFocusTarget(
                          ordered.map(({ annotation: candidate }) => candidate.id),
                          annotation.id,
                        );
                        const target = targetId ? rowRefs.current[targetId] : null;
                        if (target) {
                          target
                            .querySelector<HTMLButtonElement>('.repeatable-item-menu-trigger')
                            ?.focus();
                        } else {
                          headingRef.current?.focus();
                        }
                      }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function InlineRichTextInput({
  value,
  label,
  placeholder,
  allowEmpty = true,
  warning = false,
  onChange,
}: {
  value?: ScoreMark['description'];
  label: string;
  placeholder: string;
  allowEmpty?: boolean;
  warning?: boolean;
  onChange(value: NonNullable<ScoreMark['description']>): void;
}) {
  const [draft, setDraft] = useState(() => stringifyInlineRichText(value));
  const [focused, setFocused] = useState(false);
  const cancelBlurRef = useRef(false);
  const source = stringifyInlineRichText(value);

  const commit = () => {
    const content = parseInlineRichText(draft.trim());
    if (!allowEmpty && content.length === 0) {
      setDraft(source);
      return;
    }
    onChange(content);
  };

  return (
    <textarea
      rows={1}
      className={`teacher-content-inline-input${warning ? ' has-warning' : ''}`}
      aria-label={label}
      required={!allowEmpty}
      value={focused ? draft : source}
      placeholder={placeholder}
      onFocus={() => {
        setDraft(source);
        setFocused(true);
      }}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        if (cancelBlurRef.current) cancelBlurRef.current = false;
        else commit();
        setFocused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          event.currentTarget.blur();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          cancelBlurRef.current = true;
          setDraft(source);
          event.currentTarget.blur();
        }
      }}
    />
  );
}

function ScorePointsInput({
  value,
  label,
  onChange,
  onInvalidInput,
}: {
  value: number;
  label: string;
  onChange(value: number): void;
  onInvalidInput(message: string): void;
}) {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);
  const cancelBlurRef = useRef(false);

  return (
    <input
      type="text"
      inputMode="decimal"
      className="teacher-content-points-input"
      aria-label={label}
      value={focused ? draft : String(value)}
      onFocus={() => {
        setDraft(String(value));
        setFocused(true);
      }}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        if (cancelBlurRef.current) {
          cancelBlurRef.current = false;
        } else {
          const result = commitNumberDraft(draft, value, 'required');
          if (result.warning) onInvalidInput(`${label}：${result.warning}`);
          if (result.value !== undefined && result.value !== value) onChange(result.value);
        }
        setFocused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          event.currentTarget.blur();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          cancelBlurRef.current = true;
          setDraft(String(value));
          event.currentTarget.blur();
        }
      }}
    />
  );
}

function moveItem<T>(items: T[], index: number, direction: 'up' | 'down'): T[] {
  const target = direction === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(index, 1);
  if (item !== undefined) next.splice(target, 0, item);
  return next;
}
