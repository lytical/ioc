/* @preserve
  (c) 2025 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

/**
 * represents an inversion of control collection.
 * @description
 * utilize to configure services and initialize the container.
 * all node modules and their dependencies should be registered before creating the container.
 * loaded node modules containing injectables will register services into the collection automatically.
 * manually import modules containing injectables to ensure they are registered.
 * @interface ioc_collection_t
 */
export interface ioc_collection_t {
  /**
   * configure an option for a type
   * @param type the type to configure
   * @param value the value to configure; or a delegate that returns the value or a promise that resolves to the value
   */
  configure_option<_t_ extends object>(
    type: lyt_type_t<_t_>,
    value: _t_ | (() => _t_ | Promise<_t_>),
  ): this;

  /**
   * initialize and get the ioc container.
   * call this method after all services are registered.
   * this can be called just before listening for requests in a server application,
   * or in a start hook in a azure function application, ...
   * @returns a promise that resolves to the ioc container
   */
  create_container(): Promise<ioc_container_t>;

  /**
   * check if a type is registered
   * @param type the type to check
   * @returns true if the type is registered
   */
  has(type: lyt_type_t): boolean;

  /**
   * register a service factory for a type
   * @param type the type to register
   * @param func the factory function that creates the service
   */
  set<_t_>(type: lyt_type_t<_t_>, func: (svc: ioc_container_t) => _t_): this;

  /**
   * register a service type or value for a type
   * @param type the type to register. pass the type as a single member of an array ([class_type]) to register a singleton.
   * @param arg the service type or value to register
   */
  set(type: lyt_type_t | [lyt_type_t], arg?: any): this;

  /**
   * register a service function. the container will return the function instead of invoking it
   * @param type the type to register
   * @param arg the service function to register
   */
  set_func(type: Function, arg?: any): this;
}

/**
 * represents an inversion of control container.
 * @description
 * utilize to retrieve service instances.
 * @interface ioc_container_t
 */
export interface ioc_container_t {
  /**
   * get a service from the container
   * @param type the type to get
   * @param args optional arguments to append to the service constructor
   * @returns the type or instance of the service if it's registered, otherwise (undefined).
   */
  get<_t_>(type: lyt_type_t<_t_>, ...args: unknown[]): _t_ | undefined;

  /**
   * get or create a service from the container
   * @param type the type to get or create
   * @param args optional arguments to append to the service constructor
   * @returns the type or instance of the service, whether if it's registered or not.
   */
  get_or_create<_t_ extends lyt_type_t>(
    type: lyt_type_t<_t_>,
    ...args: unknown[]
  ): _t_ | undefined;

  /**
   * check if a service is registered in the container
   * @param type the type to check
   * @returns true if the type is registered
   */
  has(type: lyt_type_t): boolean;

  /**
   * get the required specified services. an assert exception is throw if the service is not registered
   * @param type the type to require
   * @param args optional arguments to append to the service constructor
   * @returns the type or instance of the service
   * @throws {Error} when the specified service is not registered
   */
  require<_t_>(type: lyt_type_t<_t_>, ...args: unknown[]): _t_;
}

export type lyt_cstor_t<_t_ = unknown> = new (..._: any[]) => _t_;
export type lyt_type_t<_t_ = unknown> = Function | lyt_cstor_t<_t_>;
