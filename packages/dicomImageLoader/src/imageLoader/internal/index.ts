import { default as xhrRequest } from './xhrRequest';
import { default as streamRequest } from './streamRequest';
import { setOptions, getOptions } from './options';
import { getWadoRsWebServer, setCodHeaders } from './codWebServer';

const internal = {
  xhrRequest,
  streamRequest,
  setOptions,
  getOptions,
  getWadoRsWebServer,
  setCodHeaders,
};

export {
  setOptions,
  getOptions,
  xhrRequest,
  internal,
  streamRequest,
  getWadoRsWebServer,
  setCodHeaders,
};
