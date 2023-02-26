/*
 * File: /src/transforms/transformExpression.ts
 * Project: @vue/compiler-core
 * Created Date: 2023-02-26
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 转化表达式
 */

import { NodeTypes } from "../ast";

export const transformExpression = (node) => {
  // 将 {{name}} 变成 _ctx.name 即可
  if (node.type === NodeTypes.INTERPOLATION) {
    // 是表达式，转换
    const { content } = node.content;
    node.content.content = `_ctx.${content}`;
  }
}