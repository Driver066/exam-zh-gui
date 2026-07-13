import { describe, expect, it } from 'vitest';

import {
  applyBlankLengthPreset,
  blankStyleOptions,
  getBlankLengthPreset,
  getBlankStyleOption,
} from './blank-ui-options';

describe('blank UI options', () => {
  it('maps fillin length presets to existing blank slot fields', () => {
    expect(applyBlankLengthPreset({ id: 'blank-1' }, 'short')).toMatchObject({
      command: 'fillin',
      width: '3em',
    });
    expect(applyBlankLengthPreset({ id: 'blank-1' }, 'medium')).toMatchObject({
      command: 'fillin',
      width: '6em',
    });
    expect(applyBlankLengthPreset({ id: 'blank-1' }, 'long')).toMatchObject({
      command: 'fillin*',
      width: '10em',
    });
  });

  it('infers presets from existing blank slot fields', () => {
    expect(getBlankLengthPreset({ id: 'blank-1', command: 'fillin' })).toBe('short');
    expect(getBlankLengthPreset({ id: 'blank-1', command: 'fillin', width: '3em' })).toBe('short');
    expect(getBlankLengthPreset({ id: 'blank-1', command: 'fillin', width: ' 6em ' })).toBe(
      'medium',
    );
    expect(getBlankLengthPreset({ id: 'blank-1', command: 'fillin*', width: '10em' })).toBe('long');
  });

  it('falls back to custom for unknown command and width combinations', () => {
    expect(getBlankLengthPreset({ id: 'blank-1', command: 'fillin*', width: '4em' })).toBe(
      'custom',
    );
    expect(
      getBlankLengthPreset({ id: 'blank-1', command: 'fillin', width: '0.5\\linewidth' }),
    ).toBe('custom');
  });

  it('keeps style descriptions stable for every blank style', () => {
    expect(blankStyleOptions.map((option) => option.type)).toEqual([
      'line',
      'paren',
      'rectangle',
      'circle',
      'blank',
    ]);
    expect(getBlankStyleOption('line')).toMatchObject({ label: '横线' });
    expect(getBlankStyleOption(undefined)).toMatchObject({ label: '横线' });
  });
});
