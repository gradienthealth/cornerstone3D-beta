import { Types, Enums, metaData } from '@cornerstonejs/core';
import { LoaderXhrRequestPromise } from '../../types';
import { CornerstoneWadoRsLoaderOptions } from '../wadors/loadImage';
import parseImageId from '../wadouri/parseImageId';
import loadTarRequest from './loadTarRequest';
import external from '../../externalModules';

export default function tarRequest(
  url: string,
  imageId: string,
  defaultHeaders: Record<string, string> = {},
  options: CornerstoneWadoRsLoaderOptions = {}
): LoaderXhrRequestPromise<{
  contentType: string;
  pixelData: Uint8Array;
  imageQualityStatus: Enums.ImageQualityStatus;
  percentComplete: number;
}> | void {
  const { pixelDataFrame } = parseImageId(imageId);
  let imagePromise;

  const instance = metaData.get('instance', imageId) || {};
  const { CustomOffsetTable, CustomOffsetTableLengths } = instance;

  if (CustomOffsetTable && CustomOffsetTableLengths) {
    const startByte = CustomOffsetTable[pixelDataFrame];
    const endByte = startByte + CustomOffsetTableLengths[pixelDataFrame];
    const headerRange = `bytes=0-${CustomOffsetTable[0] - 1}`;
    const pixelDataRange = `bytes=${startByte}-${endByte}`;

    const headerPromise = loadTarRequest(url, imageId, {
      ...defaultHeaders,
      Range: headerRange,
    });
    const pixelDataPromise = loadTarRequest(url, imageId, {
      ...defaultHeaders,
      Range: pixelDataRange,
    });

    imagePromise = Promise.all([headerPromise, pixelDataPromise]).then(
      (results) => ({ headerBuffer: results[0], pixelDataBuffer: results[1] })
    );
  } else {
    imagePromise = loadTarRequest(url, imageId, defaultHeaders).then(
      (arraybuffer) => ({
        fileBuffer: arraybuffer,
      })
    );
  }

  return imagePromise.then((result) => {
    const { headerBuffer, pixelDataBuffer, fileBuffer } = result;
    const dataSet = external.dicomParser.parseDicom(
      new Uint8Array(fileBuffer || headerBuffer),
      { ...(headerBuffer && { untilTag: 'x7fe00010' }) }
    );
    const transferSyntax = dataSet.string('x00020010');
    let pixelData;

    if (fileBuffer) {
      const pixelDataElement = dataSet.elements.x7fe00010;
      let { dataOffset, length } = pixelDataElement;
      if (pixelDataElement.hadUndefinedLength) {
        ({ position: dataOffset, length } = pixelDataElement.fragments[0]);
      } else {
        // Adding 8 bytes for 4 bytes tag + 4 bytes length for uncomppressed pixelData
        dataOffset += 8;
      }
      const slice = fileBuffer.slice(dataOffset, dataOffset + length);
      pixelData = new Uint8Array(slice);
    } else {
      pixelData = new Uint8Array(pixelDataBuffer);
    }

    return {
      contentType: `transfer-syntax=${transferSyntax}`,
      imageQualityStatus: Enums.ImageQualityStatus.FULL_RESOLUTION,
      pixelData,
      percentComplete: 100,
    };
  });
}
