import type { CodDicomWebServer } from 'cod-dicomweb-server';

let codWebServer: CodDicomWebServer;

export function setWadoRsWebServer(webServer: CodDicomWebServer) {
  codWebServer = webServer;
}

export function getWadoRsWebServer(): CodDicomWebServer {
  return codWebServer;
}
