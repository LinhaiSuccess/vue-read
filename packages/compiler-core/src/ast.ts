/*
 * File: /src/ast.ts
 * Project: @vue/compiler-core
 * Created Date: 2023-02-11
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 抽象语法树
 */

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