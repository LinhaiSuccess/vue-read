/*
 * File: /src/index.ts
 * Project: @vue/reactivity
 * Created Date: 2022-09-15
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 响应式模块
 */

export { computed } from './computed';
export { activeEffect, effect, ReactiveEffect } from './effect';
export { effectScope } from './effectScope';
export { isReadonly, reactive, readonly, shallowReactive, shallowReadonly, toRaw } from './reactive';
export { proxyRefs, ref, shallowRef, toRefs } from './ref';
