import { default as xhrRequest } from './xhrRequest';
import { default as streamRequest } from './streamRequest';
import { setOptions, getOptions } from './options';
import {
  getCodHeaders,
  getWadoRsWebServer,
  setCodHeaders,
} from './codWebServer';

const internal = {
  xhrRequest,
  streamRequest,
  setOptions,
  getOptions,
  getWadoRsWebServer,
  setCodHeaders,
  getCodHeaders,
};

export {
  setOptions,
  getOptions,
  xhrRequest,
  internal,
  streamRequest,
  getWadoRsWebServer,
  setCodHeaders,
  getCodHeaders,
};
