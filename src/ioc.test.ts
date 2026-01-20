/* @preserve
  (c) 2022 lytical, inc. all rights are reserved.
  lytical(r) is a registered trademark of lytical, inc.
  please refer to your license agreement on the use of this file.
*/

import { expect } from 'chai';
import { describe } from 'mocha';

import sc from './collection.js';

describe('an ioc collection', () => {
  it('can save options and a container can get the aggregated options.', async () => {
    sc.configure_option<test_opt>(test_opt, { a: 1 });
    sc.configure_option<test_opt>(test_opt, () => ({ b: 2 }));
    sc.configure_option<test_opt>(test_opt, () => Promise.resolve({ c: 3 }));
    sc.configure_option<test_opt>(test_opt, { b: 4 });
    const svc = await sc.create_container();
    expect(svc).exist;
    let opt = svc.get(test_opt)!;
    expect(opt).exist;
    expect(opt.a).eq(1);
    expect(opt.b).eq(4);
    expect(opt.c).eq(3);
    opt.c = 5;
    opt = svc.get(test_opt)!;
    expect(opt).exist;
    expect(opt.a).eq(1);
    expect(opt.b).eq(4);
    expect(opt.c).eq(3);
  });
});

class test_opt {
  a?: number;
  b?: number;
  c?: number;
}
