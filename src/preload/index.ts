import { contextBridge, ipcRenderer } from 'electron';
import { randomUUID } from 'node:crypto';

import { createEmptyExamDocument } from '../shared/document/factory';
import type { ExamDocument } from '../shared/document/schema';
import {
  IPC_CHANNELS,
  type ExportPdfPayload,
  type ExportPdfProgress,
  type ExportTexPayload,
  type OpenExternalPayload,
  type RenderMathPayload,
  type SaveDocumentPayload,
  type RevealExportedPdfPayload,
} from '../shared/ipc/contracts';
import type { ExternalLinkTarget } from '../shared/ipc/external-links';
import { ok } from '../shared/ipc/result';
import type { ExamZhGuiApi } from './exam-zh-gui';

const api: ExamZhGuiApi = {
  documents: {
    async createEmpty() {
      return ok(createEmptyExamDocument(randomUUID()));
    },
    async open() {
      return ipcRenderer.invoke(IPC_CHANNELS.documentsOpen);
    },
    async save(document: ExamDocument, filePath?: string | null) {
      const payload: SaveDocumentPayload = { document, filePath };
      return ipcRenderer.invoke(IPC_CHANNELS.documentsSave, payload);
    },
    async saveAs(document: ExamDocument) {
      const payload: SaveDocumentPayload = { document };
      return ipcRenderer.invoke(IPC_CHANNELS.documentsSaveAs, payload);
    },
    async exportTex(document: ExamDocument, sourceFilePath?: string | null) {
      const payload: ExportTexPayload = { document, sourceFilePath };
      return ipcRenderer.invoke(IPC_CHANNELS.documentsExportTex, payload);
    },
    async exportPdf(input) {
      const payload: ExportPdfPayload = input;
      return ipcRenderer.invoke(IPC_CHANNELS.documentsExportPdf, payload);
    },
    onPdfExportProgress(listener: (progress: ExportPdfProgress) => void) {
      const handler = (_event: Electron.IpcRendererEvent, progress: ExportPdfProgress) =>
        listener(progress);
      ipcRenderer.on(IPC_CHANNELS.documentsExportPdfProgress, handler);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.documentsExportPdfProgress, handler);
    },
    async revealExportedPdf(filePath: string) {
      const payload: RevealExportedPdfPayload = { filePath };
      return ipcRenderer.invoke(IPC_CHANNELS.documentsRevealExportedPdf, payload);
    },
  },
  app: {
    async getEnvironment() {
      return ipcRenderer.invoke(IPC_CHANNELS.appGetEnvironment);
    },
    async openExternal(target: ExternalLinkTarget) {
      const payload: OpenExternalPayload = { target };
      return ipcRenderer.invoke(IPC_CHANNELS.appOpenExternal, payload);
    },
    async getCompilerCapabilities() {
      return ipcRenderer.invoke(IPC_CHANNELS.compilersGetCapabilities);
    },
  },
  math: {
    async render(latex: string, display: boolean) {
      const payload: RenderMathPayload = { latex, display };
      return ipcRenderer.invoke(IPC_CHANNELS.mathRender, payload);
    },
  },
};

contextBridge.exposeInMainWorld('examZhGui', api);
