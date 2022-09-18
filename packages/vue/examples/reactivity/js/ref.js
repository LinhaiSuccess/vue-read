/*
 * File: /packages/vue/examples/reactivity/js/ref.js
 * Project: vue-read
 * Created Date: 2022-09-17
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: ref响应式测试
 */

import { effect, proxyRefs, reactive, ref, shallowRef, toRefs } from '../../../../reactivity/dist/reactivity.esmodule.js';

export default () => {
  proxyRefsTest();
}

// ref测试
function refTest() {
  const f1 = ref(100);
  // 打印100
  console.log(f1.value);

  const f2 = ref({ name: '小明' });
  // 打印 Proxy 对象
  console.log(f2.value);

  effect(() => {
    app.innerHTML = `${f2.value.name}考了 ${f1.value} 分`;
  });

  // 1秒后，更新f1并重新渲染
  setTimeout(() => {
    f1.value = 200;
  }, 1000);

  // 2秒后，更新f2并重新渲染
  setTimeout(() => {
    f2.value.name = '小刚';
  }, 2000);
}

// 浅ref测试
function shallowRefTest() {
  const f1 = shallowRef(100);
  // 打印100
  console.log(f1.value);

  const f2 = shallowRef({ name: '小明' });
  // 打印 f2 普通对象
  console.log(f2.value);

  effect(() => {
    app.innerHTML = `${f2.value.name}考了 ${f1.value} 分`;
  });

  // 1秒后，更新f1并重新渲染
  setTimeout(() => {
    f1.value = 200;
  }, 1000);

  // 2秒后，更新f2 不会渲染视图（因为浅ref只会代理 value）
  setTimeout(() => {
    f2.value.name = '小刚';
  }, 2000);
}

// toRefs测试
function toRefsTest() {
  const state = reactive({ name: '小明', age: 20 });

  effect(() => {
    app.innerHTML = `姓名：${state.name}，年龄：${state.age}`
  });

  const refs = toRefs(state);
  console.log(refs);

  setTimeout(() => {
    refs.name.value = '小刚';
  }, 1000);
}

// 脱refs测试
function proxyRefsTest() {
  const state = { name: ref('小明') };

  console.log('name.value: ', state.name.value);

  const unrefState = proxyRefs(state);

  console.log('name: ', unrefState.name);
}