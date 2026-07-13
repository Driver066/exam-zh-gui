// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import './test/setup-dom';
import { EditorObjectHeader } from './EditorObjectHeader';

function HeaderHarness() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section aria-labelledby="object-title">
      <EditorObjectHeader
        titleId="object-title"
        controlsId="object-controls"
        title="第 1 题"
        selected
        expanded={expanded}
        summary="单选题 · 未设答案"
        actions={<button type="button">操作</button>}
        onToggle={() => setExpanded((current) => !current)}
      />
      <div id="object-controls" hidden={!expanded}>
        {expanded ? (
          <label>
            题干
            <input />
          </label>
        ) : null}
      </div>
    </section>
  );
}

describe('EditorObjectHeader', () => {
  it('connects its disclosure to a lightweight wrapper and unmounts collapsed content', async () => {
    const user = userEvent.setup();
    render(<HeaderHarness />);

    const disclosure = screen.getByRole('button', { name: /第 1 题/ });
    expect(disclosure).toHaveAttribute('aria-controls', 'object-controls');
    expect(disclosure).toHaveAttribute('aria-expanded', 'false');
    expect(disclosure).toHaveAttribute('aria-current', 'location');
    expect(screen.getByText('单选题 · 未设答案')).toBeInTheDocument();
    expect(document.getElementById('object-controls')).toHaveAttribute('hidden');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    await user.click(disclosure);

    expect(disclosure).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById('object-controls')).not.toHaveAttribute('hidden');
    expect(screen.getByRole('textbox', { name: '题干' })).toBeInTheDocument();
    expect(screen.queryByText('单选题 · 未设答案')).not.toBeInTheDocument();
  });
});
