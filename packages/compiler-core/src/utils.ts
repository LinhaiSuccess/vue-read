/*
 * File: /src/utils.ts
 * Project: @vue/compiler-core
 * Created Date: 2023-02-11
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 编译工具集
 */

import { hyphenate } from "@vue/shared";
import { KEEP_ALIVE, TELEPORT } from "./runtimeHelpers";

// 是否内置类型
export const isBuiltInType = (tag, expected) => tag === expected || tag === hyphenate(expected);

// 是否核心组件
export const isCoreComponent = tag => {
  if (isBuiltInType(tag, 'Teleport')) {
    return TELEPORT;
  } else if (isBuiltInType(tag, 'KeepAlive')) {
    return KEEP_ALIVE;
  }
}

