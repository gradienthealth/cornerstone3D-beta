import JSZip from "jszip";
import { DataSet } from "dicom-parser";
import external from '../../externalModules';
import { LoadRequestFunction } from "dicomImageLoader/src/types";

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
    resolve(dataSet);
    },reject)
  });

return zipPromise;
}

export default {load};
