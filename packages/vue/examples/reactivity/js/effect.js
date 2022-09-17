/*
 * File: /packages/vue/examples/reactivity/js/effect.js
 * Project: vue-read
 * Created Date: 2022-09-17
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: effect测试
 */

import { effect, reactive, readonly } from '../../../../reactivity/dist/reactivity.esmodule.js';

export default () => {
  // 触发更新测试
  triggerReadonly();
}

// reactive依赖收集测试
function trackReactive() {
  const state = reactive({ name: '小明', age: 20 });
  // 下面使用了 name 和 age，这两个属性会被依赖收集
  effect(() => {
    app.innerHTML = `姓名：${state.name}，年龄：${state.age}`
  });
}

// reactive触发更新测试
function triggerReactive() {
  const state = reactive({ name: '小明', age: 20 });
  // 下面使用了 name 和 age，这两个属性会被依赖收集
  effect(() => {
    app.innerHTML = `姓名：${state.name}，年龄：${state.age}`;
  });

  // 1秒后更新age，上面的effect应该会重新执行渲染
  setTimeout(() => {
    state.age++;
  }, 1000);

  // 2秒后删除age属性，上面的effect应该会重新执行渲染
  setTimeout(() => {
    delete state.age;
  }, 2000);
}

// readonly触发更新测试
function triggerReadonly() {
  // 只读测试
  const state = readonly({ name: '汽车' });
  effect(() => {
    app.innerHTML = `名称：${state.name}`;
  });

  // 1秒后更新name，控制台应该会发出警告
  setTimeout(() => {
    state.name = '飞机';
  }, 1000);
}