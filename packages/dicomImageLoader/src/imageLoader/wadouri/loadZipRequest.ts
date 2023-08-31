//import parseImageId from './parseImageId';
//import fileManager from './fileManager';
import JSZip, { JSZipObject } from 'jszip';
import { xhrRequest } from '../internal/index';
import zipFileManger from './zipFileManger';

let zipPromises = {};
let extractedDicomFiles: Record<string, Record<string, JSZipObject>> = {};

function loadZipRequest(uri: string, imageId: string): Promise<ArrayBuffer> {
  const dicomFileIndex = uri.lastIndexOf('/');
  const dicomFile = uri.substring(dicomFileIndex + 1);
  const zipUrl = uri.substring(0, dicomFileIndex);

  // If the dicom file is extracted from zip, create dataSet
  const extractedFile = zipFileManger.get(zipUrl, dicomFile);
  if (extractedFile) {
    return new Promise<ArrayBuffer>(async (resolve, reject) => {
      const dicomFileBuffer = await extractedFile.async('arraybuffer');
      resolve(dicomFileBuffer);
    });
  }

  let loadZipPromise: Promise<ArrayBuffer>;

  if (zipPromises[zipUrl]) {
    loadZipPromise = zipPromises[zipUrl];
  } else {
    loadZipPromise = xhrRequest(zipUrl, imageId);
    zipPromises[zipUrl] = loadZipPromise;
  }

  return new Promise<ArrayBuffer>(async (resolve, reject) => {
    loadZipPromise.then(async (arrayBuffer) => {
      let extractedFile: JSZipObject;
      extractedFile = zipFileManger.get(zipUrl, dicomFile);
      if (!extractedFile) {
        let zip = new JSZip();
        const extractedFiles = await zip.loadAsync(arrayBuffer);
        extractedFile = extractedFiles.files[dicomFile];
        zipFileManger.add(zipUrl, extractedFiles.files);

        // remove cached zip promise.
        delete zipPromises[zipUrl];
      }

      const dicomFileBuffer = await extractedFile.async('arraybuffer');
      resolve(dicomFileBuffer);
    });
  });
}

export default loadZipRequest;
