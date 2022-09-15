/*******************************************************************************
 * File: /packages/vue/examples/reactivity/js/reactive.js
 * Project: vue-read
 * Created Date: 2022-09-15
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 响应式对象测试
*******************************************************************************/

import { reactive, readonly, toRaw } from '../../../../reactivity/dist/reactivity.esmodule.js';

export default () => {
  const obj = { a: 1, b: 2 };

  const state = reactive(obj);
  console.log(state);

  const target = toRaw(state);
  console.log(target);

  const readState = readonly(obj);
  console.log(readState);

  // 多次代理测试
  console.log(reactive(state));
}