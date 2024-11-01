import { getWebWorkerManager } from '@cornerstonejs/core';

export const FILE_STREAMING_WORKER_NAME = 'file-streaming-test';
export const MAXIMUM_WORKER_FETCH_SIZE = 2 * 1_073_741_824; // 2 x 1 GB

export function registerFileStreamingWebWorker() {
  const workerFn = () => {
    return new Worker(
      new URL('../../workers/fileStreaming.ts?v=12', import.meta.url),
      { name: FILE_STREAMING_WORKER_NAME }
    );
  };

  const workerManager = getWebWorkerManager();

  const options = {
    maxWorkerInstances: 1,
  };

  workerManager.registerWorker(FILE_STREAMING_WORKER_NAME, workerFn, options);

  workerManager.executeTask(
    FILE_STREAMING_WORKER_NAME,
    'setMaxFetchSize',
    MAXIMUM_WORKER_FETCH_SIZE
  );
}
