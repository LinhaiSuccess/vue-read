/*
 * File: /packages/vue/examples/reactivity/js/ref.js
 * Project: vue-read
 * Created Date: 2022-09-17
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: ref响应式测试
 */

import { effect, ref, shallowRef } from '../../../../reactivity/dist/reactivity.esmodule.js';

export default () => {
  shallowRefTest();
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