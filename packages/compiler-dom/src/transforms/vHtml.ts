/*
 * File: /src/transforms/vHtml.ts
 * Project: @vue/compiler-dom
 * Created Date: 2023-02-26
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: v-html 指令转换
 */

import { createObjectProperty, createSimpleExpression } from "@vue/compiler-core";

export const transformVHtml = (dir) => {
  const { exp, loc } = dir;
  // 返回对象属性数组
  return {
    props: [
      createObjectProperty(
        createSimpleExpression('innerHTML', true, loc),
        exp || createSimpleExpression('', true)
      )
    ]
  }
}