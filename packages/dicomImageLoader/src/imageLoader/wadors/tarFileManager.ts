import { getWebWorkerManager } from '@cornerstonejs/core';
import { FILE_STREAMING_WORKER_NAME } from './registerFileStreaming';

let tarFiles: Record<string, { data: Uint8Array; position: number }> = {};

function set(
  url: string,
  tarFile: { data: Uint8Array; position: number }
): void {
  tarFiles[url] = tarFile;
}

function get(
  url: string,
  offsets: { startByte: number; endByte: number }
): Uint8Array | null {
  if (!tarFiles[url] || tarFiles[url].position <= offsets.endByte) {
    return null;
  }

  return tarFiles[url].data.slice(offsets.startByte, offsets.endByte + 1);
}

function setPosition(url: string, position: number) {
  if (tarFiles[url]) {
    tarFiles[url].position = position;
  }
}

function getTotalSize(): number {
  return Object.values(tarFiles).reduce((total, { position }) => {
    return total + position;
  }, 0);
}

function remove(url: string): void {
  const removedSize = tarFiles[url].position;
  delete tarFiles[url];

  const workerManager = getWebWorkerManager();
  workerManager.executeTask(
    FILE_STREAMING_WORKER_NAME,
    'decreaseFetchedSize',
    removedSize
  );
}

function purge(): void {
  const totalSize = getTotalSize();
  tarFiles = {};

  const workerManager = getWebWorkerManager();
  workerManager.executeTask(
    FILE_STREAMING_WORKER_NAME,
    'decreaseFetchedSize',
    totalSize
  );
}

export default {
  set,
  get,
  setPosition,
  getTotalSize,
  remove,
  purge,
};
