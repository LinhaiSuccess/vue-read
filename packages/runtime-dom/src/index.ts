/*
 * File: /src/index.ts
 * Project: @vue/runtime-dom
 * Created Date: 2022-09-25
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: Vue浏览器DOM运行时
 */

import { createRenderer } from '@vue/runtime-core';
import { nodeOps } from './nodeOps';
import { patchProp } from './patchProp';

// 渲染选项（默认为浏览器DOM操作）
const renderOptions = Object.assign(nodeOps, { patchProp });;
// 渲染器
let renderer;

// 渲染器只创建一次
export const ensureRenderer = () => {
  return (renderer || (renderer = createRenderer(renderOptions)))
}

// 渲染函数
export const render = (vnode, container) => {
  // 执行渲染
  ensureRenderer().render(vnode, container);
}

// 导出运行时核心全部API
export * from '@vue/runtime-core';
export { vModelText } from './directives/vModel';

