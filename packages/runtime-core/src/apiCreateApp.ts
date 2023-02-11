/*
 * File: /src/apiCreateApp.ts
 * Project: @vue/runtime-core
 * Created Date: 2023-02-11
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: app创建
 * Description: 用于挂载和卸载组件
 */

import { createVNode } from '@vue/runtime-dom';

// createApp 执行函数
export const createAppAPI = render => {
  return function createApp(rootComponent) {
    // 是否被挂载
    let isMounted = false;
    // 返回 app 对象
    const app = {
      _component: rootComponent,
      // 挂载函数
      mount(rootContainer) {
        if (!isMounted) {
          // 创建VNode
          const vnode = createVNode(rootComponent);
          // 执行渲染
          render(vnode, rootContainer);
          // 已挂载
          isMounted = true;
          // 将当前组件容器保存起来，卸载时会用到
          (app as any)._container = rootContainer;
        }
      },
      // 卸载函数
      unmount() {
        // 如果已挂载，则执行卸载
        if (isMounted) {
          // 渲染null时会通过容器拿到虚拟DOM并卸载
          render(null, (app as any)._container);
        }
      },
    }
    return app;
  }
}