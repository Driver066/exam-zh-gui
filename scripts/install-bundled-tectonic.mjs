import { spawn } from 'node:child_process';
import { chmod, copyFile, mkdir, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const platformArch = `${process.platform}-${process.arch}`;
const executableName = process.platform === 'win32' ? 'tectonic.exe' : 'tectonic';
const targetDir = join(rootDir, 'resources/compiler/tectonic', platformArch);
const targetPath = join(targetDir, executableName);
const metadataPath = join(targetDir, 'TECTONIC_BINARY.local.json');

async function main() {
  const sourcePath = await resolveSourcePath();
  const sourceInfo = await stat(sourcePath).catch(() => null);

  if (!sourceInfo?.isFile()) {
    throw new Error(`Tectonic binary 不存在或不是文件：${sourcePath}`);
  }

  const version = await runCommand(sourcePath, ['--version']);

  if (version.exitCode !== 0) {
    throw new Error(
      `Tectonic binary 无法运行 --version：${firstUsefulLine(version.stderr) ?? 'no output'}`,
    );
  }

  await mkdir(targetDir, { recursive: true });
  await copyFile(sourcePath, targetPath);

  if (process.platform !== 'win32') {
    await chmod(targetPath, 0o755);
  }

  const checksum = await sha256File(targetPath);
  const metadata = {
    installedAt: new Date().toISOString(),
    platformArch,
    sourcePath,
    targetPath,
    version: firstUsefulLine(version.stdout) ?? firstUsefulLine(version.stderr) ?? '',
    sha256: checksum,
    licenseNote:
      'Tectonic is MIT licensed, with derived engine and TeX resource components under multiple open-source licenses. Official releases require a full license/provenance audit.',
  };

  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');

  console.log(`Copied Tectonic binary to ${targetPath}`);
  console.log(`Version: ${metadata.version}`);
  console.log(`SHA-256: ${checksum}`);
  console.log(`Metadata: ${metadataPath}`);
}

async function resolveSourcePath() {
  if (process.env.TECTONIC_BIN) {
    return resolve(process.env.TECTONIC_BIN);
  }

  const which = await runCommand('which', ['tectonic']);
  const path = firstUsefulLine(which.stdout);

  if (which.exitCode === 0 && path) {
    return path;
  }

  throw new Error(
    '未找到本机 Tectonic。请先安装 tectonic，或用 TECTONIC_BIN=/path/to/tectonic 指定。',
  );
}

function runCommand(command, args) {
  return new Promise((resolveCommand) => {
    const child = spawn(command, args, {
      shell: false,
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';

    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', (error) => {
      resolveCommand({
        exitCode: null,
        stdout,
        stderr: stderr ? `${stderr}\n${error.message}` : error.message,
      });
    });
    child.on('close', (exitCode) => {
      resolveCommand({ exitCode, stdout, stderr });
    });
  });
}

async function sha256File(path) {
  const { readFile } = await import('node:fs/promises');
  const data = await readFile(path);
  return createHash('sha256').update(data).digest('hex');
}

function firstUsefulLine(value) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
}

await main();
