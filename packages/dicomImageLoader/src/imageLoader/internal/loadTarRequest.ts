import {
  metaData,
  getWebWorkerManager,
  Enums,
  getShouldUseSharedArrayBuffer,
} from '@cornerstonejs/core';
import tarFileManager from '../wadors/tarFileManager';
import { getOptions } from './index';
import {
  FILE_STREAMING_WORKER_NAME,
  MAXIMUM_WORKER_FETCH_SIZE,
} from '../wadors/registerFileStreaming';

interface tarImageUrl {
  tarUrl: string;
  dicomPath: string;
}
const THRESHOLD = 10000;

const tarPromises = {};

function loadTarRequest(
  uri: string,
  imageId: string,
  headers: Record<string, string> = {}
): Promise<ArrayBufferLike> {
  const instance = metaData.get('instance', imageId);
  const { FileOffsets } = instance;
  const { tarUrl } = parseuri(uri);
  const { Range } = headers;
  const handledOffsets = getHandledOffsets(FileOffsets, Range);
  const extractedFile = tarFileManager.get(tarUrl, handledOffsets);

  if (extractedFile) {
    return new Promise<ArrayBufferLike>((resolveRequest, rejectRequest) => {
      try {
        resolveRequest(extractedFile.buffer);
      } catch (error) {
        rejectRequest(error);
      }
    });
  }

  const webWorkerManager = getWebWorkerManager();
  let tarPromise: Promise<void>;

  if (tarPromises[tarUrl]) {
    tarPromise = tarPromises[tarUrl];
  } else {
    tarPromise = new Promise<void>(async (resolveTar, rejectTar) => {
      if (
        tarFileManager.getTotalSize() + THRESHOLD >
        MAXIMUM_WORKER_FETCH_SIZE
      ) {
        throw new Error(
          `fileStreaming.ts: Maximum size(${MAXIMUM_WORKER_FETCH_SIZE}) for fetching files reached`
        );
      }

      const options = getOptions();
      const beforeSendHeaders = options.beforeSend();

      function handleFirstChunk(evt) {
        const { url, position, fileArraybuffer } = evt.data;

        if (url === tarUrl) {
          tarFileManager.set(url, { data: fileArraybuffer, position });

          webWorkerManager.removeEventListener(
            FILE_STREAMING_WORKER_NAME,
            'message',
            handleFirstChunk
          );
        }
      }

      webWorkerManager.addEventListener(
        FILE_STREAMING_WORKER_NAME,
        'message',
        handleFirstChunk
      );

      webWorkerManager
        .executeTask(
          FILE_STREAMING_WORKER_NAME,
          'stream',
          {
            url: tarUrl,
            headers: beforeSendHeaders,
            useSharedArrayBuffer: getShouldUseSharedArrayBuffer(),
          },
          { requestType: Enums.RequestType.Prefetch }
        )
        .then(() => {
          resolveTar();
        })
        .catch((error) => {
          webWorkerManager.removeEventListener(
            FILE_STREAMING_WORKER_NAME,
            'message',
            handleFirstChunk
          );
          rejectTar(error);
        })
        .finally(() => delete tarPromises[tarUrl]);
    });

    tarPromises[tarUrl] = tarPromise;
  }

  return new Promise<ArrayBufferLike>(async (resolveRequest, rejectRequest) => {
    let resolved = false;
    function handleChunkAppend(evt) {
      const { url, position, chunk, isAppending } = evt.data;

      if (isAppending) {
        if (chunk) {
          tarFileManager.append(url, chunk, position);
        } else {
          tarFileManager.setPosition(url, position);
        }
      }

      if (!resolved && position > handledOffsets.endByte && url === tarUrl) {
        try {
          const file = tarFileManager.get(url, handledOffsets);
          resolved = true;
          resolveRequest(file.buffer);
        } catch (error) {
          rejectRequest(error);
        }
      }
    }

    webWorkerManager.addEventListener(
      FILE_STREAMING_WORKER_NAME,
      'message',
      handleChunkAppend
    );

    await tarPromise
      .catch((error) => {
        rejectRequest(error);
      })
      .finally(() => {
        webWorkerManager.removeEventListener(
          FILE_STREAMING_WORKER_NAME,
          'message',
          handleChunkAppend
        );
      });
  });
}

function parseuri(uri: string): tarImageUrl {
  const [tarUrl, dicomPath] = uri.split('.tar://');
  return { tarUrl: tarUrl + '.tar', dicomPath };
}

function parseRangeHeader(rangeHeader: string): {
  start?: number;
  end?: number;
} {
  if (!rangeHeader) {
    return {};
  }

  const parts = rangeHeader.split('=');
  const rangePart = parts[1];
  const rangeParts = rangePart.split('-');
  const start = parseInt(rangeParts[0], 10);
  const end = parseInt(rangeParts[1], 10);

  return { start, end };
}

function getHandledOffsets(
  fileOffsets: { startByte: number; endByte: number },
  rangeHeader: string
): { startByte: number; endByte: number } {
  const { startByte: fileStartByte, endByte: fileEndByte } = fileOffsets;
  const { start, end } = parseRangeHeader(rangeHeader);

  const startByte = start ? fileStartByte + start : fileStartByte;
  const endByte = end ? fileStartByte + end : fileEndByte;

  return { startByte, endByte };
}

export default loadTarRequest;
