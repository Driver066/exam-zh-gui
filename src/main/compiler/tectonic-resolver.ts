import { access, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';

export interface TectonicBinaryResolutionInput {
  platform?: NodeJS.Platform;
  arch?: NodeJS.Architecture;
  resourcesPath?: string;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

export interface TectonicBinaryCandidate {
  kind: 'bundled' | 'env' | 'path';
  command: string;
  reason?: string;
}

export interface TectonicBinaryResolution {
  command: string;
  candidates: TectonicBinaryCandidate[];
}

const tectonicExecutableNameByPlatform: Partial<Record<NodeJS.Platform, string>> = {
  win32: 'tectonic.exe',
};

export function getTectonicPlatformArch(
  platform: NodeJS.Platform = process.platform,
  arch: NodeJS.Architecture = process.arch,
): string {
  return `${platform}-${arch}`;
}

export function getTectonicExecutableName(platform: NodeJS.Platform = process.platform): string {
  return tectonicExecutableNameByPlatform[platform] ?? 'tectonic';
}

export function getBundledTectonicCandidatePaths(
  input: TectonicBinaryResolutionInput = {},
): string[] {
  const platform = input.platform ?? process.platform;
  const arch = input.arch ?? process.arch;
  const executableName = getTectonicExecutableName(platform);
  const platformArch = getTectonicPlatformArch(platform, arch);
  const cwd = input.cwd ?? process.cwd();
  const resourcesPath =
    input.resourcesPath ?? (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;

  return [
    resourcesPath
      ? join(resourcesPath, 'compiler', 'tectonic', platformArch, executableName)
      : undefined,
    join(cwd, 'resources', 'compiler', 'tectonic', platformArch, executableName),
  ].filter((candidate): candidate is string => Boolean(candidate));
}

export async function resolveTectonicBinary(
  input: TectonicBinaryResolutionInput = {},
): Promise<TectonicBinaryResolution> {
  const env = input.env ?? process.env;
  const candidates: TectonicBinaryCandidate[] = [];
  const bundled = await findFirstExecutable(getBundledTectonicCandidatePaths(input));

  if (bundled.command) {
    candidates.push({ kind: 'bundled', command: bundled.command });
    return { command: bundled.command, candidates };
  }

  for (const missing of bundled.missing) {
    candidates.push({ kind: 'bundled', command: missing.command, reason: missing.reason });
  }

  if (env.TECTONIC_BIN) {
    candidates.push({ kind: 'env', command: env.TECTONIC_BIN });
    return { command: env.TECTONIC_BIN, candidates };
  }

  candidates.push({ kind: 'path', command: 'tectonic' });
  return { command: 'tectonic', candidates };
}

async function findFirstExecutable(
  paths: string[],
): Promise<{ command?: string; missing: Array<{ command: string; reason: string }> }> {
  const missing: Array<{ command: string; reason: string }> = [];

  for (const path of paths) {
    try {
      const info = await stat(path);

      if (!info.isFile()) {
        missing.push({ command: path, reason: 'not_file' });
        continue;
      }

      await access(path, constants.X_OK);
      return { command: path, missing };
    } catch (error) {
      missing.push({
        command: path,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { missing };
}
