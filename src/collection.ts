/* @preserve
  (c) 2025 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import { ok } from 'node:assert';

import type { lyt_type_t, ioc_collection_t, ioc_container_t } from './types';

import { lyt_sealed } from './lib/sealed.js';
import { ioc_func_no_invoke } from './const.js';
import { ioc_container_init, ioc_create_instance } from './container.js';
import { lyt_obj } from './lib/obj.js';

const _opt = new Map<lyt_type_t, (() => object | Promise<object>)[]>();
const _svc = new Map<lyt_type_t, unknown>();

@lyt_sealed
class collection implements ioc_collection_t {
  configure_option<_t_ extends object>(
    type: lyt_type_t<_t_>,
    value: _t_ | (() => _t_ | Promise<_t_>),
  ) {
    if (_opt.has(type)) {
      _opt.get(type)!.push(value.constructor ? <any>value : () => value);
    } else {
      _opt.set(type, [value.constructor ? <any>value : () => value]);
    }
    return this;
  }

  async create_container(): Promise<ioc_container_t> {
    if (!this._container) {
      for (const [type, cfg] of _opt.entries()) {
        const obj = await Promise.all(
          cfg.map((cb) => {
            const rs: any = typeof cb === 'function' ? (cb() ?? {}) : cb;
            return typeof rs.then === 'function'
              ? <Promise<object>>rs
              : Promise.resolve(rs);
          }),
        );
        const rs = lyt_obj.merge({}, ...obj);
        Object.freeze(rs);
        this.set(type, rs);
      }
      this._container = ioc_container_init(_svc);
    }
    return this._container!;
  }

  has(type: lyt_type_t) {
    return _svc.has(type);
  }

  set(type: lyt_type_t | [lyt_type_t], arg?: any): this {
    if (Array.isArray(type)) {
      type = type[0];
      arg = (svc: ioc_container_t) => [[[ioc_create_instance(<any>type, svc)]]];
    }
    ok(
      !_svc.has(type),
      `service ${type.name} already registered and will not be registered.`,
    );
    _svc.set(type, arg || type);
    return this;
  }

  set_func(type: lyt_type_t, arg?: any) {
    if (arg) {
      arg[ioc_func_no_invoke] = true;
    } else {
      type[ioc_func_no_invoke] = true;
    }
    return this.set(type, arg);
  }

  private _container?: ioc_container_t;
}

export default <ioc_collection_t>new collection();
