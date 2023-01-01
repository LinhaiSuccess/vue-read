/*******************************************************************************
 * File: /packages/vue/examples/runtime-dom/js/asyncComponentRender.js
 * Project: vue-read
 * Created Date: 2023-01-01
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 异步组件渲染测试
*******************************************************************************/

import { defineAsyncComponent, h, render } from '../../../../runtime-dom/dist/runtime-dom.esmodule.js';

export default () => {
  test();
}

// 测试
function test() {
  // 加载中组件
  const LoadingComponent = {
    render() {
      return h('h1', 'loading...');
    }
  };
  // 实际用户组件
  const VueComponent = {
    render() {
      return h('h1', 'helloworld');
    }
  };
  // 异步加载超时后渲染的组件
  const ErrorComponment = {
    render() {
      return h('h2', { style: { color: 'red' } }, '加载出错');
    }
  };

  // 定义异步组件
  const AsyncComponent = defineAsyncComponent({
    loader: () => {
      return new Promise(resolve => {
        // 1秒后返回 VueComponent 组件
        setTimeout(() => {
          resolve(VueComponent);
        }, 2000);
      });
    },
    delay: 100, // 如果100毫秒还没加载出组件，就显示 loadingComponent 组件
    timeout: 1100,  // 如果 1100 毫秒还没加载出组件，就显示 errorComponent 组件
    loadingComponent: LoadingComponent,
    errorComponent: ErrorComponment,
    onError(error, retry, fail, retries) {
      // 当 loader 中 Promise.reject 时会进入这里
      console.log('组件加载失败，重试', retries);
      console.log('error', error);
      console.log('fail', fail);
      // 1秒再次重试
      setTimeout(retry, 1000);
    }
  });

  // 渲染异步组件
  render(h(AsyncComponent), app);
}