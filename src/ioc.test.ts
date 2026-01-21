/* @preserve
  (c) 2022 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import { expect } from 'chai';
import { describe } from 'mocha';

import { ioc_injectable, ioc_inject, ioc_invoke_method } from './index.js';
import collection from './collection.js';

describe('an ioc collection', () => {
  it('can save options and a container can get the aggregated options.', async () => {
    collection.configure_option(test_opt, { a: 1 });
    collection.configure_option(test_opt, () => ({ b: 2 }));
    collection.configure_option(test_opt, () => Promise.resolve({ c: 3 }));
    collection.configure_option(test_opt, { b: 4 });
    const svc = await collection.create_container();
    expect(svc).exist;
    expect(svc.has(test_opt)).true;
    let opt = svc.get(test_opt)!;
    expect(opt).exist;
    expect(opt.a).eq(1);
    expect(opt.b).eq(4);
    expect(opt.c).eq(3);
    expect(()=> opt.c = 5).throw(TypeError);
    opt = svc.get(test_opt)!;
    expect(opt).exist;
    expect(opt.a).eq(1);
    expect(opt.b).eq(4);
    expect(opt.c).eq(3);
  });

  it('can create an instance of a class with injected services.', async () => {
    const sc = await collection.create_container();
    expect(sc).exist;
    expect(sc.has(test_svc)).true;
    expect(sc.has(use_svc)).false;
    const cls = new use_svc();
    const rs = ioc_invoke_method(cls.do_it, cls, ' again');
    expect(rs).eq('done again');
    const svc = sc.get(test_svc);
    expect(svc).exist;
    const rs2 = svc?.do_something();
    expect(rs2).eq('done');
  });
});

class test_opt {
  a?: number;
  b?: number;
  c?: number;
}

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
}
