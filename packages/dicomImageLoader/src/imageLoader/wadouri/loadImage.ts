import { DataSet } from 'dicom-parser';
import { Types, metaData } from '@cornerstonejs/core';
import createImage from '../createImage';
import { xhrRequest } from '../internal/index';
import external from '../../externalModules';
import dataSetCacheManager, { loadedDataSets } from './dataSetCacheManager';
import {
  LoadRequestFunction,
  DICOMLoaderIImage,
  DICOMLoaderImageOptions,
  ImageFrame,
} from '../../types';
import getPixelData from './getPixelData';
import loadFileRequest from './loadFileRequest';
import loadZipRequest from './loadZipRequest';
import parseImageId from './parseImageId';

// add a decache callback function to clear out our dataSetCacheManager
function addDecache(imageLoadObject: Types.IImageLoadObject, imageId: string) {
  imageLoadObject.decache = function () {
    // console.log('decache');
    const parsedImageId = parseImageId(imageId);

    dataSetCacheManager.unload(parsedImageId.url);
  };
}

/**
 * Given the dataSetPromise and imageId this will return a promise to be
 * resolved with an image object containing the loaded image.
 *
 * @param dataSetPromise - A promise that resolves to a DataSet object.
 * @param imageId - The imageId of the image to be loaded.
 * @param frame - The frame number to be loaded in case of multiframe. it should
 * be noted that this is used to extract the pixelData from dicomParser and
 * dicomParser is 0-based index (the first pixelData is frame 0); however,
 * in metadata and imageId frame is 1-based index (the first frame is frame 1).
 * @param sharedCacheKey -  A key to be used to cache the loaded image.
 * @param options - Options to be used when loading the image.
 * @param callbacks - Callbacks to be called when the image is loaded.
 * @returns An object containing a promise to be resolved with the loaded image
 */
function loadImageFromPromise(
  dataSetPromise: Promise<DataSet>,
  imageId: string,
  frame = 0,
  sharedCacheKey: string,
  options: DICOMLoaderImageOptions,
  callbacks?: {
    imageDoneCallback: (image: DICOMLoaderIImage) => void;
  }
): Types.IImageLoadObject {
  const start = new Date().getTime();
  const imageLoadObject: Types.IImageLoadObject = {
    cancelFn: undefined,
    promise: undefined,
  };

  imageLoadObject.promise = new Promise((resolve, reject) => {
    dataSetPromise.then(
      (dataSet /* , xhr*/) => {
        const pixelData = getPixelData(dataSet, frame);
        const transferSyntax = dataSet.string('x00020010');
        const loadEnd = new Date().getTime();
        const imagePromise = createImage(
          imageId,
          pixelData,
          transferSyntax,
          options
        );

        addDecache(imageLoadObject, imageId);

        imagePromise.then(
          (image) => {
            image = image as DICOMLoaderIImage;
            image.data = dataSet;
            image.sharedCacheKey = sharedCacheKey;
            const end = new Date().getTime();

            image.loadTimeInMS = loadEnd - start;
            image.totalTimeInMS = end - start;
            if (
              callbacks !== undefined &&
              callbacks.imageDoneCallback !== undefined
            ) {
              callbacks.imageDoneCallback(image);
            }
            resolve(image);
          },
          function (error) {
            // Reject the error, and the dataSet
            reject({
              error,
              dataSet,
            });
          }
        );
      },
      function (error) {
        // Reject the error
        reject({
          error,
        });
      }
    );
  });

  return imageLoadObject;
}

function loadImageFromDataSet(
  dataSet,
  imageId: string,
  frame = 0,
  sharedCacheKey: string,
  options
): Types.IImageLoadObject {
  const start = new Date().getTime();

  const promise = new Promise<DICOMLoaderIImage | ImageFrame>(
    (resolve, reject) => {
      const loadEnd = new Date().getTime();

      let imagePromise: Promise<DICOMLoaderIImage | ImageFrame>;

      try {
        let pixelData;
        const dataSetElements = dataSet.elements;
        if (dataSetElements.x7fe00010?.[frame] instanceof Uint8Array) {
          pixelData = dataSetElements.x7fe00010[frame];
        } else {
          pixelData = getPixelData(dataSet, frame);
        }
        const transferSyntax = dataSet.string('x00020010');

        imagePromise = createImage(
          imageId,
          pixelData,
          transferSyntax,
          options
        );
      } catch (error) {
        // Reject the error, and the dataSet
        reject({
          error,
          dataSet,
        });

        return;
      }

      imagePromise.then((image) => {
        image = image as DICOMLoaderIImage;

        image.data = dataSet;
        image.sharedCacheKey = sharedCacheKey;
        const end = new Date().getTime();

        image.loadTimeInMS = loadEnd - start;
        image.totalTimeInMS = end - start;
        resolve(image);
      }, reject);
    }
  );

  return {
    promise: promise as Promise<any>,
    cancelFn: undefined,
  };
}

function loadImageWithRange(
  imageId: string,
  loader: LoadRequestFunction,
  frameIndex: number,
  sharedCacheKey: string,
  options: DICOMLoaderImageOptions,
  callbacks?: { imageDoneCallback: (image: DICOMLoaderIImage) => void }
): Types.IImageLoadObject {
  const start = new Date().getTime();
  const instance = metaData.get('instance', imageId);
  const { ExtendedOffsetTable, ExtendedOffsetTableLengths, FileOffsets } =
    instance;
  const fileStartByte = FileOffsets?.startByte ?? 0;

  const protocolIndex = sharedCacheKey.indexOf('://'); // http://, https://
  const tarFileInnerPath = sharedCacheKey.indexOf('://', protocolIndex + 3);
  if (imageId.split(':')[0] !== 'dicomzip' && tarFileInnerPath >= 0) {
    sharedCacheKey = sharedCacheKey.substring(0, tarFileInnerPath);
  }

  const headerPromise: Promise<{ dataSet; headerArrayBuffer }> = new Promise(
    (resolve) => {
      if (loadedDataSets[sharedCacheKey]?.dataSet) {
        resolve({
          dataSet: loadedDataSets[sharedCacheKey]?.dataSet,
          headerArrayBuffer: loadedDataSets[
            sharedCacheKey
          ].dataSet.byteArray.slice(0, ExtendedOffsetTable[0] - 1),
        });
      } else {
        loader(sharedCacheKey, imageId, {
          Range: `bytes=${fileStartByte}-${
            fileStartByte + ExtendedOffsetTable[0] - 1
          }`,
        }).then((arraybuffer) => {
          const dataSet = external.dicomParser.parseDicom(
            new Uint8Array(arraybuffer),
            { untilTag: 'x7fe00010' }
          );

          resolve({ dataSet, headerArrayBuffer: arraybuffer });
        });
      }
    }
  );

  const startByte = fileStartByte + ExtendedOffsetTable[frameIndex];
  const endByte = startByte + ExtendedOffsetTableLengths[frameIndex];
  const pixelDataPromise = loader(sharedCacheKey, imageId, {
    Range: `bytes=${startByte}-${endByte}`,
  }).then((arraybuffer) => ({ pixelDataArrayBuffer: arraybuffer }));

  const imageLoadObject: Types.IImageLoadObject = {
    cancelFn: undefined,
    promise: undefined,
  };
  imageLoadObject.promise = new Promise((resolve, reject) => {
    Promise.all([headerPromise, pixelDataPromise]).then(
      (values) => {
        const [{ dataSet, headerArrayBuffer }, { pixelDataArrayBuffer }] =
          values;
        const loadEnd = new Date().getTime();
        const pixelData = new Uint8Array(pixelDataArrayBuffer);
        const transferSyntax = instance._meta.TransferSyntaxUID;

        if (!dataSetCacheManager.isLoaded(sharedCacheKey)) {
          dataSet.elements.x7fe00010 = {};
          dataSet.elements.x7fe00010[frameIndex] = pixelData;
          const completeByteArray = new Uint8Array(
            headerArrayBuffer.byteLength + pixelDataArrayBuffer.byteLength
          );
          completeByteArray.set(new Uint8Array(headerArrayBuffer));
          completeByteArray.set(pixelData, headerArrayBuffer.byteLength);
          dataSet.byteArray = completeByteArray;

          dataSetCacheManager.addDataSet(sharedCacheKey, dataSet);
        } else {
          const dataSetElements =
            loadedDataSets[sharedCacheKey].dataSet.elements;
          dataSet.elements.x7fe00010 = dataSetElements.x7fe00010;
          dataSet.elements.x7fe00010[frameIndex] = pixelData;
          const completeByteArray = new Uint8Array(
            dataSet.byteArray.byteLength + pixelDataArrayBuffer.byteLength
          );
          completeByteArray.set(dataSet.byteArray.byteLength);
          completeByteArray.set(pixelData, headerArrayBuffer.byteLength);
          dataSet.byteArray = completeByteArray;

          loadedDataSets[sharedCacheKey].cacheCount++;
          dataSetCacheManager.update(sharedCacheKey, dataSet);
        }

        const imagePromise = createImage(
          imageId,
          pixelData,
          transferSyntax,
          options
        );

        addDecache(imageLoadObject, imageId);

        imagePromise.then(
          (image) => {
            image = image as DICOMLoaderIImage;
            image.data = dataSet;
            image.sharedCacheKey = sharedCacheKey;
            const end = new Date().getTime();

            image.loadTimeInMS = loadEnd - start;
            image.totalTimeInMS = end - start;
            if (
              callbacks !== undefined &&
              callbacks.imageDoneCallback !== undefined
            ) {
              callbacks.imageDoneCallback(image);
            }
            resolve(image);
          },
          function (error) {
            // Reject the error, and the dataSet
            reject({
              error,
              dataSet,
            });
          }
        );
      },
      function (error) {
        // Reject the error
        reject({
          error,
        });
      }
    );
  });

  return imageLoadObject;
}

function getLoaderForScheme(scheme: string): LoadRequestFunction {
  if (scheme === 'dicomweb' || scheme === 'wadouri') {
    return xhrRequest;
  } else if (scheme === 'dicomfile') {
    return loadFileRequest;
  }
  else if (scheme === 'dicomzip'){
    return loadZipRequest;
  }
}

function framePixelDataExists(parsedImageId): boolean {
  const pixelDataElement =
    loadedDataSets[parsedImageId.url]?.dataSet.elements.x7fe00010;
  return !!(
    pixelDataElement?.dataOffset ||
    pixelDataElement?.[parsedImageId.pixelDataFrame]
  );
}

function loadImage(
  imageId: string,
  options: DICOMLoaderImageOptions = {}
): Types.IImageLoadObject {
  const parsedImageId = parseImageId(imageId);

  options = Object.assign({}, options);
  let loader = options.loader;

  if (loader === undefined) {
    loader = getLoaderForScheme(parsedImageId.scheme);
  } else {
    delete options.loader;
  }

  // if the dataset for this url is already loaded, use it, in case of multiframe
  // images, we need to extract the frame pixelData from the dataset although the
  // image is loaded
  if (
    dataSetCacheManager.isLoaded(parsedImageId.url) &&
    framePixelDataExists(parsedImageId)
  ) {
    /**
     * @todo The arguments to the dataSetCacheManager below are incorrect.
     */
    const dataSet: DataSet = (dataSetCacheManager as any).get(
      parsedImageId.url,
      loader,
      imageId
    );

    return loadImageFromDataSet(
      dataSet,
      imageId,
      parsedImageId.pixelDataFrame,
      parsedImageId.url,
      options
    );
  }

  const instance = metaData.get('instance', imageId);
  if (instance?.ExtendedOffsetTable && instance?.ExtendedOffsetTableLengths) {
    // Fetch only a single frame pixeldata of a multiframe dicom file.
    return loadImageWithRange(
      imageId,
      loader,
      parsedImageId.pixelDataFrame,
      parsedImageId.url,
      options
    );
  }

  // load the dataSet via the dataSetCacheManager
  const dataSetPromise = dataSetCacheManager.load(
    parsedImageId.url,
    loader,
    imageId
  );

  return loadImageFromPromise(
    dataSetPromise,
    imageId,
    parsedImageId.pixelDataFrame,
    parsedImageId.url,
    options
  );
}

export { loadImageFromPromise, getLoaderForScheme, loadImage };
