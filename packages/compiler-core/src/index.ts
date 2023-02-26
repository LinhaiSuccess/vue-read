/*
 * File: /src/index.ts
 * Project: @vue/compiler-core
 * Created Date: 2023-02-11
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: Vue跨平台核心编译器
 */

export * from './ast';
export { baseCompile, getBaseTransformPreset } from './compile';
export { baseParse } from './parse';
export * from './runtimeHelpers';
export * from './transform';
export { buildProps, transformElement } from './transforms/transformElement';
export { transformExpression } from './transforms/transformExpression';
export { transformSlotOutlet } from './transforms/transformSlotOutlet';
export { transformText } from './transforms/transformText';
export { transformBind } from './transforms/vBind';
export { transformFor } from './transforms/vFor';
export { transformIf } from './transforms/vIf';
export { transformModel } from './transforms/vModel';
export { transformOn } from './transforms/vOn';
export { buildSlots } from './transforms/vSlot';
export * from './utils';
