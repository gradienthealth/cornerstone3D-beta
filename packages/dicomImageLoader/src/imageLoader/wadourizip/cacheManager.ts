import JSZip, { JSZipObject } from 'jszip';
import { DataSet } from 'dicom-parser';
import external from '../../externalModules';
import { LoadRequestFunction } from 'dicomImageLoader/src/types';

let zipPromises = {};
let extractedDicomFiles: Record<string, Record<string, JSZipObject>> = {};
let loadedDataSets: Record<string, { dataSet: DataSet; }> ={};

function load(
  zipUrl:string,
  imageId:string,
  dicomFile:string,
  loadRequest:LoadRequestFunction):Promise<DataSet> {

  const dicomInZip = zipUrl + '/' + dicomFile;

  // If the dataSet is already loaded, return it right away.
  if (loadedDataSets[dicomInZip]) {
    return new Promise((resolve) => {
      resolve(loadedDataSets[dicomInZip].dataSet);
    });
  }

  // If the dicom file is extracted from zip, create dataSet
  if (extractedDicomFiles[zipUrl]) {
    const currentDicomFile = extractedDicomFiles[zipUrl][dicomFile];
    return loadDataSetFromFile(currentDicomFile, dicomInZip);
  }

  let loadZipPromise: Promise<ArrayBuffer>;

  if (zipPromises[zipUrl]) {
    loadZipPromise = zipPromises[zipUrl];
  } else {
    loadZipPromise = loadRequest(zipUrl, imageId);
    zipPromises[zipUrl] = loadZipPromise;
  }

  const zipPromise = new Promise<DataSet>((resolve, reject) => {
    loadZipPromise.then(async (arrayBuffer) => {
      let extractedFile: JSZipObject;
      if (extractedDicomFiles[zipUrl]) {
        extractedFile = extractedDicomFiles[zipUrl][dicomInZip];
      } else {
        let zip = new JSZip();
        const extractedFiles = await zip.loadAsync(arrayBuffer);
        extractedFile = extractedFiles.files[dicomFile];
        extractedDicomFiles[zipUrl] = extractedFiles.files;

        // remove cached zip promise.
        delete zipPromises[zipUrl];

      }
      loadDataSetFromFile(extractedFile, dicomInZip).then(
        (dataset) => resolve(dataset),
        reject
      );
    }, reject);
  });
  return zipPromise;
}

async function loadDataSetFromFile(
  extractedFile,
  dicomInZip
): Promise<DataSet> {
  const { dicomParser } = external;

  return new Promise(async (resolve, reject) => {
    const dicomFileBuffer = await extractedFile.async('arraybuffer');

    const byteArray = new Uint8Array(dicomFileBuffer);

    let dataSet: DataSet;
    try {
      dataSet = dicomParser.parseDicom(byteArray);
    } catch (error) {
      return reject(error);
    }
    loadedDataSets[dicomInZip] = { dataSet};
    resolve(dataSet);
  });
}

function get(imageId:string) {
  return loadedDataSets[imageId].dataSet;
}

export default { load, get };
