import { registerImageLoader } from '@cornerstonejs/core';
import { CodDicomWebServer } from 'cod-dicomweb-server';
import loadImage from './loadImage';
import { metaDataProvider } from './metaData/index';
import { setWadoRsWebServer } from '../internal/codWebServer';

export default function (cornerstone) {
  // register wadors scheme and metadata provider
  cornerstone.registerImageLoader('wadors', loadImage);
  cornerstone.metaData.addProvider(metaDataProvider);

  // initialize the CodDicomWebServer
  registerImageLoader('cod', loadImage);
  const MAXIMUM_WORKER_FETCH_SIZE = 2 * 1_073_741_824; // 2 x 1 GB
  const codDicomWebServer = new CodDicomWebServer({
    maxWorkerFetchSize: MAXIMUM_WORKER_FETCH_SIZE,
  });
  setWadoRsWebServer(codDicomWebServer);
}
