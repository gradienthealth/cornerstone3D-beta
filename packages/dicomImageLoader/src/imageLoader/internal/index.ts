import { default as xhrRequest } from './xhrRequest';
import { default as streamRequest } from './streamRequest';
import { setOptions, getOptions } from './options';
import { getWadoRsWebServer } from './codWebServer';

const internal = {
  xhrRequest,
  streamRequest,
  setOptions,
  getOptions,
  getWadoRsWebServer,
};

export {
  setOptions,
  getOptions,
  xhrRequest,
  internal,
  streamRequest,
  getWadoRsWebServer,
};
