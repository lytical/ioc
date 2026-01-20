/* @preserve
  (c) 2025 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import { ioc_func_no_invoke } from './const.js';

import ioc from './helper.js';

export * from './collection.js';
export * from './container.js';
export * from './inject.js';
export default ioc;

declare global {
  interface Function {
    [ioc_func_no_invoke]?: true;
  }
}
