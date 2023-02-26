/*
 * File: /src/transforms/vText.ts
 * Project: @vue/compiler-dom
 * Created Date: 2023-02-26
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: v-text 转换
 */

import { createCallExpression, createObjectProperty, createSimpleExpression, TO_DISPLAY_STRING } from "@vue/compiler-core";

export const transformVText = (dir, node, context) => {
  const { exp } = dir;
  // 返回对象属性数组
  return {
    props: [
      createObjectProperty(
        createSimpleExpression('textContent', true),
        exp ? createCallExpression(context.helperString(TO_DISPLAY_STRING), [exp]) : createSimpleExpression('', true)
      )
    ]
  }
}