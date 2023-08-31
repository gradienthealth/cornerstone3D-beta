//let files: Blob[] = [];
import { JSZipObject } from 'jszip';
let UnzippedFiles: Record<string, Record<string, JSZipObject>> = {};

function add(zipurl: string, files: Record<string, JSZipObject>) {
  UnzippedFiles[zipurl] = files;
}

function get(zipurl, dicomfile): JSZipObject {
  return UnzippedFiles[zipurl]?.[dicomfile];
}

function remove(zipurl, dicomfile): void {
  UnzippedFiles[zipurl][dicomfile] = undefined;
}

function removeFiles(zipurl): void {
  UnzippedFiles[zipurl] = undefined;
}

function purge(): void {
  UnzippedFiles = {};
}

export default {
  add,
  get,
  remove,
  removeFiles,
  purge,
};
