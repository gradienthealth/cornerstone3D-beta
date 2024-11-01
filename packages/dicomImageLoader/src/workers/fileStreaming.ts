import { expose } from 'comlink';

const fileStreaming = {
  maxFetchSize: 0,
  fetchedSize: 0,

  setMaxFetchSize(size) {
    if (size) {
      this.maxFetchSize = size;
    }
  },

  decreaseFetchedSize(size) {
    if (size && size <= this.fetchedSize) {
      this.fetchedSize -= size;
    }
  },

  async stream(args) {
    const { url, headers } = args;
    const controller = new AbortController();

    const response = await fetch(url, {
      headers: { ...headers },
      signal: controller.signal,
    }).catch((error) => {
      throw error;
    });

    const reader = response.body.getReader();
    let result: ReadableStreamReadResult<Uint8Array> = await reader.read();
    let completed = result.done;
    const totalLength = response.headers.get('Content-Length') || 0;
    const firstChunk = result.value;
    let position = firstChunk.length;

    if (this.maxFetchSize && this.fetchedSize + position > this.maxFetchSize) {
      controller.abort();
      throw new Error(
        `fileStreaming.ts: Maximum size(${this.maxFetchSize}) for fetching files reached`
      );
    }

    this.fetchedSize += position;
    let sharedArraybuffer = new SharedArrayBuffer(+totalLength);
    let fileArraybuffer = new Uint8Array(sharedArraybuffer);
    fileArraybuffer.set(firstChunk);
    postMessage({ url, position, fileArraybuffer });

    while (!completed) {
      result = await reader.read();

      if (result.done) {
        completed = true;
        continue;
      }

      const chunk = result.value;

      if (
        this.maxFetchSize &&
        this.fetchedSize + chunk.length > this.maxFetchSize
      ) {
        sharedArraybuffer = null;
        fileArraybuffer = null;
        controller.abort();
        throw new Error(
          `fileStreaming.ts: Maximum size(${this.maxFetchSize}) for fetching files reached`
        );
      }

      this.fetchedSize += chunk.length;
      fileArraybuffer.set(chunk, position);
      position += chunk.length;

      postMessage({
        isAppending: true,
        url,
        position: position,
      });
    }

    sharedArraybuffer = null;
    fileArraybuffer = null;
  },
};

expose(fileStreaming);
