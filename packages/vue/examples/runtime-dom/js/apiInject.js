/*******************************************************************************
 * File: /packages/vue/examples/runtime-dom/js/apiInject.js
 * Project: vue-read
 * Created Date: 2023-01-09
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 工艺实例API测试
*******************************************************************************/

import { h, inject, provide, reactive, render } from '../../../../runtime-dom/dist/runtime-dom.esmodule.js';

export default () => {
  // 测试
  test();
}

function test() {
  // 子组件
  const ChildrenComponent = {
    setup() {
      // 取出父组件传递的 parentState，并渲染
      const state = inject('parentState');
      return { state }
    },
    render() {
      return h('h1', `祖传数据： ${this.state.name}`);
    }
  }

  // 父组件
  const ParentComponent = {
    setup() {
      // 声明响应式对象
      const state = reactive({ name: 'hello vue3' })
      // 向子孙组件传递
      provide('parentState', state);
      // 1秒后改变数据
      setTimeout(() => state.name = '你好 Vue3', 1000);
    },
    render() {
      return h(ChildrenComponent);
    }
  };

  render(h(ParentComponent), app);
}