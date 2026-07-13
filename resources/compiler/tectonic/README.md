# Bundled Tectonic resource layout

This directory is reserved for optional bundled Tectonic binaries used by the
experimental managed compiler fallback.

Expected layout:

```txt
resources/compiler/tectonic/
  darwin-arm64/tectonic
  darwin-x64/tectonic
```

The binary files are intentionally ignored by Git. Use:

```bash
pnpm tectonic:install-bundled
```

to copy a locally installed `tectonic` binary into the current platform/arch
directory for packaging smoke tests.

Tectonic itself is MIT licensed, but its engine and TeX resources include
components under multiple open-source licenses. A full license/provenance audit
is required before official bundled releases.
