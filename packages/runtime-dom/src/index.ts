/*
 * File: /src/index.ts
 * Project: @vue/runtime-dom
 * Created Date: 2022-09-25
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: Vue浏览器DOM运行时
 */

import { createRenderer } from '@vue/runtime-core';
import { nodeOps } from './nodeOps';

// 渲染选项（默认为浏览器DOM操作）
const renderOptions = nodeOps;
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
