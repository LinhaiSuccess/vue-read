/*
 * File: /src/index.ts
 * Project: @vue/runtime-core
 * Created Date: 2022-09-25
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 跨平台核心运行时
 */

export * from '@vue/reactivity';
export * from '@vue/shared';
export { traverse, watch } from './apiWatch';
export { h } from './h';
export { createRenderer } from './renderer';
export * from './vnode';
