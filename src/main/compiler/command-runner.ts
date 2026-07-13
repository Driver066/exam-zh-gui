import { spawn } from 'node:child_process';

export interface CommandRunOptions {
  cwd?: string;
  timeoutMs?: number;
}

export interface CommandRunResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

export interface CommandRunner {
  run(command: string, args: string[], options?: CommandRunOptions): Promise<CommandRunResult>;
}

export const systemCommandRunner: CommandRunner = {
  run(command, args, options) {
    return new Promise((resolve) => {
      const child = spawn(command, args, {
        cwd: options?.cwd,
        shell: false,
        windowsHide: true,
      });
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let timeout: ReturnType<typeof setTimeout> | undefined;

      if (options?.timeoutMs) {
        timeout = setTimeout(() => {
          timedOut = true;
          child.kill('SIGTERM');
        }, options.timeoutMs);
      }

      child.stdout?.setEncoding('utf8');
      child.stderr?.setEncoding('utf8');
      child.stdout?.on('data', (chunk: string) => {
        stdout += chunk;
      });
      child.stderr?.on('data', (chunk: string) => {
        stderr += chunk;
      });
      child.on('error', (error) => {
        if (timeout) {
          clearTimeout(timeout);
        }

        resolve({
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

        resolve({
          exitCode,
          stdout,
          stderr,
          timedOut,
        });
      });
    });
  },
};
