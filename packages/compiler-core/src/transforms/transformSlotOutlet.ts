/*
 * File: /src/transforms/transformSlotOutlet.ts
 * Project: @vue/compiler-core
 * Created Date: 2023-02-26
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 转换插槽坐
 */

import { camelize } from "@vue/shared";
import { createCallExpression, createFunctionExpression, NodeTypes } from "../ast";
import { RENDER_SLOT } from "../runtimeHelpers";
import { isSlotOutlet, isStaticArgOf, isStaticExp } from "../utils";
import { buildProps } from "./transformElement";

export const transformSlotOutlet = (node, context) => {
  if (!isSlotOutlet(node)) {
    return;
  }

  const { children, loc } = node;
  // 执行插槽坐处理，获取插槽名称和属性
  const { slotName, slotProps } = processSlotOutlet(node, context);
  // 插槽属性
  const slotArgs = ['$slots', slotName, '{}', 'undefined', 'true'];
  let expectedLen = 2;

  if (slotProps) {
    // 有属性，替换为插槽属性
    slotArgs[2] = slotProps;
    // 预期长度为3
    expectedLen = 3;
  }
  if (children.length) {
    // 有孩子，创建函数表达式
    slotArgs[3] = (createFunctionExpression([], children, false, false) as any);
    expectedLen = 4;
  }
  // 删除未使用的参数
  slotArgs.splice(expectedLen);
  // 生成代码
  node.codegenNode = createCallExpression(context.helper(RENDER_SLOT), slotArgs, loc);
}

// 执行插槽坐
export const processSlotOutlet = (node, context) => {
  let slotName = `"default"`;
  let slotProps;

  // 非name属性列表
  const nonNameProps = [];
  for (let i = 0; i < node.props.length; i++) {
    const p = node.props[i];
    if (p.type === NodeTypes.ATTRIBUTE) {
      // 节点类型为属性
      if (p.value) {
        if (p.name === 'name') {
          // 属性名为name，则将 value 的内容变成JSON
          // p.value.conten 就是 <slot> 标签的name的值
          slotName = JSON.stringify(p.value.content)
        } else {
          // 将名称转为驼峰
          p.name = camelize(p.name);
          // 添加到列表
          nonNameProps.push(p);
        }
      }
    } else {
      // 如果为 bind，而且属性名就叫name，则将插槽名改为节点的表达式
      if (p.name === 'bind' && isStaticArgOf(p.arg, 'name')) {
        if (p.exp) {
          // 绑定的变量节点赋值给slotName
          slotName = p.exp;
        }
      } else {
        // 如果为 bind，而且参数是静态表达式，则将参数内容转换为驼峰给属性内容
        if (p.name === 'bind' && p.arg && isStaticExp(p.arg)) {
          p.arg.content = camelize(p.arg.content);
        }
        // 添加到列表
        nonNameProps.push(p)
      }
    }
  }

  // 如果非name属性列表有值，则构建属性
  if (nonNameProps.length > 0) {
    const { props } = buildProps(node, context, nonNameProps, false);
    slotProps = props;
  }

  return {
    slotName,
    slotProps
  }
}
