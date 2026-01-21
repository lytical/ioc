/* @preserve
  (c) 2025 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import type {
  lyt_cstor_t,
  ioc_container_t,
  lyt_type_t,
} from './types';

import {
  ioc_cstor_nm,
  ioc_argument_inject,
  ioc_argument_injectable,
} from './const.js';

import collection from './collection.js';

/**
 * decorates a class as an injectable service.
 * @description
 * a delegate function can be specified as an argument (delegate(svc: container): unknown|[[unknown]]) to implement a factory pattern.
 * this delegate will be invoked when the service instance is requested.
 * if a delegate function returns an array, within an array, containing a single element ([[unknown]]),
 * this element will replace the delegate as the service instance or type.
 * this allows for lazy evaluation of the service instance or type.
 * @param arg (optional) a factory method, or the type that implements the service. the decorated type is registered if not specified.
 * @returns the typescript decorator function.
 */
export function ioc_injectable(
  arg?: ((svc: ioc_container_t) => unknown) | Function,
) {
  return (cstr: Function) => {
    const type = arg || cstr;
    collection.set(cstr, arg ?? type);
    cstr.prototype[ioc_argument_injectable] = arg || cstr;
  };
}

/**
 * decorates a class method argument, indicating the type of service to inject.
 * @param type the class or function type of the service to inject.
 * @returns the typescript decorator.
 */
export function ioc_inject(type: Function | lyt_cstor_t, ...args: unknown[]) {
  return (cstr: any, method_nm: string | undefined, ordinal: number) => {
    const metadata: ioc_method_metadata_t = cstr[ioc_argument_inject] || {};
    if (!method_nm) {
      method_nm = ioc_cstor_nm;
    }
    if (metadata[method_nm] === undefined) {
      const param: ioc_method_args_t[] = [];
      param[ordinal] = { type, args };
      metadata[method_nm] = param;
      cstr[ioc_argument_inject] = metadata;
    } else {
      metadata[method_nm]![ordinal] = { type, args };
    }
  };
}

export type ioc_method_args_t = { type: lyt_type_t; args: unknown[] };
export type ioc_method_metadata_t = Record<string, ioc_method_args_t[]>;
