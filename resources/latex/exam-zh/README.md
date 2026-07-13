# Vendored exam-zh runtime files

This directory contains an unmodified copy of the `exam-zh` LaTeX runtime files
used by the experimental Tectonic fallback compiler path.

- Upstream project: https://github.com/xkwxdyy/exam-zh
- Package version: `v0.2.6`
- Source package date: `2025-11-12`
- Local source used for this copy: TeX Live 2026 `texmf-dist/tex/latex/exam-zh`
- License: LaTeX Project Public License v1.3c, see `LICENSE`

The normal app path still prefers a user-installed TeX distribution. These files
are only copied into the temporary Tectonic compile workspace when
`EXAM_ZH_GUI_ENABLE_TECTONIC=1` selects the experimental provider.
