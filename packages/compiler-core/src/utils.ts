/*
 * File: /src/utils.ts
 * Project: @vue/compiler-core
 * Created Date: 2023-02-11
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 编译工具集
 */

import { hyphenate, isString } from "@vue/shared";
import { ElementTypes, NodeTypes } from "./ast";
import { CREATE_BLOCK, CREATE_ELEMENT_BLOCK, CREATE_ELEMENT_VNODE, CREATE_VNODE, KEEP_ALIVE, OPEN_BLOCK, TELEPORT } from "./runtimeHelpers";

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
// 是否插槽（插槽指令）
export const isVSlot = node => node.type === NodeTypes.DIRECTIVE && node.name === 'slot';
// 是否插槽坐（slot标签）
export const isSlotOutlet = node => node.type === NodeTypes.ELEMENT && node.tagType === ElementTypes.SLOT;
// 块化
export const makeBlock = (node, { helper, removeHelper }) => {
  if (!node.isBlock) {
    // 不是 block 则变成 block
    node.isBlock = true;
    removeHelper(node.isComponent ? CREATE_VNODE : CREATE_ELEMENT_VNODE);
    helper(OPEN_BLOCK);
    helper(node.isComponent ? CREATE_BLOCK : CREATE_ELEMENT_BLOCK);
  }
}
// 是否静态表达式
export const isStaticExp = p => p.type === NodeTypes.SIMPLE_EXPRESSION && p.isStatic;
// 是否文本节点
export const isText = node => node.type === NodeTypes.INTERPOLATION || node.type === NodeTypes.TEXT;
// 是否模板节点
export const isTemplateNode = node => node.type === NodeTypes.ELEMENT && node.tagType === ElementTypes.TEMPLATE;
// 是否静态参数
export const isStaticArgOf = (arg, name) => !!(arg && isStaticExp(arg) && arg.content === name);
// 查找指令
export const findDir = (node, name, allowEmpty = false) => {
  // 遍历节点所有属性
  for (let i = 0; i < node.props.length; i++) {
    const p = node.props[i];
    if (
      // 如果类型是指令 而且 指令中存在表达式
      p.type === NodeTypes.DIRECTIVE && (allowEmpty || p.exp) &&
      // 而且指令的名称和要查找的名称一样
      (isString(name) ? p.name === name : name.test(p.name))
    ) {
      // 返回找到的指令
      return p
    }
  }
}
// 查找属性
export const findProp = (node, name, dynamicOnly = false) => {
  // 遍历全部属性
  for (let i = 0; i < node.props.length; i++) {
    const p = node.props[i];
    if (p.type === NodeTypes.ATTRIBUTE) {
      if (dynamicOnly) {
        // 如果要寻找的是动态属性，则不查找，继续下一个循环
        continue;
      }
      if (p.name === name && p.value) {
        // 属性名称一直，并且有值，返回
        return p;
      }
    } else if (p.name === 'bind' && p.exp && isStaticArgOf(p.arg, name)) {
      // 如果是 bind 并且 属性有表达式 并且 是静态参数，返回找到后的
      return p;
    }
  }
}
// 判断是否简单标识符
const nonIdentifierRE = /^\d|[^\$\w]/;
export const isSimpleIdentifier = name => !nonIdentifierRE.test(name);