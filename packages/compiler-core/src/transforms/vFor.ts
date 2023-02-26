/*
 * File: /src/transforms/vFor.ts
 * Project: @vue/compiler-core
 * Created Date: 2023-02-26
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 转换 v-for 指令
 */

import { PatchFlags } from "@vue/shared";
import { ConstantTypes, createCallExpression, createFunctionExpression, createVNodeCall, NodeTypes } from "../ast";
import { CREATE_BLOCK, CREATE_ELEMENT_BLOCK, CREATE_ELEMENT_VNODE, CREATE_VNODE, FRAGMENT, OPEN_BLOCK, RENDER_LIST } from "../runtimeHelpers";
import { createStructuralDirectiveTransform } from "../transform";
import { findProp, isTemplateNode } from "../utils";
import { createSimpleExpression } from './../ast';

export const transformFor = createStructuralDirectiveTransform('for', (node, dir, context) => {
  const { helper, removeHelper } = context;

  return processFor(node, dir, context, forNode => {
    // 这里的 node 参数是使用 v-for 指令的父节点，比如 node 可能是 ul
    // 创建调用表达式（这里的方法名就是 renderList ）
    const renderExp = createCallExpression(helper(RENDER_LIST), [forNode.source]);
    // 是否稳定片段（在 v-for 中表达式只要不是常量，就是不稳定因素）
    const isStableFragment = forNode.source.type === NodeTypes.SIMPLE_EXPRESSION && forNode.source.constType > ConstantTypes.NOT_CONSTANT;
    // 取出key属性
    const keyProp = findProp(node, `key`);

    // 如果是稳定序列，则使用稳定序列标识
    // 如果是不稳定序列，则查看是否有 key 属性
    const fragmentFlag = isStableFragment ? PatchFlags.STABLE_FRAGMENT : keyProp ? PatchFlags.KEYED_FRAGMENT : PatchFlags.UNKEYED_FRAGMENT;
    // 为for节点生成节点
    forNode.codegenNode = createVNodeCall(
      context,
      helper(FRAGMENT),   // tag
      undefined,          // props
      renderExp,          // 子节点
      fragmentFlag,       // PatchFlags标识
      undefined,          // dynamicProps（动态属性）
      undefined,          // directives（指令）
      true,               // 是否Block
      !isStableFragment,  // disableTracking（如果是稳定片段，则不收集动态节点，否则就收集）
      false,              // 是否组件
    );

    // 返回退出函数，生成代码
    return () => {
      let childBlock;
      // 取出子节点（这里的子节点就是有 v-for 指令的节点）
      const { children } = forNode;
      // 看是否需要使用 Fragment 包装（如果有多个子节点，或不是 Element 元素节点，则需要包装）
      const needFragmentWrapper = children.length !== 1 || children[0].type !== NodeTypes.ELEMENT;
      if (needFragmentWrapper) {
        // 有多个元素，在 renderList 函数回调中再创建一个 FRAGMENT 包一层
        childBlock = createVNodeCall(
          context,
          helper(FRAGMENT),           // tag
          undefined,                  // props
          node.children,              // 子节点，比如这里可能是 多个li
          PatchFlags.STABLE_FRAGMENT, // 稳定序列
          undefined,                  // dynamicProps（动态属性）
          undefined,                  // directives（指令）
          true,                       // 是否Block
          undefined,                  // disableTracking（是否禁用收集动态节点）
          false                       // 是否组件
        )
      } else {
        // 正常的 v-for，直接使用子节点的 codegenNode（这个 childBlock 是 ul）
        childBlock = children[0].codegenNode;
        if (childBlock.isBlock !== !isStableFragment) {
          if (childBlock.isBlock) {
            // 这里不需要再打开一个 block 了，也不需要创建 block 节点，使用虚拟节点即可，我们变成 vnode 节点
            removeHelper(OPEN_BLOCK);
            removeHelper(childBlock.isComponent ? CREATE_BLOCK : CREATE_ELEMENT_BLOCK);
          } else {
            // 这里需要将 block 变成 block节点
            removeHelper(childBlock.isComponent ? CREATE_VNODE : CREATE_ELEMENT_VNODE);
          }
        }
        // 修改标识
        childBlock.isBlock = !isStableFragment;
        // 根据 是否block标识 决定使用哪个方法
        if (childBlock.isBlock) {
          helper(OPEN_BLOCK);
          helper(childBlock.isComponent ? CREATE_BLOCK : CREATE_ELEMENT_BLOCK);
        } else {
          helper(childBlock.isComponent ? CREATE_VNODE : CREATE_ELEMENT_VNODE);
        }
      }
      // 将该函数表达式添加到 renderList 函数参数中
      renderExp.arguments.push(createFunctionExpression(createForLoopParams(forNode.parseResult), childBlock, true));
    }
  })
});

// 执行 for
export const processFor = (node, dir, context, processCodegen?) => {
  if (!dir.exp) {
    return;
  }
  // 解析v-for表达式
  const parseResult = parseForExpression(dir.exp);
  if (!parseResult) {
    return;
  }

  const { source, value } = parseResult;
  // for的节点
  const forNode = {
    type: NodeTypes.FOR,
    source,
    valueAlias: value,
    parseResult,
    children: isTemplateNode(node) ? node.children : [node],
    loc: dir.loc
  }
  // 替换原来的节点
  context.replaceNode(forNode)
  // 执行代码生成，拿到退出函数
  const onExit = processCodegen && processCodegen(forNode);
  // 返回匿名函数，函数内执行退出函数
  return () => {
    if (onExit) {
      onExit();
    }
  }
}

// 匹配空白符和非空白符，中间为 in 或 of ，后面同样也是空白符和非空白符，这就是 v-for 的语法
const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
// 解析 for 表达式
export const parseForExpression = (input) => {
  const exp = input.content;
  // 匹配
  const inMatch = exp.match(forAliasRE);
  if (!inMatch) {
    // 没有匹配到，直接返回
    return;
  }

  // 取出循环项和数据集（比如：LHS = item、RHS = list）
  const [, LHS, RHS] = inMatch;
  // 创建返回对象
  const result = {
    source: createAliasExpression(RHS.trim()),
    value: undefined,
    key: undefined,
    index: undefined
  }
  // 获取去掉前后空格后的偏移
  const valueContent = LHS.trim();

  if (valueContent) {
    // 创建别名表达式给value属性
    result.value = createAliasExpression(valueContent);
  }
  return result;
}

// 创建for循环参数
export const createForLoopParams = ({ value, key, index }, memoArgs = []) => createParamsList([value, key, index, ...memoArgs]);

// 创建别名表达式
const createAliasExpression = content => createSimpleExpression(content, false);

// 创建参数列表
const createParamsList = args => {
  let i = args.length;
  // 倒序循环参数，过滤掉后面没有值的参数
  while (i--) {
    if (args[i]) {
      break;
    }
  }
  // 将列表剩余有参数的值取出，遍历，如果参数有值则直接使用，没有则创建简单表达式，值为 n个 _
  return args.slice(0, i + 1).map((arg, i) => arg || createSimpleExpression(`_`.repeat(i + 1), false));
}
