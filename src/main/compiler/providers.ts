import { copyFile, mkdir, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

import type {
  CompilerCapabilities,
  CompilerPreference,
  CompilerProviderId,
} from '../../shared/compile/types';
import type { CommandRunner, CommandRunResult } from './command-runner';
import { systemCommandRunner } from './command-runner';
import { resolveTectonicBinary } from './tectonic-resolver';

export interface CompilerCommand {
  command: string;
  args: string[];
}

export interface CompilerDetectionResult {
  id: CompilerProviderId;
  available: boolean;
  detail?: string;
}

export interface CompileProviderResult {
  provider: CompilerProviderId;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  log: string;
  timedOut: boolean;
}

export interface CompilerProvider {
  id: CompilerProviderId;
  label: string;
  detect(): Promise<CompilerDetectionResult>;
  compile(input: CompileInput): Promise<CompileProviderResult>;
}

export interface CreateCompilerProvidersOptions {
  enableTectonic?: boolean;
  tectonicBin?: string;
  tectonicOnlyCached?: boolean;
  tectonicResourceDir?: string;
  tectonicResourcesPath?: string;
  tectonicCwd?: string;
  tectonicEnv?: NodeJS.ProcessEnv;
}

export interface TectonicProviderOptions {
  tectonicBin?: string;
  onlyCached?: boolean;
  untrusted?: boolean;
  resourceDir?: string;
  resourcesPath?: string;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

export interface TectonicCommandOptions extends TectonicProviderOptions {
  texFileName: string;
  outDir: string;
}

export interface CompileInput {
  cwd: string;
  texFileName: string;
  timeoutMs?: number;
}

const defaultCompileTimeoutMs = 120_000;

export function createCompilerProviders(
  runner: CommandRunner = systemCommandRunner,
  options: CreateCompilerProvidersOptions = readCompilerProviderEnvOptions(),
): CompilerProvider[] {
  const systemProviders = [createLatexmkProvider(runner), createXelatexProvider(runner)];

  if (!options.enableTectonic) {
    return systemProviders;
  }

  return [
    createTectonicProvider(runner, {
      tectonicBin: options.tectonicBin,
      onlyCached: options.tectonicOnlyCached,
      resourceDir: options.tectonicResourceDir,
      resourcesPath: options.tectonicResourcesPath,
      cwd: options.tectonicCwd,
      env: options.tectonicEnv,
    }),
    ...systemProviders,
  ];
}

export async function detectPreferredCompilerProvider(
  providers: CompilerProvider[] = createCompilerProviders(),
): Promise<CompilerProvider | null> {
  for (const provider of providers) {
    const detection = await provider.detect();

    if (detection.available) {
      return provider;
    }
  }

  return null;
}

export function createSelectableCompilerProviders(
  runner: CommandRunner = systemCommandRunner,
  options: CreateCompilerProvidersOptions = readCompilerProviderEnvOptions(),
): CompilerProvider[] {
  const providers = createCompilerProviders(runner, { ...options, enableTectonic: true });
  const byId = new Map(providers.map((provider) => [provider.id, provider]));
  return ['latexmk-xelatex', 'xelatex', 'tectonic'].flatMap((id) => {
    const provider = byId.get(id as CompilerProviderId);
    return provider ? [provider] : [];
  });
}

export async function detectCompilerCapabilities(
  providers: CompilerProvider[] = createSelectableCompilerProviders(),
): Promise<CompilerCapabilities> {
  const detected = await Promise.all(
    providers.map(async (provider) => ({ provider, detection: await provider.detect() })),
  );
  const systemProvider = detected.find(
    ({ provider, detection }) => provider.id !== 'tectonic' && detection.available,
  )?.provider.id;
  const tectonicAvailable =
    detected.find(({ provider }) => provider.id === 'tectonic')?.detection.available ?? false;

  return {
    providers: detected.map(({ provider, detection }) => ({
      id: provider.id,
      label: provider.label,
      available: detection.available,
      detail: detection.detail,
    })),
    automaticProvider: systemProvider ?? (tectonicAvailable ? 'tectonic' : undefined),
    systemProvider,
    tectonicAvailable,
  };
}

export async function resolveCompilerProvider(
  preference: CompilerPreference,
  providers: CompilerProvider[] = createSelectableCompilerProviders(),
): Promise<CompilerProvider | null> {
  const ids =
    preference === 'tectonic'
      ? (['tectonic'] as CompilerProviderId[])
      : preference === 'system'
        ? (['latexmk-xelatex', 'xelatex'] as CompilerProviderId[])
        : (['latexmk-xelatex', 'xelatex', 'tectonic'] as CompilerProviderId[]);

  for (const id of ids) {
    const provider = providers.find((candidate) => candidate.id === id);
    if (provider && (await provider.detect()).available) return provider;
  }
  return null;
}

export function buildLatexmkCommand(texFileName: string): CompilerCommand {
  return {
    command: 'latexmk',
    args: [
      '-xelatex',
      '-interaction=nonstopmode',
      '-halt-on-error',
      '-file-line-error',
      texFileName,
    ],
  };
}

export function buildXelatexCommand(texFileName: string): CompilerCommand {
  return {
    command: 'xelatex',
    args: ['-interaction=nonstopmode', '-halt-on-error', '-file-line-error', texFileName],
  };
}

export function buildTectonicCommand(options: TectonicCommandOptions): CompilerCommand {
  const untrusted = options.untrusted ?? true;

  return {
    command: options.tectonicBin ?? 'tectonic',
    args: [
      ...(options.onlyCached ? ['--only-cached'] : []),
      ...(untrusted ? ['--untrusted'] : []),
      '--keep-logs',
      '--keep-intermediates',
      '--outdir',
      options.outDir,
      '--reruns',
      '2',
      options.texFileName,
    ],
  };
}

export function createTectonicProvider(
  runner: CommandRunner = systemCommandRunner,
  options: TectonicProviderOptions = {},
): CompilerProvider {
  return {
    id: 'tectonic',
    label: 'Tectonic',
    async detect() {
      const resolution = await resolveTectonicBinary({
        cwd: options.cwd,
        env: {
          ...options.env,
          TECTONIC_BIN: options.tectonicBin ?? options.env?.TECTONIC_BIN,
        },
        resourcesPath: options.resourcesPath,
      });
      const detection = await detectCommand('tectonic', runner, resolution.command);
      const bundledIssue = resolution.candidates.find(
        (candidate) => candidate.kind === 'bundled' && candidate.reason,
      );

      if (!detection.available && bundledIssue) {
        return {
          ...detection,
          detail: `内置 Tectonic binary 不可用：${bundledIssue.reason}。可使用 TECTONIC_BIN 指定其它 binary。${detection.detail ? ` ${detection.detail}` : ''}`,
        };
      }

      return detection;
    },
    async compile(input) {
      const resourceCopyResult = await copyTectonicExamZhResources(input.cwd, options.resourceDir);

      if (!resourceCopyResult.ok) {
        return {
          provider: 'tectonic',
          exitCode: 1,
          stdout: '',
          stderr: resourceCopyResult.message,
          log: resourceCopyResult.message,
          timedOut: false,
        };
      }

      const command = buildTectonicCommand({
        texFileName: input.texFileName,
        outDir: input.cwd,
        tectonicBin: (
          await resolveTectonicBinary({
            cwd: options.cwd,
            env: {
              ...options.env,
              TECTONIC_BIN: options.tectonicBin ?? options.env?.TECTONIC_BIN,
            },
            resourcesPath: options.resourcesPath,
          })
        ).command,
        onlyCached: options.onlyCached,
        untrusted: options.untrusted,
      });
      const result = await runner.run(command.command, command.args, {
        cwd: input.cwd,
        timeoutMs: input.timeoutMs ?? defaultCompileTimeoutMs,
      });

      return toProviderResult('tectonic', [result]);
    },
  };
}

export async function copyTectonicExamZhResources(
  workspace: string,
  resourceDir: string | string[] | undefined = resolveTectonicExamZhResourceDir(),
): Promise<{ ok: true; copiedFiles: string[] } | { ok: false; message: string }> {
  const resourcePath = await findReadableDirectory(
    Array.isArray(resourceDir) ? resourceDir : [resourceDir].filter(isString),
  );

  if (!resourcePath) {
    return {
      ok: false,
      message:
        'Tectonic 实验编译缺少 exam-zh 运行资源。请确认 resources/latex/exam-zh 存在，或用 EXAM_ZH_GUI_TECTONIC_RESOURCE_DIR 指定资源目录。',
    };
  }

  try {
    await mkdir(workspace, { recursive: true });

    const entries = await readdir(resourcePath, { withFileTypes: true });
    const copiedFiles: string[] = [];

    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }

      const extension = entry.name.split('.').pop();

      if (extension !== 'cls' && extension !== 'sty') {
        continue;
      }

      await copyFile(join(resourcePath, entry.name), join(workspace, entry.name));
      copiedFiles.push(entry.name);
    }

    if (copiedFiles.length === 0) {
      return {
        ok: false,
        message: `Tectonic 实验编译资源目录中没有可复制的 exam-zh .cls/.sty 文件：${resourcePath}`,
      };
    }

    return { ok: true, copiedFiles: copiedFiles.sort((left, right) => left.localeCompare(right)) };
  } catch (error) {
    return {
      ok: false,
      message: `复制 Tectonic exam-zh 运行资源失败：${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function resolveTectonicExamZhResourceDir(): string[] {
  const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;

  return [
    process.env.EXAM_ZH_GUI_TECTONIC_RESOURCE_DIR,
    join(process.cwd(), 'resources', 'latex', 'exam-zh'),
    resourcesPath ? join(resourcesPath, 'latex', 'exam-zh') : undefined,
  ].filter(isString);
}

function isString(value: string | undefined): value is string {
  return typeof value === 'string' && value.length > 0;
}

async function findReadableDirectory(candidates: string[]): Promise<string | null> {
  for (const candidate of candidates) {
    try {
      const info = await stat(candidate);

      if (info.isDirectory()) {
        return candidate;
      }
    } catch {
      // Try the next candidate.
    }
  }

  return null;
}

function createLatexmkProvider(runner: CommandRunner): CompilerProvider {
  return {
    id: 'latexmk-xelatex',
    label: 'latexmk + XeLaTeX',
    async detect() {
      return detectCommand('latexmk-xelatex', runner, 'latexmk');
    },
    async compile(input) {
      const command = buildLatexmkCommand(input.texFileName);
      const result = await runner.run(command.command, command.args, {
        cwd: input.cwd,
        timeoutMs: input.timeoutMs ?? defaultCompileTimeoutMs,
      });

      return toProviderResult('latexmk-xelatex', [result]);
    },
  };
}

function createXelatexProvider(runner: CommandRunner): CompilerProvider {
  return {
    id: 'xelatex',
    label: 'XeLaTeX',
    async detect() {
      return detectCommand('xelatex', runner, 'xelatex');
    },
    async compile(input) {
      const command = buildXelatexCommand(input.texFileName);
      const first = await runner.run(command.command, command.args, {
        cwd: input.cwd,
        timeoutMs: input.timeoutMs ?? defaultCompileTimeoutMs,
      });
      const second = await runner.run(command.command, command.args, {
        cwd: input.cwd,
        timeoutMs: input.timeoutMs ?? defaultCompileTimeoutMs,
      });

      return toProviderResult('xelatex', [first, second]);
    },
  };
}

async function detectCommand(
  id: CompilerProviderId,
  runner: CommandRunner,
  command: string,
): Promise<CompilerDetectionResult> {
  const result = await runner.run(command, ['--version'], { timeoutMs: 5000 });

  return {
    id,
    available: result.exitCode === 0,
    detail: firstNonEmptyLine(result.stdout) ?? firstNonEmptyLine(result.stderr),
  };
}

function toProviderResult(
  provider: CompilerProviderId,
  results: CommandRunResult[],
): CompileProviderResult {
  const last = results[results.length - 1];
  const stdout = results
    .map((result) => result.stdout)
    .filter(Boolean)
    .join('\n');
  const stderr = results
    .map((result) => result.stderr)
    .filter(Boolean)
    .join('\n');

  return {
    provider,
    exitCode: last?.exitCode ?? null,
    stdout,
    stderr,
    log: [stdout, stderr].filter(Boolean).join('\n'),
    timedOut: results.some((result) => result.timedOut),
  };
}

function firstNonEmptyLine(value: string): string | undefined {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
}

function readCompilerProviderEnvOptions(): CreateCompilerProvidersOptions {
  return {
    enableTectonic: process.env.EXAM_ZH_GUI_ENABLE_TECTONIC === '1',
    tectonicBin: process.env.TECTONIC_BIN,
    tectonicOnlyCached: process.env.EXAM_ZH_GUI_TECTONIC_ONLY_CACHED === '1',
    tectonicResourceDir: process.env.EXAM_ZH_GUI_TECTONIC_RESOURCE_DIR,
  };
}
