/* @preserve
  (c) 2025 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import { ok } from 'node:assert';

import type {
  lyt_cstor_t,
  ioc_container_t,
} from './types';

import type { ioc_method_metadata_t } from './inject';

import { ioc_cstor_nm, ioc_argument_inject } from './const.js';

/**
 * helper class for inversion-of-control (ioc) operations.
 */
export default class ioc_ioc {
  /**
   * create an instance of the specified class, by injecting services obtained from the specified ioc container.
   * @param cstor the class constructor of the instance to return.
   * @param svc the ioc container used to inject constructor arguments.
   * @param args optional values to append to the constructor arguments.
   * @returns the constructed instance of the specified class.
   */
  static create_instance<_t_ = any>(
    cstor: lyt_cstor_t<_t_>,
    svc: ioc_container_t,
    ...args: unknown[]
  ): _t_ {
    return <_t_>new cstor(...ioc_ioc.get_method_args(svc, cstor).concat(args));
  }

  /**
   * the the method arguments, by obtaining injectable services obtained from the specified ioc container.
   * @param svc the ioc container used to obtain injected arguments for the specified method.
   * @param cstr the class type containing the specified class method.
   * @param method_nm the class method to get arguments for. the constructor's arguments are returned if not specified.
   * @returns an array of arguments that may be used to invoke the specified class method.
   */
  static get_method_args(
    svc: ioc_container_t,
    cstr: any,
    method_nm: string = ioc_cstor_nm,
  ): any[] {
    while (cstr) {
      const metadata: ioc_method_metadata_t = cstr[ioc_argument_inject];
      if (metadata?.[method_nm] !== undefined) {
        return metadata[method_nm].map((x) =>
          x ? svc.get(x.type, ...x.args) : undefined,
        );
      }
      cstr = cstr.prototype;
    }
    return [];
  }

  /**
   * invoke the specified class method, by injecting services obtained from the specified ioc container.
   * @param method_nm the function to invoke.
   * @param cls_t the class type containing the specified method.
   * @param svc the ioc container used to obtain injected arguments for the specified function.
   * @param instance the optional instance used for the function's (this).
   * @param args optional values to append to the function arguments.
   * @returns the function's return value.
   */
  static invoke_method(
    method_nm: string,
    cls_t: any,
    svc: ioc_container_t,
    instance?: any,
    ...args: unknown[]
  ): any {
    ok(typeof cls_t === 'function', `invalid class type specified`);
    const method = <Function>cls_t[method_nm];
    ok(
      typeof method === 'function',
      `method not found: ${cls_t.name}.${method_nm}`,
    );
    return method.apply(
      instance,
      ioc_ioc.get_method_args(svc, cls_t, method_nm).concat(args),
    );
  }
}
