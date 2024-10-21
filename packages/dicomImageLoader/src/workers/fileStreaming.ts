import { expose } from 'comlink';

const fileStreaming = {
  async stream(args) {
    const { url, headers } = args;

    const response = await fetch(url, {
      headers: { ...headers },
    }).catch((error) => {
      throw error;
    });

    const reader = response.body.getReader();
    let result: ReadableStreamReadResult<Uint8Array> = await reader.read();
    let completed = result.done;
    const totalLength = response.headers.get('Content-Length') || 0;

    const firstChunk = result.value;
    const sharedArraybuffer = new SharedArrayBuffer(+totalLength);
    const fileArraybuffer = new Uint8Array(sharedArraybuffer);
    let position = firstChunk.length;

    fileArraybuffer.set(firstChunk);
    postMessage({ url, position, fileArraybuffer });

    while (!completed) {
      result = await reader.read();

      if (result.done) {
        completed = true;
        continue;
      }

      const chunk = result.value;
      fileArraybuffer.set(chunk, position);
      position += chunk.length;

      postMessage({
        isAppending: true,
        url,
        position: position,
      });
    }
  },
};

expose(fileStreaming);
