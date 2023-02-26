/*
 * File: /src/runtimeHelpers.ts
 * Project: @vue/compiler-core
 * Created Date: 2023-02-11
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 运行时助手
 */

export const FRAGMENT = Symbol('Fragment');
export const TELEPORT = Symbol('Teleport');
export const KEEP_ALIVE = Symbol('KeepAlive');
export const OPEN_BLOCK = Symbol('openBlock');
export const RENDER_LIST = Symbol('renderList');
export const RENDER_SLOT = Symbol('renderSlot');
export const CREATE_BLOCK = Symbol('createBlock');
export const CREATE_VNODE = Symbol('createVNode');
export const CREATE_TEXT = Symbol('createTextVNode');
export const NORMALIZE_CLASS = Symbol('normalizeClass');
export const NORMALIZE_STYLE = Symbol('normalizeStyle');
export const NORMALIZE_PROPS = Symbol('normalizeProps');
export const WITH_DIRECTIVES = Symbol('withDirectives');
export const TO_DISPLAY_STRING = Symbol('toDisplayString');
export const RESOLVE_COMPONENT = Symbol('resolveComponent');
export const CREATE_ELEMENT_VNODE = Symbol('createElementVNode');
export const CREATE_ELEMENT_BLOCK = Symbol('createElementBlock');

// 从这里拿到所需的方法等
export const helperNameMap = {
  [FRAGMENT]: 'Fragment',
  [TELEPORT]: 'Teleport',
  [KEEP_ALIVE]: 'KeepAlive',
  [OPEN_BLOCK]: 'openBlock',
  [RENDER_LIST]: 'renderList',
  [RENDER_SLOT]: 'renderSlot',
  [CREATE_BLOCK]: 'createBlock',
  [CREATE_VNODE]: 'createVNode',
  [CREATE_TEXT]: 'createTextVNode',
  [WITH_DIRECTIVES]: 'withDirectives',
  [NORMALIZE_CLASS]: 'normalizeClass',
  [NORMALIZE_STYLE]: 'normalizeStyle',
  [NORMALIZE_PROPS]: 'normalizeProps',
  [TO_DISPLAY_STRING]: 'toDisplayString',
  [RESOLVE_COMPONENT]: 'resolveComponent',
  [CREATE_ELEMENT_VNODE]: 'createElementVNode',
  [CREATE_ELEMENT_BLOCK]: 'createElementBlock'
};

// 暴露出这个函数，让 compiler-dom 中的 helpers 可以添加进来
export const registerRuntimeHelpers = helpers => {
  // 将所有属性添加到 helperNameMap 中
  Object.getOwnPropertySymbols(helpers).forEach(s => helperNameMap[s] = helpers[s]);
}