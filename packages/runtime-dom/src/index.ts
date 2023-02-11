/*
 * File: /src/index.ts
 * Project: @vue/runtime-dom
 * Created Date: 2022-09-25
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: Vue浏览器DOM运行时
 */

import { createRenderer } from '@vue/runtime-core';
import { isFunction, isString } from '@vue/shared';
import { nodeOps } from './nodeOps';
import { patchProp } from './patchProp';

// 渲染选项（默认为浏览器DOM操作）
const renderOptions = Object.assign(nodeOps, { patchProp });;
// 渲染器
let renderer;

// 渲染器只创建一次
export const ensureRenderer = () => (renderer || (renderer = createRenderer(renderOptions)));
// 渲染函数
export const render = (vnode, container) => ensureRenderer().render(vnode, container);
// 正常化容器
const normalizeContainer = container => isString(container) ? document.querySelector(container) : container;

// 创建APP
export const createApp = rootComponent => {
  // 创建app
  const app = ensureRenderer().createApp(rootComponent);

  // 取出跨平台的挂载函数
  const { mount } = app;
  // 重写挂载函数（为浏览器订制）
  app.mount = containerOrSelector => {
    // 可能是字符串选择器，正常化一下
    const container = normalizeContainer(containerOrSelector);
    if (!container) {
      return;
    }
    // 拿到当前组件
    const component = app._component;
    // 如果组件不是函数式组件，并且组件也没有 render 函数，也没有 template 模板
    // 那就是用户将模板写在了容器标签内，我们就将DOM元素中的所有子孙标签字符串拿到放入组件 template 中
    if (!isFunction(component) && !component.render && !component.template) {
      component.template = container.innerHTML;
    }
    // 清空DOM对象容器内容
    container.innerHTML = '';
    // 执行跨平台挂载函数
    mount(container);
  }
  return app
}

// 导出运行时核心全部API
export * from '@vue/runtime-core';
export { vModelText } from './directives/vModel';

