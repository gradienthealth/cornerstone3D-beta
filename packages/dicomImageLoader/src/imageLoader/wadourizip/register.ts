import * as cornerstoneImport from '@cornerstonejs/core';
import { loadImage } from './loadImage';
import { metaDataProvider } from './metaData';

export default function (cornerstone: typeof cornerstoneImport): void {
  // register dicomzip image loader prefix
  cornerstone.registerImageLoader('dicomzip', loadImage);

  // add wadourizip metadata provider
  cornerstone.metaData.addProvider(metaDataProvider);
}
