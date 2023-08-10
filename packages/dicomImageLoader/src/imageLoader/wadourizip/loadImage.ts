import { Types } from '@cornerstonejs/core';
import {DICOMLoaderImageOptions} from '../../types'
import parseImageId from './parseImageId';
import { xhrRequest } from '../internal';
import cacheManager from './cacheManager';
import { loadImageFromPromise } from '../wadouri/loadImage';

function loadImage(
  imageId: string,
  options: DICOMLoaderImageOptions = {}
): Types.IImageLoadObject {
  const parsedImageId = parseImageId(imageId);

  options = Object.assign({}, options);
  const loader = xhrRequest;

  const dataSetPromise = cacheManager.load(
    parsedImageId.zipUrl,
    imageId,
    parsedImageId.dicomFile,
    loader
  );

  const imagePromise = loadImageFromPromise(
    dataSetPromise,
    imageId,
    parsedImageId.frame,
    parsedImageId.zipUrl,
    options
  );

  return imagePromise;
}

export {loadImage}
