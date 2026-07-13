import { spawn } from 'node:child_process';
import { constants } from 'node:fs';
import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const platformArch = `${process.platform}-${process.arch}`;
const tectonicExecutableName = process.platform === 'win32' ? 'tectonic.exe' : 'tectonic';
const tectonicBin = await resolveTectonicBin();
const compileTimeoutMs = parsePositiveInteger(process.env.TECTONIC_PROBE_TIMEOUT_MS, 600_000);
const fixturePath = join(rootDir, 'fixtures/export/compile-smoke.tex');
const resourceDir = process.env.EXAM_ZH_GUI_TECTONIC_RESOURCE_DIR
  ? resolve(process.env.EXAM_ZH_GUI_TECTONIC_RESOURCE_DIR)
  : join(rootDir, 'resources/latex/exam-zh');
const probeRoot = join(tmpdir(), `exam-zh-gui-tectonic-probe-${Date.now()}`);

const runs = [
  { name: 'warm', onlyCached: false },
  { name: 'offline', onlyCached: true },
];

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

async function main() {
  console.log(`Tectonic probe binary: ${tectonicBin}`);
  console.log(`Fixture: ${fixturePath}`);
  console.log(`Vendored exam-zh resources: ${resourceDir}`);
  console.log(`Workspace: ${probeRoot}`);
  console.log(`Compile timeout: ${compileTimeoutMs}ms`);

  const version = await runCommand(tectonicBin, ['--version'], { cwd: rootDir, timeoutMs: 10_000 });

  if (version.exitCode !== 0) {
    console.error('未检测到可运行的 Tectonic。');
    console.error(
      firstUsefulLine(version.stderr) ?? firstUsefulLine(version.stdout) ?? 'no output',
    );
    process.exitCode = 1;
    return;
  }

  console.log(`Detected: ${firstUsefulLine(version.stdout) ?? firstUsefulLine(version.stderr)}`);
  await probeUntrustedFlag();

  for (const run of runs) {
    await runProbe(run);
  }

  console.log('\nProbe finished. 这只是可选验证，不属于 pnpm check。');
}

async function probeUntrustedFlag() {
  const result = await runCommand(tectonicBin, ['--untrusted', '--version'], {
    cwd: rootDir,
    timeoutMs: 10_000,
  });

  if (result.exitCode === 0) {
    console.log('Security flag check: --untrusted is accepted by this Tectonic binary.');
    return;
  }

  console.log('Security flag check: --untrusted is not accepted or not supported by this binary.');
  console.log(
    `  ${firstUsefulLine(result.stderr) ?? firstUsefulLine(result.stdout) ?? 'no output'}`,
  );
}

async function runProbe(run) {
  const workspace = join(probeRoot, run.name);
  const texPath = join(workspace, 'document.tex');
  const pdfPath = join(workspace, 'document.pdf');
  const logPath = join(workspace, 'document.log');

  await rm(workspace, { recursive: true, force: true });
  await mkdir(workspace, { recursive: true });
  await copyVendoredExamZhResources(workspace);
  await writeTectonicFixture(texPath);

  const args = [
    ...(run.onlyCached ? ['--only-cached'] : []),
    '--untrusted',
    '--keep-logs',
    '--keep-intermediates',
    '--outdir',
    workspace,
    '--reruns',
    '2',
    'document.tex',
  ];
  const startedAt = Date.now();
  const result = await runCommand(tectonicBin, args, {
    cwd: workspace,
    timeoutMs: compileTimeoutMs,
  });
  const durationMs = Date.now() - startedAt;
  const pdfExists = await fileExists(pdfPath);
  const log = await readTextIfExists(logPath);
  const combinedLog = [log, result.stdout, result.stderr].filter(Boolean).join('\n');

  console.log(`\n[${run.name}]`);
  console.log(`  command: ${tectonicBin} ${args.join(' ')}`);
  console.log(`  exitCode: ${result.exitCode ?? 'null'}`);
  console.log(`  timedOut: ${result.timedOut ? 'yes' : 'no'}`);
  console.log(`  durationMs: ${durationMs}`);
  console.log(`  pdf: ${pdfExists ? pdfPath : 'not generated'}`);
  console.log(`  likely issue: ${summarizeLikelyIssue(combinedLog, result.exitCode, pdfExists)}`);
  console.log('  log excerpt:');
  console.log(indentLines(excerpt(combinedLog)));
}

async function writeTectonicFixture(texPath) {
  const source = await readFile(fixturePath, 'utf8');
  await writeFile(texPath, applyTectonicCompatibility(source), 'utf8');
}

function applyTectonicCompatibility(tex) {
  return tex.replace(/\\documentclass(?:\[([^\]]*)\])?\{exam-zh\}/, (_match, options) => {
    const optionList = options
      ? options
          .split(',')
          .map((option) => option.trim())
          .filter(Boolean)
      : [];
    const hasFontset = optionList.some((option) => option.split('=')[0]?.trim() === 'fontset');

    if (!hasFontset) {
      optionList.unshift('fontset=fandol');
    }

    const renderedOptions = optionList.length > 0 ? `[${optionList.join(', ')}]` : '';

    return [
      `\\documentclass${renderedOptions}{exam-zh}`,
      '\\ExplSyntaxOn',
      '\\cs_if_exist:NF \\IfBlankTF { \\cs_new_eq:NN \\IfBlankTF \\tl_if_blank:nTF }',
      '\\ExplSyntaxOff',
    ].join('\n');
  });
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

function summarizeLikelyIssue(log, exitCode, pdfExists) {
  if (exitCode === 0 && pdfExists) {
    return 'none detected';
  }

  if (!log.trim()) {
    return 'no log output';
  }

  const checks = [
    [/exam-zh\.cls|File `exam-zh/i, 'missing exam-zh package/class'],
    [/LaTeX Error: File `[^']+' not found/i, 'missing LaTeX package/class'],
    [/font.+not found|cannot be found|fontspec/i, 'font or XeTeX compatibility'],
    [/Undefined control sequence/i, 'unsupported or missing LaTeX command'],
    [/only cached|cache|bundle|network|download/i, 'resource cache or bundle access'],
    [/error/i, 'generic TeX error'],
  ];

  return checks.find(([pattern]) => pattern.test(log))?.[1] ?? 'none detected';
}

function excerpt(value, maxLines = 24) {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);

  if (lines.length === 0) {
    return 'no output';
  }

  return lines.slice(-maxLines).join('\n');
}

function indentLines(value) {
  return value
    .split(/\r?\n/)
    .map((line) => `    ${line}`)
    .join('\n');
}

function firstUsefulLine(value) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value);

  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }

  return fallback;
}

await main();
