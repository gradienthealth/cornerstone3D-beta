import { Enums, metaData } from '@cornerstonejs/core';
import { FetchType } from 'cod-dicomweb-server';

import { getCodHeaders, getWadoRsWebServer } from '../internal/codWebServer';
import { getOptions } from '../internal/options';
import type { CornerstoneWadoRsLoaderOptions } from '../wadors/loadImage';

export default function codRequest(
  url: string,
  imageId: string,
  defaultHeaders: Record<string, string> = {},
  options: CornerstoneWadoRsLoaderOptions = {}
): Promise<{
  contentType: string;
  pixelData: Uint8Array;
  imageQualityStatus: Enums.ImageQualityStatus;
  percentComplete: number;
}> {
  const instance = metaData.get('instance', imageId) || {};
  const {
    DeidStudyInstanceUID,
    DeidSeriesInstanceUID,
    DeidSopInstanceUID,
    TransferSyntaxUID,
  } = instance;

  const deidReplacedUrl = url.replace(
    /\/studies\/[^/]+\/series\/[^/]+\/instances\/[^/]+\/frames\//,
    `/studies/${DeidStudyInstanceUID}/series/${DeidSeriesInstanceUID}/instances/${DeidSopInstanceUID}/frames/`
  );

  // @ts-ignore
  const headers = getOptions()?.beforeSend() || {};
  const codHeaders = getCodHeaders();
  const webServer = getWadoRsWebServer();

  return webServer
    .fetchCod(
      deidReplacedUrl,
      // @ts-ignore
      { ...defaultHeaders, ...headers, ...codHeaders },
      {
        useSharedArrayBuffer: false,
        fetchType: FetchType.API_OPTIMIZED,
      }
    )
    .then((result) => ({
      contentType: `transfer-syntax=${TransferSyntaxUID}`,
      imageQualityStatus: Enums.ImageQualityStatus.FULL_RESOLUTION,
      pixelData: new Uint8Array(result as ArrayBufferLike),
      percentComplete: 100,
    }))
    .catch((error) => {
      throw error;
    });
}
