/*
 * File: /src/transforms/vSlot.ts
 * Project: @vue/compiler-core
 * Created Date: 2023-02-26
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 构建插槽
 */

import { SlotFlags } from "@vue/shared";
import { createFunctionExpression, createObjectExpression, createObjectProperty, createSimpleExpression } from "../ast";
import { findDir, isTemplateNode } from "../utils";

export const buildSlots = (node, context, buildSlotFn = buildClientSlotFn) => {
  const { children } = node;
  const slotsProperties = [];
  let hasTemplateSlots = false;
  let hasNamedDefaultSlot = false;
  const seenSlotNames = new Set();

  // 遍历孩子，检查模板插槽
  for (let i = 0; i < children.length; i++) {
    const slotElement = children[i];
    let slotDir;

    // 如果该元素不是 template节点，或者没有 v-slot 指令，则跳过该节点 
    if (!isTemplateNode(slotElement) || !(slotDir = findDir(slotElement, 'slot', true))) {
      continue;
    }

    // 更改标识
    hasTemplateSlots = true;
    const { children: slotChildren } = slotElement;
    const { arg: slotName = createSimpleExpression('default', true), exp: slotProps } = slotDir;

    // 声明静态名称
    let staticSlotName = slotName ? slotName.content : `default`;
    // 插槽函数
    const slotFunction = buildSlotFn(slotProps, slotChildren);

    // 检查重复名称
    if (staticSlotName) {
      if (seenSlotNames.has(staticSlotName)) {
        // 已存在，继续下一个循环
        continue;
      }
      // 不存在，添加
      seenSlotNames.add(staticSlotName)
      if (staticSlotName === 'default') {
        // 插槽名为默认
        hasNamedDefaultSlot = true;
      }
    }
    slotsProperties.push(createObjectProperty(slotName, slotFunction));
  }

  // 构建默认插槽属性
  const buildDefaultSlotProperty = (props, children) => {
    // 构建插槽函数
    const fn = buildSlotFn(props, children);
    // 返回创建的默认属性函数
    return createObjectProperty(`default`, fn);
  }

  if (!hasTemplateSlots) {
    // 如果是在组件上的隐式默认的插槽，则构建默认插槽属性
    slotsProperties.push(buildDefaultSlotProperty(undefined, children))
  }
  const slotFlag = SlotFlags.STABLE;

  // 创建对象表达式
  const slots = createObjectExpression(
    slotsProperties.concat(createObjectProperty('_', createSimpleExpression(slotFlag, false)))
  );

  return { slots }
}

// 构建客户端插槽函数
const buildClientSlotFn = (props, children) => createFunctionExpression(props, children, false, true);

