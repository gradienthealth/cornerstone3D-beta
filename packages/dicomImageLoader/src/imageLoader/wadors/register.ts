import { metaData, registerImageLoader, type Types } from '@cornerstonejs/core';
import loadImage from './loadImage';
import { metaDataProvider } from './metaData';
import { CodDicomWebServer } from 'cod-dicomweb-server';
import { setWadoRsWebServer } from '../internal/codWebServer';

export default function () {
  // register wadors scheme and metadata provider
  registerImageLoader('wadors', loadImage as unknown as Types.ImageLoaderFn);
  metaData.addProvider(metaDataProvider);

  // initialize the CodDicomWebServer
  registerImageLoader('cod', loadImage as unknown as Types.ImageLoaderFn);
  const MAXIMUM_CACHE_SIZE = 4 * 1_073_741_824; // 4 x 1 GB
  const codDicomWebServer = new CodDicomWebServer({
    maxCacheSize: MAXIMUM_CACHE_SIZE,
    enableOPFSCache: true,
  });
  setWadoRsWebServer(codDicomWebServer);
}
