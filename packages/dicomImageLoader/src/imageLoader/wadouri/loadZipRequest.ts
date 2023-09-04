import JSZip, { JSZipObject } from 'jszip';
import { xhrRequest } from '../internal/index';
import zipFileManger from './zipFileManger';

let zipPromises = {};

function loadZipRequest(uri: string, imageId: string): Promise<ArrayBuffer> {
  const dicomFileIndex = uri.lastIndexOf('/');
  const dicomFile = uri.substring(dicomFileIndex + 1);
  const zipUrl = uri.substring(0, dicomFileIndex);

  // If the dicom file is extracted from zip, create dataSet
  const extractedFile = zipFileManger.get(zipUrl, dicomFile);
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
        extractedFile = zipFileManger.get(zipUrl, dicomFile);

        if (!extractedFile) {
          try {
            let zip = new JSZip();
            const extractedFiles = await zip.loadAsync(arrayBuffer);
            extractedFile = extractedFiles.files[dicomFile];
            zipFileManger.add(zipUrl, extractedFiles.files);
            delete zipPromises[zipUrl];
          } catch (error) {
            reject(error);
          }
        }
        resolve();
      }, reject);
    });
    zipPromises[zipUrl] = zipPromise;
  }

  return new Promise<ArrayBuffer>((resolve, reject) => {
    zipPromise.then(async () => {
      const file = zipFileManger.get(zipUrl, dicomFile);
      try {
        const dicomFileBuffer = await file.async('arraybuffer');
        resolve(dicomFileBuffer);
      } catch (error) {
        reject(error);
      }
    }, reject);
  });
}

export default loadZipRequest;
