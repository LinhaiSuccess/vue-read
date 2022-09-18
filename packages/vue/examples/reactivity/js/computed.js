/*******************************************************************************
 * File: /packages/vue/examples/reactivity/js/computed.js
 * Project: vue-read
 * Created Date: 2022-09-18
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 计算属性测试
*******************************************************************************/

import { computed, effect, reactive } from '../../../../reactivity/dist/reactivity.esmodule.js';

export default () => {
  computedSetTest();
}

// 计算属性get测试
function computedGetTest() {
  // 定义响应式变量
  const state = reactive({ firstName: '张', lastName: '三' });

  // 计算属性全名
  const fullName = computed(() => state.firstName + state.lastName);

  effect(() => {
    app.innerHTML = `我的名字：${fullName.value}`;
  });

  // 1秒后改名
  setTimeout(() => {
    state.lastName = '3';
  }, 1000);
}

// 计算属性set测试
function computedSetTest() {
  // 定义响应式变量
  const state = reactive({ firstName: '张', lastName: '三' });

  // 计算属性全名
  const fullName = computed({
    get() {
      return state.firstName + state.lastName;
    },
    set(value) {
      console.log('计算属性的新值为：', value);
    }
  });

  effect(() => {
    app.innerHTML = `我的名字：${fullName.value}`;
  });

  // 1秒后改名
  setTimeout(() => {
    state.lastName = '3';
  }, 1000);

  // 2秒后修改计算属性的值（会进入到计算属性set中）
  setTimeout(() => {
    fullName.value = '李四';
  }, 2000);
}