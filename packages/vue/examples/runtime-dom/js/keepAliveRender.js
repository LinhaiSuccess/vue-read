/*******************************************************************************
 * File: /packages/vue/examples/runtime-dom/js/keepAliveRender.js
 * Project: vue-read
 * Created Date: 2023-01-07
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: KeepAlive 组件渲染测试
*******************************************************************************/

import { h, KeepAlive, onMounted, render } from '../../../../runtime-dom/dist/runtime-dom.esmodule.js';

export default () => {
  // 测试
  test();
}

function test() {
  // 组件1
  const VueComponent1 = {
    name: 'c1',
    setup() {
      onMounted(() => {
        console.log('VueComponent1 - onMounted 执行');
      });
    },
    render() {
      return h('h1', { style: { color: 'red' } }, [
        'VueComponent1 - 内容渲染',
        h('input', { type: 'text' })
      ]);
    }
  }

  // 组件2
  const VueComponent2 = {
    name: 'c2',
    setup() {
      onMounted(() => {
        console.log('VueComponent2 - onMounted 执行');
      });
    },
    render() {
      return h('h2', { style: { color: 'blue' } }, [
        'VueComponent2 - 内容渲染',
        h('input', { type: 'text' })
      ]);
    }
  }

  // 渲染 KeepAlive 组件
  render(h(KeepAlive, { max: 3 }, {
    default: () => h(VueComponent1)
  }), app);

  // 2秒后渲染组件2
  setTimeout(() => {
    render(h(KeepAlive, { max: 3 }, {
      default: () => h(VueComponent2)
    }), app);
  }, 2000);

  // 再2秒后渲染组件1
  // 这时候组件1的 onMounted 不会再执行，因为被缓存了，再次渲染的是缓存后的组件（可以看文本框的输入内容是否被保留）
  setTimeout(() => {
    render(h(KeepAlive, { max: 3 }, {
      default: () => h(VueComponent1)
    }), app);
  }, 4000);
}