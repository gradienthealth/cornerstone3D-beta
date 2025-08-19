import type { CodDicomWebServer } from 'cod-dicomweb-server';

let codWebServer: CodDicomWebServer;
let codHeaders: Record<string, string>;

export function setWadoRsWebServer(webServer: CodDicomWebServer) {
  codWebServer = webServer;
}

export function getWadoRsWebServer(): CodDicomWebServer {
  return codWebServer;
}

export function setCodHeaders(headers: Record<string, string>) {
  codHeaders = headers;
}

export function getCodHeaders(): Record<string, string> {
  return codHeaders;
}
