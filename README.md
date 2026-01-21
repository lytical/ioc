# @lytical/ioc

## TypeScript Inversion of Control (IoC, Dependency Injection) for Node

A lightweight, self contained, Inversion of Control (IoC), Node, TypeScript library for managing dependency injection in your applications.

## Features

- no dependencies
- lightweight
- inject constructor and class method arguments using @decorators
- auto register injectable classes using @decorators
- supports singleton; option; and factory patterns

## Getting Started

After installing IOC, configure your `tsconfig.json` file to enable decorators.

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Usage

Decorate your injectables using `@ioc_injectable()`, and then use the container to create an instance of the injectable.

### most common use case

```typescript
import { ioc_injectable } from '@lytical/ioc';
import collection from '@lytical/ioc/collection';

@ioc_injectable()
export class test_svc {
  do_something(): string {
    return 'done';
  }
}

// a container is "locked" once created, so make sure all injectables are registered first
collection.create_container().then((sc) => {
  const ts = sc.get(test_svc);
  console.debug(ts?.do_something()); // 'done'
  console.debug({ is_same_instance: ts === sc.get(test_svc) }); // { is_same_instance: false }
});
```

### module-local class...

```typescript
import { ioc_injectable } from '@lytical/ioc';
import collection from '@lytical/ioc/collection';

// note: this class is not exported
class my_local_svc {
  do_something(): string {
    return 'done';
  }
}

@ioc_injectable(my_local_svc)
export abstract class test_svc {
  abstract do_something(): string;
}

collection.create_container().then((sc) => {
  const ts = sc.get(test_svc);
  console.debug(ts?.do_something()); // 'done'
});
```

### factory...

```typescript
import { ioc_injectable } from '@lytical/ioc';
import collection from '@lytical/ioc/collection';

// note: the next 2 classes are not exported
class dev_version_svc {
  do_something(): string {
    return 'done in dev';
  }
}

class prod_version_svc {
  do_something(): string {
    return 'done in prod';
  }
}

const is_dev_environment = process.env['NODE_ENV'] === 'development';

@ioc_injectable(() =>
  is_dev_environment ? new dev_version_svc() : new prod_version_svc(),
)
export abstract class test_svc {
  abstract do_something(): string;
}

collection.create_container().then((sc) => {
  const ts = sc.get(test_svc);
  console.debug(ts?.do_something()); // 'done in [dev|prod]'
});
```

### singleton...

```typescript
import { ioc_injectable } from '@lytical/ioc';
import collection from '@lytical/ioc/collection';

@ioc_injectable(() => [[new test_svc()]]) // note: the return [[instance]]...
export class test_svc {
  do_something(): string {
    return 'done';
  }
}

collection.create_container().then((sc) => {
  const ts = sc.get(test_svc);
  console.debug(ts?.do_something()); // 'done'
  console.debug({ is_same_instance: ts === sc.get(test_svc) }); // { is_same_instance: true }
});
```

### create instances with dependencies in the constructors...

```typescript
import { ioc_create_instance, ioc_inject, ioc_injectable } from '@lytical/ioc';
import collection from '@lytical/ioc/collection';

@ioc_injectable()
export class test_svc {
  do_something(): string {
    return 'done';
  }
}

class use_svc {
  // constructor with dependencies
  constructor(@ioc_inject(test_svc) public readonly svc: test_svc) {}
}

collection.create_container().then(() => {
  // ioc_create_instance() can instantiate any class and inject dependencies if needed...
  const cls = ioc_create_instance(use_svc);
  console.debug(cls.svc?.do_something()); // 'done'
});
```

### invoke class methods (instance and static) with dependencies...

```typescript
import { ioc_create_instance, ioc_inject, ioc_injectable } from '@lytical/ioc';
import collection from '@lytical/ioc/collection';

@ioc_injectable()
export class test_svc {
  do_something(): string {
    return 'done';
  }
}

class use_svc {
  do_it(@ioc_inject(test_svc) svc?: test_svc, suffix?: string) {
    return (svc?.do_something() ?? '') + suffix;
  }

  static do_it_static(@ioc_inject(test_svc) svc?: test_svc, suffix?: string) {
    return (svc?.do_something() ?? '') + suffix;
  }
}

collection.create_container().then(() => {
  const cls = new use_svc();

  // invoke instance method
  let rs = ioc_invoke_method(cls.do_it, cls, ' again');
  console.log(rs); // 'done again'

  // invoke static method
  rs = ioc_invoke_method(use_svc.do_it_static, use_svc, ' static');
  console.log(rs); // 'done static'
});
```

### configure and inject 'option' dependencies

```typescript
import { ioc_inject, ioc_injectable } from '@lytical/ioc';
import collection from '@lytical/ioc/collection';

class test_opts {
  a?: number;
  b?: string;
  c?: boolean;
}

@ioc_injectable()
export class test_svc {
  constructor(@ioc_inject(test_opts) public readonly option: test_opts) {}

  do_something(): string {
    return `done with a=${this.option.a}, b=${this.option.b}, c=${this.option.c}`;
  }
}

// configure_option() can be called multiple times for the same type
collection.configure_option(test_opts, { a: 42 });
collection.configure_option(test_opts, { b: 'hello' });
collection.configure_option(test_opts, () => ({ c: true }));

// overrides previous 'a' and 'c' asynchronously, great for i/o operations
collection.configure_option(test_opts, () =>
  Promise.resolve({ a: 10, c: false }),
);

collection.create_container().then((sc) => {
  const ts = sc.get(test_svc);
  console.debug(ts?.do_something()); // done with a=10, b=hello, c=false

  // options are immutable
  try {
    ts!.option.a = 100;
  } catch (e) {
    console.debug(e); // TypeError: Cannot assign to read only property 'a' of...
  }
});
```

## Documentation

#### * ioc_collection_t

represents an inversion of control collection which is the default returned from `'@lytical/ioc/collection'`

`import collection from '@lytical/ioc/collection'`


utilize it to configure services; options and to initialize the container.
loaded node modules containing injectables will register services into the collection automatically.
all registrations; node modules and their dependencies, containing injectables, should be loaded before creating the container.
manually register services, and import modules containing injectables to ensure they are registered.

| method | description |
| --- | --- |
| configure_option | configure an option for a type |
| create_container | initialize and get the ioc container. call this method after all services are registered. this can be called just before listening for requests in a server application, or in a start hook in an azure function application |
| has | check if a type is registered in the collection |
| set | register a service factory for a type |
| set_func | register a service function. the container will return the function instead of invoking it |

#### * ioc_container_t

represents an inversion of control container which is the default returned from `'@lytical/ioc'`

`import container from '@lytical/ioc'`

utilize to retrieve service and 'option' instances.

| method | description |
| --- | --- |
| get | get a service from the container |
| get_or_create | get a service from the container or create an instance of the provided type |
| has | check if a service is registered in the container |
| require | get the required specified services. an assert exception is throw if the service is not registered |

#### * @ioc_injectable(arg?)

decorates a class as an injectable service

```typescript
@ioc_injectable()
export class test_svc {}
```

a delegate function can be specified as an argument (delegate(svc: container): unknown|[[unknown]]) to implement a factory pattern.\
this delegate will be invoked when the service instance is requested.\
if a delegate function returns an array, within an array, containing a single element ([[unknown]]),\
this element will replace the delegate as the service instance or type.\
this allows for lazy evaluation of the service instance or type, and is the only case where the container is mutated.

#### * @ioc_inject(type)

decorates a class method argument, indicating the type of service to inject.

```typescript
class my_class {

  constructor(@ioc_inject(logger_svc) private readonly _log?: logger_svc) {}

  my_method(@ioc_inject(test_svc) svc: test_svc) {}

}
```

#### * ioc_create_instance(type, ...args)

create an instance of the specified class, by injecting dependencies obtained from the ioc container.\
optional arguments may be provided to append to the constructor arguments.

```typescript
const svc = ioc_create_instance(my_class);
```

#### * ioc_get_method_args(type_or_instance, method_name)

returns the an array of method arguments, by obtaining dependencies obtained from the ioc container.

```typescript
const svc = ioc_get_method_args(my_class, 'do_something');
```

#### * ioc_invoke_method(method, type_or_instance, ...args)

invoke the specified class method, by injecting dependencies obtained from the ioc container.\
optional arguments may be provided to append to the method arguments.

```typescript
const cls = new my_class();
const result = ioc_invoke_method(cls.do_something, cls);
```


Stay tuned! I have more packages to come.`

_lytical(r) is a registered trademark of lytical, inc. all rights are reserved._
