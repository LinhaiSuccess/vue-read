/*******************************************************************************
 * File: /examples/vue/js/compiler.js
 * Project: vue
 * Created Date: 2023-02-26
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 运行时编译测试
*******************************************************************************/

import { createApp, ref } from '../../../dist/vue.esmodule.js';

export default () => {
  // Vue模板标签在 index.html 文件中
  compilerTest();
}

// 编译测试
function compilerTest() {
  // 获取 Layout 组件
  const Layout = getLayout();
  // 获取 Diversity 组件
  const Diversity = getDiversity();
  // 获取 App 组件
  const App = getApp(Layout, Diversity);

  // 挂载
  createApp(App).mount(app);
}

function getApp(Layout, Diversity) {
  return {
    components: { Layout, Diversity },
    setup() {
      const tasks = [
        { id: 1, value: '学习' },
        { id: 2, value: '编码' },
        { id: 3, value: '睡觉' }
      ];
      const count = ref(1);
      const increment = num => count.value += num;
      const config = {};
      const activity = ref('空状态');
      const arrive = true;

      return {
        tasks,
        count,
        config,
        arrive,
        activity,
        increment
      }
    }
  }
}

function getLayout() {
  return {
    template: `
        <div class="layout-container">
          <div :style="{ border: '2px solid #666', textAlign: 'center' }"><slot name="top"></slot></div>
          <slot name="center"></slot>
          <slot name="bottom"></slot>
        </div>
    `
  }
}

function getDiversity() {
  return {
    props: {
      config: Object,
      callback: Function,
      activate: String
    },
    emits: ['update:activate'],
    setup(_, { emit }) {
      setInterval(() => emit('update:activate', String(Math.random())), 1000);
    },
    template: `
        <div class="diversity-container" style="font-size: 20px; color: red">
          <slot status="Diversity-Status-Value"></slot>
        </div>
    `
  }
}