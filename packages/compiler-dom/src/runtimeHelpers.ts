/*
 * File: /src/runtimeHelpers.ts
 * Project: @vue/compiler-dom
 * Created Date: 2023-02-26
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 运行时助手
 */

import { registerRuntimeHelpers } from "@vue/compiler-core";

export const V_SHOW = Symbol('vShow');
export const V_MODEL_TEXT = Symbol('vModelText');
export const V_MODEL_DYNAMIC = Symbol('vModelDynamic');

// 添加到 compiler-core 中去
registerRuntimeHelpers({
  [V_SHOW]: 'vShow',
  [V_MODEL_TEXT]: 'vModelText',
  [V_MODEL_DYNAMIC]: 'vModelDynamic',
});
