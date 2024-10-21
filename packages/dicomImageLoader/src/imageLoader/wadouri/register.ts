import * as cornerstoneImport from '@cornerstonejs/core';
import { loadImage } from './loadImage';
import { metaDataProvider } from './metaData/index';
import { registerFileStreamingWebWorker } from './registerFileStreaming';

export default function (cornerstone: typeof cornerstoneImport): void {
  // register dicomweb and wadouri image loader prefixes
  cornerstone.registerImageLoader('dicomweb', loadImage);
  cornerstone.registerImageLoader('wadouri', loadImage);
  cornerstone.registerImageLoader('dicomfile', loadImage);
  cornerstone.registerImageLoader('dicomzip', loadImage);
  cornerstone.registerImageLoader('dicomtar', loadImage);

  // add wadouri metadata provider
  cornerstone.metaData.addProvider(metaDataProvider);

  // register file-streaming web worker
  registerFileStreamingWebWorker();
}
