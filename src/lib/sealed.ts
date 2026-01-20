/* @preserve
  (c) 2025 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import type { lyt_type_t } from '../types';

export function lyt_sealed<_t_ extends lyt_type_t>(cstor: _t_) {
  Object.seal(cstor);
  Object.seal(cstor.prototype);
  return cstor;
}
