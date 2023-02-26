/*
 * File: /src/transforms/vShow.ts
 * Project: @vue/compiler-dom
 * Created Date: 2023-02-26
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: v-show 指令转换
 */

import { V_SHOW } from "../runtimeHelpers"

export const transformShow = (dir, node, context) => {
  // 给上下文添加 V_SHOW 方法
  return {
    props: [],
    needRuntime: context.helper(V_SHOW)
  }
}