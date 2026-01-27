/* @preserve
  (c) 2025 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import { ok } from 'node:assert';

import type { ioc_container_t, lyt_cstor_t, lyt_type_t } from './types';
import type { ioc_method_metadata_t } from './inject';

import { lyt_sealed } from './lib/sealed.js';
import { lyt_obj } from './lib/obj.js';

import {
  ioc_argument_inject,
  ioc_cstor_nm,
  ioc_func_no_invoke,
} from './const.js';

let _collection: Map<lyt_type_t, unknown> | undefined;
const _instance = new Map<lyt_type_t, { args: unknown[]; rt: unknown }[]>();

@lyt_sealed
class container implements ioc_container_t {
  get<_t_>(type: lyt_type_t<_t_>, ...args: unknown[]): _t_ | undefined {
    ok(_collection, 'ioc container not initialized.');
    if (args.length && _instance.has(type)) {
      const rs = _instance
        .get(type)!
        .find((x) => lyt_obj.are_equal(args, x.args));
      if (rs) {
        return <_t_>rs.rt;
      }
    }
    if (_collection.has(type)) {
      let func = _collection.get(type);
      if (typeof func !== 'function' || func[ioc_func_no_invoke] === true) {
        return <_t_>func;
      }
      if (!lyt_obj.is_class(func)) {
        let rt: _t_ | [[_t_]] = func.call(undefined, this, ...args);
        if (
          Array.isArray(rt) &&
          rt.length === 1 &&
          Array.isArray(rt[0]) &&
          rt[0].length === 1
        ) {
          const [imp] = rt[0];
          if (args.length) {
            if (_instance.has(type)) {
              _instance.get(type)!.push({ args, rt: imp });
            } else {
              _instance.set(type, [{ args, rt: imp }]);
            }
          } else {
            _collection.set(type, imp);
          }
          return imp;
        }
        return <_t_>rt;
      }
      // it's a class. instantiate and return
      const rt = ioc_create_instance<_t_>(
        <lyt_cstor_t<_t_>>func,
        ...args,
      );
      if (args.length) {
        if (_instance.has(type)) {
          _instance.get(type)!.push({ args, rt });
        } else {
          _instance.set(type, [{ args, rt }]);
        }
      }
      return rt;
    }
    return undefined;
  }

  get_or_create<_t_>(
    type: lyt_type_t<_t_>,
    ...args: unknown[]
  ): _t_ | undefined {
    let rt = this.get<_t_>(type, ...args);
    if (rt) {
      return rt;
    }
    rt = ioc_create_instance<_t_>(<lyt_cstor_t<_t_>>type, this, ...args);
    return rt;
  }

  has(type: lyt_type_t): boolean {
    ok(_collection, 'ioc container not initialized.');
    return _collection!.has(type);
  }

  require<_t_>(type: lyt_type_t<_t_>, ...args: unknown[]): _t_ {
    const rt = this.get<_t_>(type, ...args);
    ok(rt !== undefined, `required type (${type.name}) not registered.`);
    return rt;
  }
}

const _container: ioc_container_t = new container();
export default _container;

/**
 * initialize the ioc container.
 * @description
 * this method is invoked by the collection when creating the container.
 * @param map the map of types to their instances.
 * @returns the initialized container.
 */
export function ioc_container_init(
  map: Map<Function, unknown>,
): ioc_container_t {
  ok(!_collection?.size, 'ioc container already created.');
  _collection = new Map<lyt_type_t, unknown>(map.entries());
  return _container;
}

/**
 * create an instance of the specified class, by injecting services obtained from the ioc container.
 * @param cstor the class constructor of the instance to return.
 * @param svc the ioc container used to inject constructor arguments.
 * @param args optional values to append to the constructor arguments.
 * @returns the constructed instance of the specified class.
 */
export function ioc_create_instance<_t_ = any>(
  cstor: lyt_cstor_t<_t_>,
  ...args: unknown[]
): _t_ {
  return <_t_>(
    new cstor(...ioc_get_method_args(cstor, ioc_cstor_nm).concat(args))
  );
}

/**
 * the the method arguments, by obtaining injectable services obtained from the ioc container.
 * @param cstr the class type containing the specified class method.
 * @param method_nm the class method to get arguments for. the constructor's arguments are returned if not specified.
 * @returns an array of arguments that may be used to invoke the specified class method.
 */
export function ioc_get_method_args(cstr: any, method_nm: string): any[] {
  while (cstr) {
    let metadata: ioc_method_metadata_t = cstr[ioc_argument_inject];
    if (!metadata) {
      metadata = cstr.prototype?.[ioc_argument_inject];
      if (!metadata) {
        metadata = Object.getPrototypeOf(cstr)?.[ioc_argument_inject];
      }
    }
    if (metadata) {
      const method_arg = metadata?.[method_nm];
      if (method_arg !== undefined) {
        return method_arg.map((x) =>
          x ? _container.get(x.type, ...x.args) : undefined,
        );
      }
    }
    cstr = Object.getPrototypeOf(cstr);
  }
  return [];
}

/**
 * invoke the specified class method, by injecting services obtained from the ioc container.
 * @param {method} method the function to invoke.
 * @param instance the class type containing the specified method.
 * @param args optional values to append to the function arguments.
 * @returns the function's return value.
 */
export function ioc_invoke_method(
  method: Function,
  instance: object,
  ...args: unknown[]
): any {
  return method.apply(
    instance,
    ioc_get_method_args(instance, method.name).concat(args),
  );
}
