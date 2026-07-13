import { spawn } from 'node:child_process';
import { constants } from 'node:fs';
import { access, copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const platformArch = `${process.platform}-${process.arch}`;
const tectonicExecutableName = process.platform === 'win32' ? 'tectonic.exe' : 'tectonic';
const compileTimeoutMs = parsePositiveInteger(process.env.TECTONIC_FONT_PROBE_TIMEOUT_MS, 600_000);
const fixturePath = join(rootDir, 'fixtures/export/compile-smoke.tex');
const resourceDir = process.env.EXAM_ZH_GUI_TECTONIC_RESOURCE_DIR
  ? resolve(process.env.EXAM_ZH_GUI_TECTONIC_RESOURCE_DIR)
  : join(rootDir, 'resources/latex/exam-zh');

export const ctexWarningProbeVariants = [
  {
    id: 'system-baseline',
    provider: 'system',
    label: '系统 XeLaTeX 基准',
    description: '不注入 Tectonic shim，不指定 fontset；用于定位系统 LaTeX 的基准日志和字体。',
  },
  {
    id: 'tectonic-ctex-default',
    provider: 'tectonic',
    label: 'Tectonic ctex 默认',
    description:
      'Tectonic + compatibility shim，但不注入 fontset=fandol，用于排查默认 ctex 字体和 warning。',
  },
];

export function buildCtexWarningProbeTex(source, variant) {
  if (variant.provider === 'system') {
    return source;
  }

  return source.replace(/\\documentclass(?:\[([^\]]*)\])?\{exam-zh\}/, (_match, options) => {
    const optionList = options
      ? options
          .split(',')
          .map((option) => option.trim())
          .filter(Boolean)
          .filter((option) => option.split('=')[0]?.trim() !== 'fontset')
      : [];
    const renderedOptions = optionList.length > 0 ? `[${optionList.join(', ')}]` : '';

    return [
      `\\documentclass${renderedOptions}{exam-zh}`,
      '\\ExplSyntaxOn',
      '\\cs_if_exist:NF \\IfBlankTF { \\cs_new_eq:NN \\IfBlankTF \\tl_if_blank:nTF }',
      '\\ExplSyntaxOff',
    ].join('\n');
  });
}

export function analyzeCtexLog(log) {
  const normalized = normalizeLog(log);

  return {
    ctexVersions: extractCtexVersions(normalized),
    fontsetFiles: extractFontsetFiles(normalized),
    fontFamilies: extractFontFamilies(normalized),
    unresolvedFonts: extractUnresolvedFonts(normalized),
    warnings: extractWarningItems(normalized),
  };
}

export function compareWarningEvidence(baselineAnalysis, ctexAnalysis) {
  const baselineKeys = new Set(baselineAnalysis.warnings.map((warning) => warning.key));
  const ctexKeys = new Set(ctexAnalysis.warnings.map((warning) => warning.key));

  return {
    baselineShared: ctexAnalysis.warnings.filter((warning) => baselineKeys.has(warning.key)),
    ctexOnly: ctexAnalysis.warnings.filter((warning) => !baselineKeys.has(warning.key)),
    baselineOnly: baselineAnalysis.warnings.filter((warning) => !ctexKeys.has(warning.key)),
    ctexVisualRisks: ctexAnalysis.warnings.filter((warning) => warning.category === 'visual-risk'),
    ctexBlocking: ctexAnalysis.warnings.filter((warning) => warning.category === 'blocking'),
  };
}

export async function collectPdfFontTable(
  pdfPath,
  cwd = rootDir,
  tools = { pdffonts: 'pdffonts', mutool: 'mutool' },
) {
  const pdffonts = await runCommand(tools.pdffonts, [pdfPath], { cwd, timeoutMs: 20_000 });

  if (pdffonts.exitCode === 0) {
    return {
      status: 'available',
      tool: 'pdffonts',
      output: [pdffonts.stdout, pdffonts.stderr].filter(Boolean).join('\n').trim(),
    };
  }

  const mutool = await runCommand(tools.mutool, ['info', pdfPath], { cwd, timeoutMs: 20_000 });

  if (mutool.exitCode === 0) {
    return {
      status: 'available',
      tool: 'mutool',
      output: [mutool.stdout, mutool.stderr].filter(Boolean).join('\n').trim(),
    };
  }

  return {
    status: 'skipped',
    tool: null,
    output: '',
    reason: 'pdffonts and mutool are not available',
  };
}

async function main() {
  const offline =
    process.argv.includes('--offline') || process.env.EXAM_ZH_GUI_TECTONIC_ONLY_CACHED === '1';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputRoot = join(rootDir, 'artifacts/tectonic-ctex-warning-probe', timestamp);
  const source = await readFile(fixturePath, 'utf8');
  const tectonicBin = await resolveTectonicBin();
  const systemProvider = await detectSystemProvider();
  const results = [];

  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });

  console.log(`Tectonic ctex warning probe output: ${outputRoot}`);
  console.log(`Fixture: ${fixturePath}`);
  console.log(`Vendored exam-zh resources: ${resourceDir}`);
  console.log(`Tectonic binary: ${tectonicBin}`);
  console.log(`System provider: ${systemProvider ?? 'not available'}`);
  console.log(`Offline mode: ${offline ? 'yes' : 'no'}`);

  for (const variant of ctexWarningProbeVariants) {
    const result = await runVariant({
      variant,
      source,
      outputRoot,
      offline,
      tectonicBin,
      systemProvider,
    });
    results.push(result);
    printVariantResult(result);
  }

  const baseline = results.find((result) => result.variant.id === 'system-baseline');
  const ctex = results.find((result) => result.variant.id === 'tectonic-ctex-default');
  const comparison =
    baseline && ctex ? compareWarningEvidence(baseline.analysis, ctex.analysis) : null;

  await writeReport(outputRoot, results, comparison, {
    offline,
    tectonicBin,
    systemProvider,
  });

  console.log(`\nReport: ${join(outputRoot, 'report.md')}`);
  console.log('Ctex warning probe finished. 这只是可选验证，不属于 pnpm check。');
}

async function runVariant(input) {
  const { variant, source, outputRoot, offline, tectonicBin, systemProvider } = input;
  const workspace = join(outputRoot, variant.id);
  const texPath = join(workspace, 'document.tex');
  const pdfPath = join(workspace, 'document.pdf');
  const logPath = join(workspace, 'document.log');
  const stdoutPath = join(workspace, 'stdout.txt');
  const stderrPath = join(workspace, 'stderr.txt');

  await mkdir(workspace, { recursive: true });
  await copyVendoredExamZhResources(workspace);
  await writeFile(texPath, buildCtexWarningProbeTex(source, variant), 'utf8');

  const commandSpec =
    variant.provider === 'system'
      ? systemCommandSpec(systemProvider)
      : tectonicCommandSpec(tectonicBin, offline, workspace);

  if (!commandSpec) {
    return {
      variant,
      workspace,
      texPath,
      pdfPath,
      logPath,
      stdoutPath,
      stderrPath,
      skipped: true,
      exitCode: null,
      timedOut: false,
      durationMs: 0,
      pdfExists: false,
      command: '',
      log: '系统 latexmk/xelatex 不可用，跳过 system-baseline。',
      stdout: '',
      stderr: '',
      analysis: analyzeCtexLog(''),
      pdfFonts: { status: 'skipped', tool: null, output: '', reason: 'PDF not generated' },
    };
  }

  const startedAt = Date.now();
  const result = await runCommand(commandSpec.command, commandSpec.args, {
    cwd: workspace,
    timeoutMs: compileTimeoutMs,
  });

  if (commandSpec.secondPass) {
    const second = await runCommand(commandSpec.command, commandSpec.args, {
      cwd: workspace,
      timeoutMs: compileTimeoutMs,
    });
    result.stdout = [result.stdout, second.stdout].filter(Boolean).join('\n');
    result.stderr = [result.stderr, second.stderr].filter(Boolean).join('\n');
    result.exitCode = second.exitCode;
    result.timedOut = result.timedOut || second.timedOut;
  }

  const durationMs = Date.now() - startedAt;
  const pdfExists = await fileExists(pdfPath);
  const log = await readTextIfExists(logPath);
  const combinedLog = [log, result.stdout, result.stderr].filter(Boolean).join('\n');
  const analysis = analyzeCtexLog(combinedLog);
  const pdfFonts = pdfExists
    ? await collectPdfFontTable(pdfPath, workspace)
    : { status: 'skipped', tool: null, output: '', reason: 'PDF not generated' };

  await writeFile(stdoutPath, result.stdout, 'utf8');
  await writeFile(stderrPath, result.stderr, 'utf8');

  return {
    variant,
    workspace,
    texPath,
    pdfPath,
    logPath,
    stdoutPath,
    stderrPath,
    skipped: false,
    exitCode: result.exitCode,
    timedOut: result.timedOut,
    durationMs,
    pdfExists,
    command: `${commandSpec.command} ${commandSpec.args.join(' ')}`,
    log: combinedLog,
    stdout: result.stdout,
    stderr: result.stderr,
    analysis,
    pdfFonts,
  };
}

async function resolveTectonicBin() {
  const bundled = join(
    rootDir,
    'resources/compiler/tectonic',
    platformArch,
    tectonicExecutableName,
  );

  if (await isExecutableFile(bundled)) {
    return bundled;
  }

  if (process.env.TECTONIC_BIN) {
    return resolve(process.env.TECTONIC_BIN);
  }

  return 'tectonic';
}

async function detectSystemProvider() {
  const latexmk = await runCommand('latexmk', ['--version'], {
    cwd: rootDir,
    timeoutMs: 10_000,
  });

  if (latexmk.exitCode === 0) {
    return 'latexmk';
  }

  const xelatex = await runCommand('xelatex', ['--version'], {
    cwd: rootDir,
    timeoutMs: 10_000,
  });

  return xelatex.exitCode === 0 ? 'xelatex' : null;
}

function systemCommandSpec(systemProvider) {
  if (systemProvider === 'latexmk') {
    return {
      command: 'latexmk',
      args: [
        '-xelatex',
        '-interaction=nonstopmode',
        '-halt-on-error',
        '-file-line-error',
        'document.tex',
      ],
    };
  }

  if (systemProvider === 'xelatex') {
    return {
      command: 'xelatex',
      args: ['-interaction=nonstopmode', '-halt-on-error', '-file-line-error', 'document.tex'],
      secondPass: true,
    };
  }

  return null;
}

function tectonicCommandSpec(tectonicBin, offline, workspace) {
  return {
    command: tectonicBin,
    args: [
      ...(offline ? ['--only-cached'] : []),
      '--untrusted',
      '--keep-logs',
      '--keep-intermediates',
      '--outdir',
      workspace,
      '--reruns',
      '2',
      'document.tex',
    ],
  };
}

async function copyVendoredExamZhResources(workspace) {
  const info = await stat(resourceDir).catch(() => null);

  if (!info?.isDirectory()) {
    throw new Error(`缺少 exam-zh vendored resources: ${resourceDir}`);
  }

  const entries = await readdir(resourceDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const extension = entry.name.split('.').pop();

    if (extension !== 'cls' && extension !== 'sty') {
      continue;
    }

    await copyFile(join(resourceDir, entry.name), join(workspace, entry.name));
  }
}

async function isExecutableFile(path) {
  try {
    const info = await stat(path);

    if (!info.isFile()) {
      return false;
    }

    await access(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function runCommand(command, args, options) {
  return new Promise((resolveCommand) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      shell: false,
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let timeout;

    if (options.timeoutMs) {
      timeout = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
      }, options.timeoutMs);
    }

    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', (error) => {
      if (timeout) {
        clearTimeout(timeout);
      }

      resolveCommand({
        exitCode: null,
        stdout,
        stderr: stderr ? `${stderr}\n${error.message}` : error.message,
        timedOut,
      });
    });
    child.on('close', (exitCode) => {
      if (timeout) {
        clearTimeout(timeout);
      }

      resolveCommand({ exitCode, stdout, stderr, timedOut });
    });
  });
}

async function fileExists(path) {
  try {
    const info = await stat(path);
    return info.isFile();
  } catch {
    return false;
  }
}

async function readTextIfExists(path) {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return '';
  }
}

function normalizeLog(log) {
  return log
    .replace(/\r\n/g, '\n')
    .replace(/\n\((?:fontspec|Font|CTEX)\)\s*/g, ' ')
    .replace(/([A-Za-z])\n([A-Za-z])/g, '$1$2');
}

function extractCtexVersions(log) {
  const versions = [];
  const patterns = [
    /Document Class: (ctex\w*) ([0-9/]+) v([0-9.]+) ([^\n]+)/g,
    /Package: (ctex\w*) ([0-9/]+) v([0-9.]+) ([^\n]+)/g,
  ];

  for (const pattern of patterns) {
    for (const match of log.matchAll(pattern)) {
      versions.push({
        name: match[1],
        date: match[2],
        version: match[3],
        description: match[4].trim(),
      });
    }
  }

  return uniqueBy(versions, (version) => `${version.name}:${version.date}:${version.version}`);
}

function extractFontsetFiles(log) {
  const files = [];
  const pattern = /File: (ctex-fontset-[^\s]+\.def) ([0-9/]+) v([0-9.]+) ([^\n]+)/g;

  for (const match of log.matchAll(pattern)) {
    files.push({
      file: match[1],
      date: match[2],
      version: match[3],
      description: match[4].trim(),
      kind: classifyFontsetKind(match[1]),
    });
  }

  return uniqueBy(files, (file) => `${file.file}:${file.date}:${file.version}`);
}

function extractFontFamilies(log) {
  const families = [];
  const pattern = /Font family '([^']+)' created for font '([^']+)'/g;

  for (const match of log.matchAll(pattern)) {
    families.push({
      family: compactWhitespace(match[1]),
      font: compactWhitespace(match[2]),
    });
  }

  return uniqueBy(families, (family) => `${family.family}:${family.font}`);
}

function extractUnresolvedFonts(log) {
  const fonts = [];
  const pattern = /Could not resolve font "([^"]+)"/g;

  for (const match of log.matchAll(pattern)) {
    fonts.push(compactWhitespace(match[1]));
  }

  return [...new Set(fonts)];
}

function extractWarningItems(log) {
  const items = [];

  for (const font of extractUnresolvedFonts(log)) {
    items.push({
      kind: 'fontspec-unresolved',
      key: `fontspec-unresolved:${font}`,
      category: classifyFontWarning(font),
      message: `Could not resolve font "${font}"`,
    });
  }

  for (const match of log.matchAll(/LaTeX Font Warning: ([\s\S]*?)(?=\n\n|$)/g)) {
    const message = compactWhitespace(match[1]);
    items.push({
      kind: 'latex-font-warning',
      key: `latex-font-warning:${normalizeWarningKey(message)}`,
      category: classifyFontWarning(message),
      message,
    });
  }

  for (const match of log.matchAll(/Overfull \\[hv]box[^\n]*(?:\n[^\n]*){0,3}/g)) {
    const message = compactWhitespace(match[0]);
    items.push({
      kind: 'overfull',
      key: `overfull:${normalizeWarningKey(message)}`,
      category: /数\s*学|Heiti|STHeiti/.test(message) ? 'visual-risk' : 'ctex-only',
      message,
    });
  }

  for (const match of log.matchAll(/(?:LaTeX Error|Fatal error|Emergency stop):? ([^\n]+)/g)) {
    const message = compactWhitespace(match[0]);
    items.push({
      kind: 'blocking',
      key: `blocking:${normalizeWarningKey(message)}`,
      category: 'blocking',
      message,
    });
  }

  return uniqueBy(items, (item) => `${item.kind}:${item.key}`);
}

function classifyFontWarning(message) {
  if (/STHeiti|Heiti SC|STSong|STKaiti|undefined|defaults substituted/i.test(message)) {
    return 'visual-risk';
  }

  if (/not found|cannot be found|Fatal error|Emergency stop|LaTeX Error/i.test(message)) {
    return 'blocking';
  }

  return 'ctex-only';
}

function classifyFontsetKind(file) {
  if (file.includes('macnew')) {
    return 'macnew';
  }

  if (file.includes('macold')) {
    return 'macold';
  }

  if (file.includes('mac')) {
    return 'mac';
  }

  return 'other';
}

function compactWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeWarningKey(value) {
  return compactWhitespace(value)
    .replace(/input line \d+/g, 'input line #')
    .replace(/line \d+/g, 'line #');
}

function uniqueBy(values, getKey) {
  const seen = new Set();
  const unique = [];

  for (const value of values) {
    const key = getKey(value);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(value);
  }

  return unique;
}

function printVariantResult(result) {
  console.log(`\n[${result.variant.id}] ${result.variant.label}`);
  console.log(`  provider: ${result.variant.provider}`);
  console.log(`  skipped: ${result.skipped ? 'yes' : 'no'}`);
  console.log(`  command: ${result.command || 'none'}`);
  console.log(`  exitCode: ${result.exitCode ?? 'null'}`);
  console.log(`  timedOut: ${result.timedOut ? 'yes' : 'no'}`);
  console.log(`  durationMs: ${result.durationMs}`);
  console.log(`  pdf: ${result.pdfExists ? result.pdfPath : 'not generated'}`);
  console.log(
    `  fontset: ${result.analysis.fontsetFiles.map((file) => file.file).join(', ') || 'unknown'}`,
  );
  console.log(`  warnings: ${result.analysis.warnings.length}`);
  console.log(
    `  pdf fonts: ${result.pdfFonts.status === 'available' ? result.pdfFonts.tool : 'skipped'}`,
  );
}

async function writeReport(outputRoot, results, comparison, context) {
  const lines = [
    '# Tectonic ctex warning 排查报告',
    '',
    `生成时间：${new Date().toISOString()}`,
    `Fixture：${relativeToRoot(fixturePath)}`,
    `Tectonic binary：${context.tectonicBin}`,
    `System provider：${context.systemProvider ?? 'not available'}`,
    `Offline mode：${context.offline ? 'yes' : 'no'}`,
    '',
    '## 结论提醒',
    '',
    '- `tectonic-ctex-default` 是视觉首选候选，不是默认策略。',
    '- 重点问题是“绝密启用前”“解答”等粗体文字使用的粗体字体和 baseline 不一致，不是粗体位置不同。',
    '- `smaller-sans` 已淘汰，不再作为候选继续投入。',
    '',
    '## 结果概览',
    '',
    '| Variant | Provider | PDF | Exit | Fontset | Warnings | PDF fonts |',
    '| --- | --- | --- | --- | --- | ---: | --- |',
    ...results.map((result) => {
      const fontset = result.analysis.fontsetFiles.map((file) => file.file).join(', ') || 'unknown';
      const pdfFonts =
        result.pdfFonts.status === 'available'
          ? result.pdfFonts.tool
          : `skipped: ${result.pdfFonts.reason ?? 'not available'}`;

      return `| ${result.variant.id} | ${result.variant.provider} | ${
        result.pdfExists ? 'yes' : 'no'
      } | ${result.exitCode ?? 'null'} | ${fontset} | ${result.analysis.warnings.length} | ${pdfFonts} |`;
    }),
    '',
  ];

  if (comparison) {
    lines.push('## Warning 分类');
    lines.push('');
    lines.push(`- baseline-shared: ${comparison.baselineShared.length}`);
    lines.push(`- ctex-only: ${comparison.ctexOnly.length}`);
    lines.push(`- visual-risk: ${comparison.ctexVisualRisks.length}`);
    lines.push(`- blocking: ${comparison.ctexBlocking.length}`);
    lines.push('');
    lines.push('### visual-risk');
    lines.push('');
    lines.push(...formatWarningList(comparison.ctexVisualRisks));
    lines.push('');
    lines.push('### ctex-only');
    lines.push('');
    lines.push(...formatWarningList(comparison.ctexOnly));
    lines.push('');
  }

  for (const result of results) {
    lines.push(`## ${result.variant.id}`);
    lines.push('');
    lines.push(result.variant.description);
    lines.push('');
    lines.push(`- Provider: ${result.variant.provider}`);
    lines.push(`- PDF: ${result.pdfExists ? relativeToRoot(result.pdfPath) : 'not generated'}`);
    lines.push(`- TeX: ${relativeToRoot(result.texPath)}`);
    lines.push(`- Log: ${relativeToRoot(result.logPath)}`);
    lines.push(`- stdout: ${relativeToRoot(result.stdoutPath)}`);
    lines.push(`- stderr: ${relativeToRoot(result.stderrPath)}`);
    lines.push(`- Command: \`${result.command || 'none'}\``);
    lines.push('');
    lines.push('### CTEX / fontset');
    lines.push('');
    lines.push(...formatObjectList(result.analysis.ctexVersions));
    lines.push(...formatObjectList(result.analysis.fontsetFiles));
    lines.push('');
    lines.push('### Font families');
    lines.push('');
    lines.push(...formatObjectList(result.analysis.fontFamilies));
    lines.push('');
    lines.push('### PDF font table');
    lines.push('');

    if (result.pdfFonts.status === 'available') {
      lines.push(`Tool: ${result.pdfFonts.tool}`);
      lines.push('');
      lines.push('```txt');
      lines.push(result.pdfFonts.output || '(empty output)');
      lines.push('```');
    } else {
      lines.push(`Skipped: ${result.pdfFonts.reason ?? 'not available'}`);
    }

    lines.push('');
  }

  await writeFile(join(outputRoot, 'report.md'), `${lines.join('\n')}\n`, 'utf8');
}

function formatWarningList(warnings) {
  if (warnings.length === 0) {
    return ['- none'];
  }

  return warnings.map((warning) => `- [${warning.category}] ${warning.kind}: ${warning.message}`);
}

function formatObjectList(values) {
  if (values.length === 0) {
    return ['- none'];
  }

  return values.map((value) => `- ${JSON.stringify(value)}`);
}

function relativeToRoot(path) {
  return path.startsWith(rootDir) ? path.slice(rootDir.length + 1) : path;
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value);

  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }

  return fallback;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
