/*
 * File: /src/transforms/vOn.ts
 * Project: @vue/compiler-core
 * Created Date: 2023-02-26
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 转换 on 指令
 */

import { camelize, toHandlerKey } from "@vue/shared";
import { createCompoundExpression, createObjectProperty, createSimpleExpression, NodeTypes } from "../ast";

export const transformOn = dir => {
  const { loc, arg } = dir;
  let eventName;

  if (arg.type === NodeTypes.SIMPLE_EXPRESSION) {
    if (arg.isStatic) {
      // 是静态参数，取出事件名，如：click
      let rawName = arg.content;
      // 创建简单表达式（将事件名转换为驼峰，并添加 on 关键字）
      eventName = createSimpleExpression(toHandlerKey(camelize(rawName)), true, arg.loc);
    }
  }

  let exp = dir.exp;
  // 如果事件的值排除两边空格为空文本，则设置为 undefined
  if (exp && !exp.content.trim()) {
    exp = undefined;
  }
  const fnEx = /.*\(.*\).*/;
  // 如果表达式存在，并且包含括号则创建事件调用函数
  if (exp && fnEx.test(exp.content)) {
    exp = createCompoundExpression(['$event => (', exp, ')']);
  }

  // 创建返回
  const ret = {
    props: [
      createObjectProperty(
        eventName,
        exp || createSimpleExpression(`() => {}`, false, loc)
      )
    ]
  };

  // 全部属性的key都标记为处理key
  ret.props.forEach(p => (p.key.isHandlerKey = true));
  return ret;
}
