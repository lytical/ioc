/* @preserve
  (c) 2025 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

const _arraypt = Object.getPrototypeOf([]);
const _is_class_pattern = /^\s*class(\s|{)/;
const _objectpt = Object.getPrototypeOf({});

export class lyt_obj {
  static are_equal(lt: any, rt: any): boolean {
    if (!lyt_obj.are_same_type(lt, rt)) {
      return false;
    }
    const lnan = Number.isNaN(lt);
    const rnan = Number.isNaN(rt);
    if (lnan) {
      return rnan;
    }
    if (rnan) {
      return false;
    }
    if (lt === rt) {
      return true;
    }
    if (lt instanceof Date && rt instanceof Date) {
      return lt.valueOf() == rt.valueOf();
    }
    if (lt && rt) {
      if (Array.isArray(lt) && Array.isArray(rt)) {
        return (
          lt.length === rt.length &&
          lt.every((x, i) => lyt_obj.are_equal(x, rt[i]))
        );
      } else if (typeof lt === 'object' && typeof rt === 'object') {
        return [...new Set(Object.keys(lt).concat(Object.keys(rt)))].every(
          (x) => lyt_obj.are_equal(lt[x], rt[x]),
        );
      }
    }
    return false;
  }

  static are_same_type(lt: any, rt: any): boolean {
    return (
      typeof lt === typeof rt &&
      (lt === undefined ||
        (lt === null && rt === null) ||
        (isNaN(lt) && isNaN(rt)) ||
        Object.getPrototypeOf(lt) === Object.getPrototypeOf(rt))
    );
  }

  static clone<_t_>(obj: _t_, _map = new Map<object, object>()): _t_ {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return <_t_>obj;
    }
    if (obj instanceof Date) {
      return <_t_>(<any>new Date(obj.valueOf()));
    }
    if (_map.has(obj)) {
      return <_t_>_map.get(obj);
    }
    let rt: any = Array.isArray(obj)
      ? []
      : (() => {
          const rt = {};
          Object.setPrototypeOf(rt, Object.getPrototypeOf(obj));
          return rt;
        })();
    _map.set(obj, rt);
    for (let key of Reflect.ownKeys(obj).filter((x) => x !== '__ob__')) {
      const val = (<any>obj)[key];
      if (typeof val === 'object' && val !== null) {
        rt[key] = this.clone(val, _map);
      } else {
        rt[key] = val;
      }
    }
    return <_t_>rt;
  }

  static is_class(value: any) {
    return (
      typeof value === 'function' &&
      _is_class_pattern.test(Function.prototype.toString.call(value))
    );
  }

  static merge<_t_ = object>(target: _t_, ...source: object[]): _t_ {
    if (target !== null && source !== null) {
      for (let src of source) {
        while (src !== _objectpt && src !== _arraypt) {
          lyt_obj._merge(target, src, Object.getOwnPropertyNames(src));
          lyt_obj._merge(target, src, Object.getOwnPropertySymbols(src));
          src = Object.getPrototypeOf(src);
        }
      }
    }
    return target;
  }

  private static _merge(target: any, src: any, prop: any[]) {
    for (let nm of prop) {
      const src_val = src[nm];
      const trg_val = target[nm];
      if (typeof src_val === 'object' && src_val !== null) {
        if (typeof trg_val === 'object') {
          lyt_obj.merge(trg_val, src_val);
        } else {
          let obj: any;
          if (Array.isArray(src_val)) {
            obj = [];
          } else {
            obj = {};
            Object.setPrototypeOf(obj, Object.getPrototypeOf(src_val));
          }
          target[nm] = lyt_obj.merge(obj, src_val);
        }
      } else {
        target[nm] = src_val;
      }
    }
  }
}
