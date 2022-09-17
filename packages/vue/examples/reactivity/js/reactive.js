/*******************************************************************************
 * File: /packages/vue/examples/reactivity/js/reactive.js
 * Project: vue-read
 * Created Date: 2022-09-15
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 响应式对象测试
*******************************************************************************/

import { reactive, readonly, toRaw } from '../../../../reactivity/dist/reactivity.esmodule.js';

export default () => {
  arrayReactiveTest();
}

// 响应式对象测试
function objectReactiveTest() {
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

// 响应式数组测试
function arrayReactiveTest() {
  // 源数组
  const arr = [{ name: '小明', age: 10 }, { name: '小刚', age: 12 }];
  // 定义响应式
  const state = reactive(arr);

  console.log('代理数组是否包含源数组 0号元素 = ', state.includes(arr[0]));
  console.log('代理数组是否包含代理数组 0号元素 = ', state.includes(state[0]));

  state.push(1);
  console.log(state);
}