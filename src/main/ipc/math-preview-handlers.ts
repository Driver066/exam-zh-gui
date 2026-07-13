import { ipcMain } from 'electron';

import { renderMathPreviewToSvg } from '../math/math-preview';
import { IPC_CHANNELS, type RenderMathPayload } from '../../shared/ipc/contracts';
import { errorMessage, fail, ok } from '../../shared/ipc/result';

export function registerMathPreviewHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.mathRender, async (_event, payload: RenderMathPayload) => {
    try {
      if (typeof payload.latex !== 'string' || typeof payload.display !== 'boolean') {
        return fail('math_preview_invalid_payload', '公式预览请求格式不正确。');
      }

      const svg = await renderMathPreviewToSvg(payload.latex, payload.display);

      return ok({ svg });
    } catch (error) {
      return fail('math_preview_failed', errorMessage(error));
    }
  });
}
