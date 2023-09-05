import JSZip, { JSZipObject } from 'jszip';
import { xhrRequest } from '../internal/index';
import zipFileManger from './zipFileManger';

interface zipImageUrl {
  zipUrl: string;
  dicomPath:string;
}

let zipPromises = {};

function loadZipRequest(uri: string, imageId: string): Promise<ArrayBuffer> {
  const { zipUrl, dicomPath } = parseuri(uri);

  const extractedFile = zipFileManger.get(zipUrl, dicomPath);
  if (extractedFile) {
    return new Promise<ArrayBuffer>(async (resolve, reject) => {
      try {
        const dicomFileBuffer = await extractedFile.async('arraybuffer');
        resolve(dicomFileBuffer);
      } catch (error) {
        reject(error);
      }
    });
  }

  let zipPromise: Promise<void>;

  if (zipPromises[zipUrl]) {
    zipPromise = zipPromises[zipUrl];
  } else {
    zipPromise = new Promise<void>(async (resolve, reject) => {
      const loadPromise = xhrRequest(zipUrl, imageId);

      loadPromise.then(async (arrayBuffer) => {
        let extractedFile: JSZipObject;
        extractedFile = zipFileManger.get(zipUrl, dicomPath);

        if (!extractedFile) {
          try {
            let zip = new JSZip();
            const extractedFiles = await zip.loadAsync(arrayBuffer);
            extractedFile = extractedFiles.files[dicomPath];
            zipFileManger.add(zipUrl, extractedFiles.files);
            delete zipPromises[zipUrl];
          } catch (error) {
            reject(error);
            return;
          }
        }
        resolve();
      }, reject);
    });
    zipPromises[zipUrl] = zipPromise;
  }

  return new Promise<ArrayBuffer>((resolve, reject) => {
    zipPromise.then(async () => {
      const file = zipFileManger.get(zipUrl, dicomPath);
      try {
        const dicomFileBuffer = await file.async('arraybuffer');
        resolve(dicomFileBuffer);
      } catch (error) {
        reject(error);
      }
    }, reject);
  });
}

function parseuri(uri: string): zipImageUrl {
  const [zipUrl, dicomPath] = uri.split(':zip//');
  return {zipUrl,dicomPath};
}

export default loadZipRequest;
