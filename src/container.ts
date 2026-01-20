/* @preserve
  (c) 2025 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import { ok } from 'node:assert';

import type { ioc_container_t, lyt_cstor_t, lyt_type_t } from './types';

import { lyt_sealed } from './lib/sealed.js';
import { lyt_obj } from './lib/obj.js';
import ioc from './helper.js';
import { ioc_func_no_invoke } from './const.js';

let _collection: Map<lyt_type_t, unknown>;
const _instance = new Map<lyt_type_t, { args: unknown[]; rt: unknown }[]>();

export function ioc_container_init(
  map: Map<Function, unknown>,
): ioc_container_t {
  ok(!_collection?.size, 'ioc container already created.');
  _collection = new Map<lyt_type_t, unknown>(map.entries());
  return _container;
}

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
          const imp = rt[0][0];
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
      const rt = ioc.create_instance<_t_>(
        <lyt_cstor_t<_t_>>func,
        this,
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
    rt = ioc.create_instance<_t_>(<lyt_cstor_t<_t_>>type, this, ...args);
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
