import { useState } from 'react';

import {
  matchSpacingPreset,
  validateInformationSeparatorText,
  validateLatexSkip,
  type FrontMatterSpacingPresetId,
} from '../../shared/document';
import type {
  FrontMatterSpacing,
  InformationSeparatorMode,
  InformationSeparatorSetup,
} from '../../shared/document/model';

const separatorOptions: Array<{
  value: 'default' | InformationSeparatorMode;
  label: string;
}> = [
  { value: 'default', label: '默认空白（上游）' },
  { value: 'compactSpace', label: '紧凑空白' },
  { value: 'wideSpace', label: '宽空白' },
  { value: 'comma', label: '中文逗号' },
  { value: 'middleDot', label: '中点' },
  { value: 'verticalBar', label: '竖线' },
  { value: 'none', label: '无额外分隔' },
  { value: 'custom', label: '自定义符号' },
];

export function InformationSeparatorControl({
  value,
  onChange,
  onInputWarning,
}: {
  value: InformationSeparatorSetup | undefined;
  onChange(value: InformationSeparatorSetup | undefined): void;
  onInputWarning(message: string): void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value?.mode === 'custom' ? (value.text ?? '') : '／');
  const selection = value?.mode ?? 'default';

  function select(mode: 'default' | InformationSeparatorMode): void {
    if (mode === 'custom') {
      setDraft(value?.mode === 'custom' ? (value.text ?? '') : '／');
      setEditing(true);
      return;
    }
    setEditing(false);
    onChange(mode === 'default' ? undefined : { mode });
  }

  function apply(): void {
    const message = validateInformationSeparatorText(draft);
    if (message) {
      onInputWarning(message);
      return;
    }
    onChange({ mode: 'custom', text: draft.trim() });
    setEditing(false);
  }

  return (
    <div className="convergent-setting-editor">
      <label className="field">
        <span>字段分隔</span>
        <select
          value={editing ? 'custom' : selection}
          onChange={(event) => select(event.target.value as 'default' | InformationSeparatorMode)}
        >
          {separatorOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {value?.mode === 'custom' && !editing ? (
        <div className="convergent-setting-summary">
          <span>当前符号：{value.text}</span>
          <button type="button" className="mini-button" onClick={() => setEditing(true)}>
            编辑
          </button>
        </div>
      ) : null}
      {editing ? (
        <div className="convergent-setting-draft">
          <label className="field">
            <span>自定义短文本符号</span>
            <input value={draft} maxLength={8} onChange={(event) => setDraft(event.target.value)} />
          </label>
          <div className="convergent-setting-actions">
            <button type="button" className="mini-button" onClick={() => setEditing(false)}>
              取消
            </button>
            <button type="button" className="mini-button mini-button-primary" onClick={apply}>
              应用
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function FrontMatterSpacingControl({
  label,
  value,
  presets,
  customSeed,
  onChange,
  onInputWarning,
}: {
  label: string;
  value: FrontMatterSpacing | undefined;
  presets: Record<string, FrontMatterSpacing>;
  customSeed: FrontMatterSpacing;
  onChange(value: FrontMatterSpacing | undefined): void;
  onInputWarning(message: string): void;
}) {
  const currentPreset = matchSpacingPreset(value, presets) as FrontMatterSpacingPresetId;
  const [editing, setEditing] = useState(false);
  const [topDraft, setTopDraft] = useState(value?.top ?? customSeed.top);
  const [bottomDraft, setBottomDraft] = useState(value?.bottom ?? customSeed.bottom);

  function select(preset: FrontMatterSpacingPresetId): void {
    if (preset === 'custom') {
      setTopDraft(value?.top ?? customSeed.top);
      setBottomDraft(value?.bottom ?? customSeed.bottom);
      setEditing(true);
      return;
    }
    setEditing(false);
    onChange(preset === 'default' ? undefined : { ...presets[preset]! });
  }

  function apply(): void {
    const topMessage = validateLatexSkip(topDraft);
    const bottomMessage = validateLatexSkip(bottomDraft);
    if (topMessage || bottomMessage) {
      onInputWarning(topMessage ?? bottomMessage ?? '间距无效。');
      return;
    }
    onChange({ top: topDraft.trim(), bottom: bottomDraft.trim() });
    setEditing(false);
  }

  return (
    <div className="convergent-setting-editor">
      <label className="field">
        <span>{label}</span>
        <select
          value={editing ? 'custom' : currentPreset}
          onChange={(event) => select(event.target.value as FrontMatterSpacingPresetId)}
        >
          <option value="default">上游默认</option>
          <option value="compact">紧凑</option>
          <option value="moderate">适中</option>
          <option value="loose">宽松</option>
          <option value="custom">自定义</option>
        </select>
      </label>
      {currentPreset === 'custom' && !editing && value ? (
        <div className="convergent-setting-summary">
          <span>
            上方 {value.top} · 下方 {value.bottom}
          </span>
          <button type="button" className="mini-button" onClick={() => select('custom')}>
            编辑
          </button>
        </div>
      ) : null}
      {editing ? (
        <div className="convergent-setting-draft spacing-custom-grid">
          <label className="field">
            <span>上方</span>
            <input value={topDraft} onChange={(event) => setTopDraft(event.target.value)} />
          </label>
          <label className="field">
            <span>下方</span>
            <input value={bottomDraft} onChange={(event) => setBottomDraft(event.target.value)} />
          </label>
          <div className="convergent-setting-actions">
            <button type="button" className="mini-button" onClick={() => setEditing(false)}>
              取消
            </button>
            <button type="button" className="mini-button mini-button-primary" onClick={apply}>
              应用
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
