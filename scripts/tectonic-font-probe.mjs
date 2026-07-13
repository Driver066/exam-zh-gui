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

export const fontProbeVariants = [
  {
    id: 'system-baseline',
    provider: 'system',
    label: '系统 XeLaTeX 基准',
    description: '不注入 Tectonic shim，不指定 fontset；用于和本机系统 TeX 输出比较。',
  },
  {
    id: 'tectonic-fandol-current',
    provider: 'tectonic',
    label: 'Tectonic 当前 Fandol',
    description: '当前 Bundled Tectonic 默认策略：fontset=fandol + compatibility shim。',
    fontset: 'fandol',
  },
  {
    id: 'tectonic-mac-fontset',
    provider: 'tectonic',
    label: 'Tectonic mac fontset',
    description: '显式 fontset=mac，验证 macOS 系统字体是否更接近系统 XeLaTeX。',
    fontset: 'mac',
  },
  {
    id: 'tectonic-ctex-default',
    provider: 'tectonic',
    label: 'Tectonic ctex 默认',
    description: 'Tectonic + compatibility shim，但不注入 fontset=fandol。',
  },
  {
    id: 'tectonic-fandol-subject-serif',
    provider: 'tectonic',
    label: 'Fandol 科目宋体粗体',
    description: 'fontset=fandol，临时覆盖 subject-format 为 \\rmfamily\\bfseries\\huge。',
    fontset: 'fandol',
    subjectFormat: '\\rmfamily\\bfseries\\huge',
  },
  {
    id: 'tectonic-fandol-subject-smaller-sans',
    provider: 'tectonic',
    label: 'Fandol 科目较小黑体',
    description: 'fontset=fandol，临时覆盖 subject-format 为 \\sffamily\\bfseries\\LARGE。',
    fontset: 'fandol',
    subjectFormat: '\\sffamily\\bfseries\\LARGE',
  },
];

export function buildFontProbeTex(source, variant) {
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

    if (variant.fontset) {
      optionList.unshift(`fontset=${variant.fontset}`);
    }

    const renderedOptions = optionList.length > 0 ? `[${optionList.join(', ')}]` : '';
    const compatibilityLines = [
      `\\documentclass${renderedOptions}{exam-zh}`,
      '\\ExplSyntaxOn',
      '\\cs_if_exist:NF \\IfBlankTF { \\cs_new_eq:NN \\IfBlankTF \\tl_if_blank:nTF }',
    ];

    if (variant.subjectFormat) {
      compatibilityLines.push(
        `\\keys_set:nn { exam-zh / title } { subject-format = ${variant.subjectFormat} }`,
      );
    }

    compatibilityLines.push('\\ExplSyntaxOff');
    return compatibilityLines.join('\n');
  });
}

async function main() {
  const offline =
    process.argv.includes('--offline') || process.env.EXAM_ZH_GUI_TECTONIC_ONLY_CACHED === '1';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputRoot = join(rootDir, 'artifacts/tectonic-font-probe', timestamp);
  const source = await readFile(fixturePath, 'utf8');
  const tectonicBin = await resolveTectonicBin();
  const systemProvider = await detectSystemProvider();
  const results = [];

  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });

  console.log(`Tectonic font probe output: ${outputRoot}`);
  console.log(`Fixture: ${fixturePath}`);
  console.log(`Vendored exam-zh resources: ${resourceDir}`);
  console.log(`Tectonic binary: ${tectonicBin}`);
  console.log(`Offline mode: ${offline ? 'yes' : 'no'}`);

  for (const variant of fontProbeVariants) {
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

  await writeReport(outputRoot, results, {
    offline,
    tectonicBin,
    systemProvider,
  });

  console.log(`\nReport: ${join(outputRoot, 'report.md')}`);
  console.log('Font probe finished. 这只是可选验证，不属于 pnpm check。');
}

async function runVariant(input) {
  const { variant, source, outputRoot, offline, tectonicBin, systemProvider } = input;
  const workspace = join(outputRoot, variant.id);
  const texPath = join(workspace, 'document.tex');
  const pdfPath = join(workspace, 'document.pdf');
  const logPath = join(workspace, 'document.log');

  await mkdir(workspace, { recursive: true });
  await copyVendoredExamZhResources(workspace);
  await writeFile(texPath, buildFontProbeTex(source, variant), 'utf8');

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
      skipped: true,
      exitCode: null,
      timedOut: false,
      durationMs: 0,
      pdfExists: false,
      command: '',
      log: '系统 latexmk/xelatex 不可用，跳过 system-baseline。',
      summary: {
        likelyIssue: 'system compiler not available',
        warningCount: 0,
        overfullCount: 0,
        missingFontCount: 0,
      },
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

  return {
    variant,
    workspace,
    texPath,
    pdfPath,
    logPath,
    skipped: false,
    exitCode: result.exitCode,
    timedOut: result.timedOut,
    durationMs,
    pdfExists,
    command: `${commandSpec.command} ${commandSpec.args.join(' ')}`,
    log: combinedLog,
    summary: summarizeLog(combinedLog, result.exitCode, pdfExists),
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

function summarizeLog(log, exitCode, pdfExists) {
  const warningCount = (log.match(/(?:^|\n)warning:/gi) ?? []).length;
  const overfullCount = (log.match(/Overfull \\[hv]box/gi) ?? []).length;
  const missingFontCount = (log.match(/font.+not found|cannot be found|fontspec/gi) ?? []).length;

  return {
    warningCount,
    overfullCount,
    missingFontCount,
    likelyIssue: summarizeLikelyIssue(log, exitCode, pdfExists),
  };
}

function summarizeLikelyIssue(log, exitCode, pdfExists) {
  if (exitCode === 0 && pdfExists) {
    return 'none detected';
  }

  if (!log.trim()) {
    return 'no log output';
  }

  const checks = [
    [/LaTeX Error: File `[^']+' not found/i, 'missing LaTeX package/class'],
    [/font.+not found|cannot be found|fontspec/i, 'font compatibility'],
    [/Undefined control sequence/i, 'unsupported or missing LaTeX command'],
    [/only cached|cache|bundle|network|download/i, 'resource cache or bundle access'],
    [/error/i, 'generic TeX error'],
  ];

  return checks.find(([pattern]) => pattern.test(log))?.[1] ?? 'none detected';
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
  console.log(`  likely issue: ${result.summary.likelyIssue}`);
  console.log(`  warnings: ${result.summary.warningCount}`);
  console.log(`  overfull: ${result.summary.overfullCount}`);
}

async function writeReport(outputRoot, results, context) {
  const lines = [
    '# Tectonic 中文字体策略验证报告',
    '',
    `生成时间：${new Date().toISOString()}`,
    `Fixture：${relativeToRoot(fixturePath)}`,
    `Tectonic binary：${context.tectonicBin}`,
    `System provider：${context.systemProvider ?? 'not available'}`,
    `Offline mode：${context.offline ? 'yes' : 'no'}`,
    '',
    '## 结果概览',
    '',
    '| Variant | Provider | PDF | Exit | Warnings | Overfull | Likely issue |',
    '| --- | --- | --- | --- | ---: | ---: | --- |',
    ...results.map(
      (result) =>
        `| ${result.variant.id} | ${result.variant.provider} | ${result.pdfExists ? 'yes' : 'no'} | ${
          result.exitCode ?? 'null'
        } | ${result.summary.warningCount} | ${result.summary.overfullCount} | ${
          result.summary.likelyIssue
        } |`,
    ),
    '',
    '## 人工对比清单',
    '',
    '- 对比科目标题“数学”的字形、粗细、字距和视觉重心。',
    '- 对比试卷标题、节标题、题干、选项、填空线和分值。',
    '- 用应用内 PDF.js 预览和系统 Preview 各看一遍。',
    '- 记录哪一个变体最接近系统 LaTeX，同时是否仍能离线生成。',
    '',
    '## 变体详情',
    '',
  ];

  for (const result of results) {
    lines.push(`### ${result.variant.id}`);
    lines.push('');
    lines.push(result.variant.description);
    lines.push('');
    lines.push(`- Provider: ${result.variant.provider}`);
    lines.push(`- PDF: ${result.pdfExists ? relativeToRoot(result.pdfPath) : 'not generated'}`);
    lines.push(`- TeX: ${relativeToRoot(result.texPath)}`);
    lines.push(`- Log: ${relativeToRoot(result.logPath)}`);
    lines.push(`- Command: \`${result.command || 'none'}\``);
    lines.push(`- Likely issue: ${result.summary.likelyIssue}`);
    lines.push('');
  }

  await writeFile(join(outputRoot, 'report.md'), `${lines.join('\n')}\n`, 'utf8');
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

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
