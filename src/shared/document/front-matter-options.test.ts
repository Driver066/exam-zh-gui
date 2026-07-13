import { describe, expect, it } from 'vitest';

import {
  informationSpacingPresets,
  matchSpacingPreset,
  normalizeInformationSeparator,
  validateInformationSeparatorText,
  validateLatexSkip,
} from './front-matter-options';
import { createEmptyExamDocument } from './factory';
import { migrateExamDocument } from './migrations';
import { CURRENT_SCHEMA_VERSION, PHASE10_SCHEMA_VERSION } from './model';
import { safeParseExamDocument } from './schema';
import { serializeExamDocument } from './serialization';

describe('front matter layout options', () => {
  it('validates safe skip expressions and rejects LaTeX injection', () => {
    expect(validateLatexSkip('.5em plus .2em minus .1em')).toBeNull();
    expect(validateLatexSkip('-2pt')).toBeNull();
    expect(validateLatexSkip('\\vfill')).not.toBeNull();
    expect(validateLatexSkip('.5em}\\input{x}')).not.toBeNull();
  });

  it('validates custom separator text', () => {
    expect(validateInformationSeparatorText('／')).toBeNull();
    expect(validateInformationSeparatorText('123456789')).not.toBeNull();
    expect(validateInformationSeparatorText('a\nb')).not.toBeNull();
  });

  it('normalizes separator presets and recognizes spacing presets', () => {
    expect(normalizeInformationSeparator({ mode: 'comma', text: 'ignored' })).toEqual({
      mode: 'comma',
    });
    expect(normalizeInformationSeparator({ mode: 'custom', text: ' ／ ' })).toEqual({
      mode: 'custom',
      text: '／',
    });
    expect(matchSpacingPreset(informationSpacingPresets.moderate, informationSpacingPresets)).toBe(
      'moderate',
    );
  });

  it('migrates 0.10 documents to sparse 0.11 documents', () => {
    const previous = {
      ...createEmptyExamDocument('doc-phase-10'),
      schemaVersion: PHASE10_SCHEMA_VERSION,
    };
    const migrated = migrateExamDocument(previous);
    expect(migrated).toMatchObject({ schemaVersion: CURRENT_SCHEMA_VERSION });
    expect(safeParseExamDocument(migrated).success).toBe(true);
  });

  it('round trips semantic separator and spacing settings', () => {
    const document = createEmptyExamDocument('doc-front-layout');
    document.frontMatter.informationSeparator = { mode: 'custom', text: '／' };
    document.frontMatter.informationSpacing = { ...informationSpacingPresets.compact };
    document.frontMatter.warningSpacing = { top: '.5em', bottom: '.5em' };
    const serialized = serializeExamDocument(document);
    expect(serialized).toContain('"schemaVersion": "0.13.0"');
    expect(serialized).toContain('"informationSeparator"');
    expect(serialized).toContain('"warningSpacing"');
  });

  it('rejects invalid current spacing and separator values', () => {
    const document = createEmptyExamDocument('doc-invalid-front-layout');
    document.frontMatter.informationSpacing = { top: '\\vfill', bottom: '0pt' };
    expect(safeParseExamDocument(document).success).toBe(false);

    const separatorDocument = createEmptyExamDocument('doc-invalid-separator');
    separatorDocument.frontMatter.informationSeparator = { mode: 'custom', text: '' };
    expect(safeParseExamDocument(separatorDocument).success).toBe(false);
  });
});
