/*
 * File: /src/ast.ts
 * Project: @vue/compiler-core
 * Created Date: 2023-02-11
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 抽象语法树
 */

import { isNumber, isString } from "@vue/shared";
import { CREATE_BLOCK, CREATE_ELEMENT_BLOCK, CREATE_ELEMENT_VNODE, CREATE_VNODE, OPEN_BLOCK, WITH_DIRECTIVES } from "./runtimeHelpers";

// 语法树相关类型
export const enum NodeTypes {
  ROOT,                       // Fragment根节点
  ELEMENT,                    // 元素
  TEXT,                       // 文本
  COMMENT,                    // 注释
  SIMPLE_EXPRESSION,          // 简单表达式，如：_ctx.name 
  INTERPOLATION,              // 模板插值，如：{{name}}
  ATTRIBUTE,                  // 属性
  DIRECTIVE,                  // 指令
  COMPOUND_EXPRESSION,        // 复合表达式（模板插值 及 简单表达式）
  IF,                         // if判断
  IF_BRANCH,                  // if分支
  FOR,                        // for循环
  TEXT_CALL,                  // 文本调用
  VNODE_CALL,                 // 元素调用
  JS_CALL_EXPRESSION,         // 调用表达式
  JS_OBJECT_EXPRESSION,       // 对象表达式
  JS_PROPERTY,                // 属性
  JS_ARRAY_EXPRESSION,        // 数组表达式
  JS_FUNCTION_EXPRESSION,     // 函数表达式
  JS_CONDITIONAL_EXPRESSION,  // 条件表达式
};

// 常量类型
export const enum ConstantTypes {
  NOT_CONSTANT = 0,   // 非常量
  CAN_SKIP_PATCH,     // 可以跳过对比
  CAN_HOIST,          // 可以提升
  CAN_STRINGIFY       // 可以 stringify
}

// 元素类型
export const enum ElementTypes {
  ELEMENT,    // 元素
  COMPONENT,  // 组件
  SLOT,       // 插槽
  TEMPLATE    // 模板
}

// 创建根节点 Fragment
export const createRoot = (children, loc) => {
  return { type: NodeTypes.ROOT, children, loc };
}

// 创建虚拟节点调用
export const createVNodeCall = (context, vnodeTag, propsExpression?, children?, patchFlag?, dynamicProps?, directives?, isBlock = false, disableTracking = false, isComponent = false) => {
  if (context) {
    if (isBlock) {
      // 是 Block
      context.helper(OPEN_BLOCK);
      context.helper(isComponent ? CREATE_BLOCK : CREATE_ELEMENT_BLOCK);
    } else {
      context.helper(isComponent ? CREATE_VNODE : CREATE_ELEMENT_VNODE);
    }
    if (directives) {
      // 是指令
      context.helper(WITH_DIRECTIVES);
    }
  }
  // 如果是数值则转换为字符串
  if (isNumber(patchFlag)) {
    patchFlag = String(patchFlag);
  }
  return {
    type: NodeTypes.VNODE_CALL,
    tag: vnodeTag,
    props: propsExpression,
    children,
    patchFlag,
    dynamicProps,
    directives,
    isBlock,
    disableTracking,
    isComponent
  }
}

// 创建调用表达式
export const createCallExpression = (callee, args, loc?) => {
  return {
    callee,                             // 方法名
    type: NodeTypes.JS_CALL_EXPRESSION, // JS调用表达式
    arguments: args,                    // 参数
    loc
  }
}

// 创建对象表达式
export const createObjectExpression = properties => {
  return {
    type: NodeTypes.JS_OBJECT_EXPRESSION,
    properties
  }
}

// 创建简单表达式
export const createSimpleExpression = (content, isStatic = false, constType = ConstantTypes.NOT_CONSTANT) => {
  return {
    content,
    type: NodeTypes.SIMPLE_EXPRESSION,
    isStatic,
    constType: isStatic ? ConstantTypes.CAN_STRINGIFY : constType
  }
}

// 创建条件表达式
export const createConditionalExpression = (test, consequent, newline = true) => {
  return {
    type: NodeTypes.JS_CONDITIONAL_EXPRESSION,
    test,
    consequent,
    newline
  }
}

// 创建函数表达式
export const createFunctionExpression = (params, returns = undefined, newline = false, isSlot = false) => {
  return {
    type: NodeTypes.JS_FUNCTION_EXPRESSION,
    params,
    returns,
    newline,
    isSlot
  }
}

// 创建对象属性
export const createObjectProperty = (key, value) => {
  return {
    type: NodeTypes.JS_PROPERTY,
    key: isString(key) ? createSimpleExpression(key, true) : key,
    value
  }
}

// 创建复合表达式
export const createCompoundExpression = children => {
  return { type: NodeTypes.COMPOUND_EXPRESSION, children };
}

// 创建数组表达式
export const createArrayExpression = elements => {
  return { type: NodeTypes.JS_ARRAY_EXPRESSION, elements };
}
