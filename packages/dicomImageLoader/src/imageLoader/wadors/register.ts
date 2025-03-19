import { metaData, registerImageLoader, type Types } from '@cornerstonejs/core';
import { CodDicomWebServer } from 'cod-dicomweb-server';
import loadImage from './loadImage';
import { metaDataProvider } from './metaData';
import { setWadoRsWebServer } from '../internal/codWebServer';

export default function () {
  // register wadors scheme and metadata provider
  registerImageLoader('wadors', loadImage as unknown as Types.ImageLoaderFn);
  metaData.addProvider(metaDataProvider);

  // initialize the CodDicomWebServer
  registerImageLoader('cod', loadImage as unknown as Types.ImageLoaderFn);
  const MAXIMUM_WORKER_FETCH_SIZE = 2 * 1_073_741_824; // 2 x 1 GB
  const codDicomWebServer = new CodDicomWebServer({
    maxWorkerFetchSize: MAXIMUM_WORKER_FETCH_SIZE,
  });
  setWadoRsWebServer(codDicomWebServer);
}
