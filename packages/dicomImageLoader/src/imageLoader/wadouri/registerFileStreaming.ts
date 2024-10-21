import { getWebWorkerManager } from '@cornerstonejs/core';

export const FILE_STREAMING_WORKER_NAME = 'file-streaming-test';

export function registerFileStreamingWebWorker() {
  const workerFn = () => {
    return new Worker(
      new URL('../../workers/fileStreaming.ts', import.meta.url),
      { name: FILE_STREAMING_WORKER_NAME }
    );
  };

  const workerManager = getWebWorkerManager();

  const options = {
    maxWorkerInstances: 4,
  };

  workerManager.registerWorker(FILE_STREAMING_WORKER_NAME, workerFn, options);
}
