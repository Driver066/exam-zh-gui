import { app, ipcMain, shell } from 'electron';

import {
  IPC_CHANNELS,
  type AppEnvironment,
  type OpenExternalPayload,
} from '../../shared/ipc/contracts';
import { resolveExternalLinkUrl } from '../../shared/ipc/external-links';
import { errorMessage, fail, ok } from '../../shared/ipc/result';
import {
  createSelectableCompilerProviders,
  detectCompilerCapabilities,
} from '../compiler/providers';

export function registerAppHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.appGetEnvironment, () => {
    const environment: AppEnvironment = {
      appName: app.getName(),
      appVersion: app.getVersion(),
      platform: process.platform,
      versions: {
        chrome: process.versions.chrome,
        electron: process.versions.electron,
        node: process.versions.node,
      },
    };

    return ok(environment);
  });

  ipcMain.handle(IPC_CHANNELS.compilersGetCapabilities, async () => {
    try {
      return ok(await detectCompilerCapabilities(createSelectableCompilerProviders()));
    } catch (error) {
      return fail('compiler_detection_failed', `无法检测 PDF 编译器：${errorMessage(error)}`);
    }
  });

  ipcMain.handle(IPC_CHANNELS.appOpenExternal, async (_event, payload: OpenExternalPayload) => {
    const url = resolveExternalLinkUrl(payload?.target);

    if (!url) {
      return fail('invalid_external_link', '无法打开未知链接。');
    }

    try {
      await shell.openExternal(url);
      return ok(null);
    } catch (error) {
      return fail('open_external_failed', `无法打开链接：${errorMessage(error)}`);
    }
  });
}
