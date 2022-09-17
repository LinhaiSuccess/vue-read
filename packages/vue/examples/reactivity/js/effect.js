/*
 * File: /packages/vue/examples/reactivity/js/effect.js
 * Project: vue-read
 * Created Date: 2022-09-17
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: effect测试
 */

import { effect, reactive } from '../../../../reactivity/dist/reactivity.esmodule.js';

export default () => {
  // 依赖收集测试
  trackEffect();
}

// 依赖收集测试
function trackEffect() {
  const state = reactive({ name: '小明', age: 20 });
  // 下面使用了 name 和 age，这两个属性会被依赖收集
  effect(() => {
    app.innerHTML = `姓名：${state.name}，年龄：${state.age}`
  });
}