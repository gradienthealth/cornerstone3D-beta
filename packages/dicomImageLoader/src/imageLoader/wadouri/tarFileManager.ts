interface TarFile {
  data: Uint8Array;
  position: number;
}
let tarFiles: Record<string, TarFile> = {};

function set(url: string, tarFile: TarFile): void {
  tarFiles[url] = tarFile;
}

function get(
  url: string,
  offsets: { startByte: number; endByte: number }
): Uint8Array | null {
  if (getPosition(url) <= offsets.endByte) {
    return null;
  }

  return tarFiles[url]?.data.slice(offsets.startByte, offsets.endByte + 1);
}

function getPosition(url: string): number {
  return tarFiles[url]?.position;
}

function setPosition(url: string, position: number) {
  if (tarFiles[url]) {
    tarFiles[url].position = position;
  }
}

function remove(url: string): void {
  tarFiles[url] = undefined;
}

function purge(): void {
  tarFiles = {};
}

export default {
  set,
  get,
  getPosition,
  setPosition,
  remove,
  purge,
};
