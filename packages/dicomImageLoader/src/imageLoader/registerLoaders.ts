import wadors from './wadors/index';
import wadouri from './wadouri/index';
import wadourizip from './wadourizip';

/**
 * Register the WADO-URI and WADO-RS image loaders and metaData providers
 * with an instance of Cornerstone Core.
 *
 * @param cornerstone The Cornerstone Core library to register the image loaders with
 */
function registerLoaders(cornerstone: any): void {
  wadors.register(cornerstone);
  wadouri.register(cornerstone);
  wadourizip.register(cornerstone);
}

export default registerLoaders;
