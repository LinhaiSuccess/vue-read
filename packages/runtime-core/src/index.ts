/*
 * File: /src/index.ts
 * Project: @vue/runtime-core
 * Created Date: 2022-09-25
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 跨平台核心运行时
 */

export * from '@vue/reactivity';
export * from '@vue/shared';
export * from './apiAsyncComponent';
export * from './apiInject';
export * from './apiLifecycle';
export { traverse, watch } from './apiWatch';
export { getCurrentInstance, registerRuntimeCompiler } from './component';
export { KeepAlive } from './components/KeepAlive';
export { Teleport } from './components/Teleport';
export { invokeDirectiveHook, withDirectives } from './directives';
export { h } from './h';
export { renderList } from './helpers/renderList';
export { renderSlot } from './helpers/renderSlot';
export { resolveAsset, resolveComponent } from './helpers/resolveAssets';
export { createRenderer } from './renderer';
export * from './vnode';
