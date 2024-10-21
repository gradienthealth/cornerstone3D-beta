import { metaData, getWebWorkerManager, Enums } from '@cornerstonejs/core';
import tarFileManager from './tarFileManager';
import { getOptions } from '../internal/index';
import { FILE_STREAMING_WORKER_NAME } from './registerFileStreaming';

interface tarImageUrl {
  tarUrl: string;
  dicomPath: string;
}

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
          },
          { requestType: Enums.RequestType.Prefetch }
        )
        .then(() => {
          delete tarPromises[tarUrl];
          resolveTar();
        })
        .catch((error) => rejectTar(error));
    });

    tarPromises[tarUrl] = tarPromise;
  }

  return new Promise<ArrayBufferLike>(async (resolveRequest, rejectRequest) => {
    function handleChunkAppend(evt) {
      const { url, position, isAppending } = evt.data;

      isAppending && tarFileManager.setPosition(url, position);

      if (position > handledOffsets.endByte && url === tarUrl) {
        try {
          const file = tarFileManager.get(url, handledOffsets);

          webWorkerManager.removeEventListener(
            FILE_STREAMING_WORKER_NAME,
            'message',
            handleChunkAppend
          );

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

    await tarPromise.catch((error) => rejectRequest(error));
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
