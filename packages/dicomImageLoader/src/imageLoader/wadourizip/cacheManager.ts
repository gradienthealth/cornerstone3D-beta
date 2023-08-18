import JSZip from "jszip";
import { DataSet } from "dicom-parser";
import external from '../../externalModules';
import { LoadRequestFunction } from "dicomImageLoader/src/types";

let loadedDataSets: Record<string, { dataSet: DataSet}> =
  {};

function load(
  zipUrl:string,
  imageId:string,
  dicomFile:string,
  loadRequest:LoadRequestFunction):Promise<DataSet>{

  const {  dicomParser } = external;
  //Check is the zip loaded
    // If not loaded, start loading the zip, loading the imageId and return the promise
    // If zip is loaded,
      // Check if the imageId is loaded.
      // If the imageId is loaded, return that.
      // If imageId is being loaded, return that promise
      // Else start loading imageId and return that promise

    //  If zip is loading, start loading the imageId and return the promise
  // This zip is not loaded or being loaded, load it via an xhrRequest
  const dicomInZip = zipUrl + '/' + dicomFile;

  const loadZipPromise = loadRequest(zipUrl, imageId);
  const zipPromise = new Promise<DataSet>((resolve, reject) => {
    loadZipPromise.then(async (arrayBuffer)=>{

     let zip = new JSZip();
     const extractedFiles = await zip.loadAsync(arrayBuffer);
     console.log('unzipping');

    const currentDicomFile = extractedFiles.files[dicomFile];
    const dicomFileBuffer = await currentDicomFile.async('arraybuffer');

    const byteArray = new Uint8Array(dicomFileBuffer);
    let dataSet: DataSet
    try {
        dataSet = dicomParser.parseDicom(byteArray);
    } catch (error) {
      return reject(error);
    }
    loadedDataSets[dicomInZip] = { dataSet};
    resolve(dataSet);
    },reject)
  });

return zipPromise;
}

function get(imageId) {
  return loadedDataSets[imageId].dataSet;
}

export default {load, get};
