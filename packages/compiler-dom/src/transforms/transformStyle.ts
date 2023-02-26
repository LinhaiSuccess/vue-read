/*
 * File: /src/transforms/transformStyle.ts
 * Project: @vue/compiler-dom
 * Created Date: 2023-02-26
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 样式转换
 * Description: 将写死的CSS字符串内联样式转换为对象
 */

import { parseStringStyle } from "@vue/shared";
import { ConstantTypes, createSimpleExpression, NodeTypes } from "..";

// 样式转换
export const transformStyle = node => {
  if (node.type === NodeTypes.ELEMENT) {
    // 遍历循环属性
    node.props.forEach((p, i) => {
      // 如果类型为属性，并且属性名称为 style 且 值不为空，则进行替换
      if (p.type === NodeTypes.ATTRIBUTE && p.name === 'style' && p.value) {
        // 将属性替换为表达式节点
        node.props[i] = {
          type: NodeTypes.DIRECTIVE,
          name: 'bind',
          arg: createSimpleExpression('style', true, p.loc),
          exp: parseInlineCSS(p.value.content),
          loc: p.loc
        };
      }
    });
  }
}

// 解析内联CSS
const parseInlineCSS = cssText => {
  // 解析字符串样式，获取对象化的样式
  const normalized = parseStringStyle(cssText);
  // 返回简单表达式
  return createSimpleExpression(JSON.stringify(normalized), false, ConstantTypes.CAN_STRINGIFY);
}
