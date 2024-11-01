import loadImage from './loadImage';
import { metaDataProvider } from './metaData/index';
import { registerFileStreamingWebWorker } from './registerFileStreaming';

export default function (cornerstone) {
  // register wadors scheme and metadata provider
  cornerstone.registerImageLoader('wadors', loadImage);
  cornerstone.registerImageLoader('dicomtar', loadImage);

  cornerstone.metaData.addProvider(metaDataProvider);

  // register file streaming web worker
  registerFileStreamingWebWorker();
}
