/* @preserve
  (c) 2025 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

/**
 * represents an inversion of control collection.
 * @description
 * utilize to configure services and create the container.
 * @interface ioc_collection_t
 */
export interface ioc_collection_t {
  configure_option<_t_ extends object>(
    type: lyt_type_t,
    value: _t_ | (() => _t_ | Promise<_t_>),
  ): this;
  create_container(): Promise<ioc_container_t>;
  has(type: lyt_type_t): boolean;
  set<_t_>(type: lyt_type_t<_t_>, func: (svc: ioc_container_t) => _t_): this;
  set(type: lyt_type_t | [lyt_type_t], arg?: any): this;
  set_func(type: Function, arg?: any): this;
}

/**
 * represents an inversion of control container.
 * @description
 * utilize to retrieve service instances.
 * @interface ioc_container_t
 */
export interface ioc_container_t {
  get<_t_>(type: lyt_type_t<_t_>, ...args: unknown[]): _t_ | undefined;
  get<_t_>(type: Function, ...args: unknown[]): _t_ | undefined;
  get_or_create<_t_>(
    type: lyt_type_t<_t_>,
    ...args: unknown[]
  ): _t_ | undefined;
  has(type: Function): boolean;
  require<_t_>(type: lyt_type_t<_t_>, ...args: unknown[]): _t_;
  require<_t_>(type: Function, ...args: unknown[]): _t_;
}

export type ioc_method_args_t = { type: lyt_type_t; args: unknown[] };
export type ioc_method_metadata_t = Record<string, ioc_method_args_t[]>;

export type lyt_cstor_t<_t_ = unknown> = new (..._: any[]) => _t_;
export type lyt_type_t<_t_ = unknown> = Function | lyt_cstor_t<_t_>;
