import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

import {
  DEFAULT_PAGE_FOOTER_TEMPLATE,
  validateFooterTemplate,
  type ExamDocument,
} from '../../shared/document';
import {
  getA3FooterTypeSelection,
  getPageColumnLineVisible,
  getPageFooterModeSelection,
  getPageFooterVisible,
  getPageSizeSelection,
  setA3FooterType,
  setPageColumnLineVisible,
  setPageFooterMode,
  setPageFooterVisible,
  setPageSize,
  type PageFooterModeSelection,
} from './page-ui-options';
import { resolvePreferredProviderLabel } from './compiler-preference';
import type { CompilerCapabilities, CompilerPreference } from '../../shared/compile/types';

interface PageOutputSettingsProps {
  document: ExamDocument;
  onChange(document: ExamDocument): void;
  onInputWarning(message: string): void;
  compilerPreference: CompilerPreference;
  compilerCapabilities: CompilerCapabilities | null;
  compilerDetecting: boolean;
  onCompilerPreferenceChange(preference: CompilerPreference): void;
  onRefreshCompilerCapabilities(): void;
}

export function PageOutputSettings({
  document,
  onChange,
  onInputWarning,
  compilerPreference,
  compilerCapabilities,
  compilerDetecting,
  onCompilerPreferenceChange,
  onRefreshCompilerCapabilities,
}: PageOutputSettingsProps) {
  const pageSize = getPageSizeSelection(document);
  const footerVisible = getPageFooterVisible(document);
  const footerMode = getPageFooterModeSelection(document);
  const [editingFooter, setEditingFooter] = useState(false);
  const [footerDraft, setFooterDraft] = useState(
    document.setup.page?.footerTemplate ?? DEFAULT_PAGE_FOOTER_TEMPLATE,
  );

  function changeAnswerMode(answerMode: ExamDocument['setup']['answerMode']): void {
    onChange({ ...document, setup: { ...document.setup, answerMode } });
  }

  function changeFooterMode(mode: PageFooterModeSelection): void {
    if (mode === 'preserved') return;
    if (mode === 'custom') {
      setFooterDraft(document.setup.page?.footerTemplate ?? DEFAULT_PAGE_FOOTER_TEMPLATE);
      setEditingFooter(true);
      return;
    }

    setEditingFooter(false);
    onChange(setPageFooterMode(document, mode));
  }

  function applyFooterTemplate(): void {
    const validation = validateFooterTemplate(footerDraft);
    if (!validation.valid) {
      onInputWarning(validation.message ?? '页脚模板无效。');
      return;
    }

    onChange(setPageFooterMode(document, 'custom', footerDraft));
    setEditingFooter(false);
  }

  return (
    <div className="document-settings-form document-settings-page-output">
      <section className="document-settings-field-group">
        <h3>输出版本</h3>
        <label className="field">
          <span>答案与解析</span>
          <select
            value={document.setup.answerMode}
            onChange={(event) =>
              changeAnswerMode(event.target.value as ExamDocument['setup']['answerMode'])
            }
          >
            <option value="student">学生版</option>
            <option value="teacher">教师版</option>
          </select>
        </label>
        <div className="field-hint">同时控制草稿预览，并作为顶部“生成 PDF”主按钮的默认版本。</div>
      </section>

      <section className="document-settings-field-group">
        <h3>纸张与版式</h3>
        <label className="field">
          <span>纸张版式</span>
          <select
            value={pageSize}
            onChange={(event) => {
              const value = event.target.value;
              if (value === 'a4paper' || value === 'a3paper') {
                onChange(setPageSize(document, value));
              }
            }}
          >
            {pageSize === 'custom' ? <option value="custom">自定义（保留）</option> : null}
            <option value="a4paper">A4 单页</option>
            <option value="a3paper">A3 横向双栏</option>
          </select>
        </label>
        {pageSize === 'a3paper' ? (
          <>
            <label className="field">
              <span>A3 页脚</span>
              <select
                value={getA3FooterTypeSelection(document)}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === 'separate' || value === 'common') {
                    onChange(setA3FooterType(document, value));
                  }
                }}
              >
                {getA3FooterTypeSelection(document) === 'custom' ? (
                  <option value="custom">自定义（保留）</option>
                ) : null}
                <option value="separate">两栏分别显示</option>
                <option value="common">两栏共用</option>
              </select>
            </label>
            <label className="field checkbox-field">
              <span>A3 中线</span>
              <span className="checkbox-control">
                <input
                  type="checkbox"
                  checked={getPageColumnLineVisible(document)}
                  onChange={(event) =>
                    onChange(setPageColumnLineVisible(document, event.target.checked))
                  }
                />
                <span>显示双栏中间分隔线</span>
              </span>
            </label>
          </>
        ) : null}
        <div className="field-hint">A3 双栏与页面细节请以导出 PDF 为准。</div>
      </section>

      <section className="document-settings-field-group">
        <h3>页脚</h3>
        <label className="field checkbox-field">
          <span>页脚页码</span>
          <span className="checkbox-control">
            <input
              type="checkbox"
              checked={footerVisible}
              onChange={(event) => onChange(setPageFooterVisible(document, event.target.checked))}
            />
            <span>显示页脚</span>
          </span>
        </label>
        {footerVisible ? (
          <>
            <label className="field">
              <span>页脚内容</span>
              <select
                value={editingFooter ? 'custom' : footerMode}
                onChange={(event) =>
                  changeFooterMode(event.target.value as PageFooterModeSelection)
                }
              >
                {footerMode === 'preserved' ? (
                  <option value="preserved">自定义（保留）</option>
                ) : null}
                <option value="subject">跟随当前科目</option>
                <option value="pageOnly">仅显示页码</option>
                <option value="custom">自定义模板</option>
              </select>
            </label>
            {footerMode === 'custom' && !editingFooter ? (
              <div className="footer-template-summary">
                <span>{document.setup.page?.footerTemplate}</span>
                <button
                  type="button"
                  className="mini-button"
                  onClick={() => setEditingFooter(true)}
                >
                  编辑
                </button>
              </div>
            ) : null}
            {editingFooter ? (
              <div className="footer-template-editor">
                <label className="field">
                  <span>自定义页脚模板</span>
                  <textarea
                    value={footerDraft}
                    maxLength={200}
                    onChange={(event) => setFooterDraft(event.target.value)}
                  />
                </label>
                <div className="field-hint">
                  可使用：{'{{科目}}'}、{'{{页码}}'}、{'{{总页数}}'}
                </div>
                <div className="footer-template-actions">
                  <button
                    type="button"
                    className="mini-button"
                    onClick={() => {
                      setFooterDraft(
                        document.setup.page?.footerTemplate ?? DEFAULT_PAGE_FOOTER_TEMPLATE,
                      );
                      setEditingFooter(false);
                    }}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="mini-button mini-button-primary"
                    onClick={applyFooterTemplate}
                  >
                    应用
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </section>

      <section className="document-settings-field-group">
        <h3>PDF 编译</h3>
        <label className="field">
          <span>编译器</span>
          <select
            value={compilerPreference}
            onChange={(event) =>
              onCompilerPreferenceChange(event.target.value as CompilerPreference)
            }
          >
            <option value="auto">自动选择（推荐）</option>
            <option value="tectonic" disabled={!compilerCapabilities?.tectonicAvailable}>
              内置 Tectonic
              {compilerCapabilities && !compilerCapabilities.tectonicAvailable ? '（不可用）' : ''}
            </option>
            <option value="system" disabled={!compilerCapabilities?.systemProvider}>
              本机 LaTeX
              {compilerCapabilities && !compilerCapabilities.systemProvider ? '（未检测到）' : ''}
            </option>
          </select>
        </label>
        <div className="compiler-capability-summary">
          <span>
            {compilerDetecting
              ? '正在检测编译器…'
              : `当前将使用：${resolvePreferredProviderLabel(
                  compilerPreference,
                  compilerCapabilities,
                )}`}
          </span>
          <button
            type="button"
            className="mini-button compiler-refresh-button"
            disabled={compilerDetecting}
            onClick={onRefreshCompilerCapabilities}
          >
            <RefreshCw aria-hidden="true" size={14} />
            重新检测
          </button>
        </div>
        <div className="field-hint">
          自动模式优先本机 LaTeX；未检测到时使用内置 Tectonic。Tectonic 首次使用可能需要联网获取 TeX
          依赖。
        </div>
      </section>
    </div>
  );
}
