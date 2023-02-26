/*
 * File: /src/transforms/vIf.ts
 * Project: @vue/compiler-core
 * Created Date: 2023-02-26
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 转化 v-if
 */

import { PatchFlags } from "@vue/shared";
import { createConditionalExpression, createSimpleExpression, createVNodeCall, ElementTypes, NodeTypes } from "../ast";
import { FRAGMENT } from "../runtimeHelpers";
import { createStructuralDirectiveTransform, traverseNode } from "../transform";
import { findDir, findProp, makeBlock } from "../utils";

export const transformIf = createStructuralDirectiveTransform(/^(if|else|else-if)$/, (node, dir, context) => {
  // 执行if，并返回结果
  return processIf(node, dir, context, (ifNode, branch, isRoot) => {
    // 退出函数（完成所有子节点后，执行自己的代码生成）
    return () => isRoot ? ifNode.codegenNode = createCodegenNodeForBranch(branch, context) : ifNode.codegenNode.alternate = createCodegenNodeForBranch(branch, context);
  });
});

// 执行 if 指令
export const processIf = (node, dir, context, processCodegen?) => {
  if (dir.name !== 'else' && !dir.exp) {
    // 非else且无表达式则创建表达式
    dir.exp = createSimpleExpression('true');
  }

  if (dir.name === 'if') {
    // 创建if分支
    const branch = createIfBranch(node, dir);
    // 创建if节点
    const ifNode = {
      type: NodeTypes.IF,
      branches: [branch],
      loc: node.loc
    };
    // 将上下文中当前节点替换为 if 节点
    context.replaceNode(ifNode);
    if (processCodegen) {
      // 执行代码生成
      return processCodegen(ifNode, branch, true);
    }
  } else {    // else 或 if-else
    // 拿到所有兄弟节点
    const siblings = context.parent.children;
    // 取出当前节点所在的索引
    let i = siblings.indexOf(node);
    // 遍历当前节点之前所有节点
    while (i-- >= -1) {
      const sibling = siblings[i];
      if (sibling && sibling.type === NodeTypes.TEXT) {
        // 如果当前节点是文本节点，则移除当前节点
        context.removeNode(sibling)
        continue;
      }

      if (sibling && sibling.type === NodeTypes.IF) { // 找到了对应的 if
        // 移除当前 v-else 节点
        context.removeNode();
        // 创建 if 分支
        const branch = createIfBranch(node, dir);
        // 追加到子节点中
        sibling.branches.push(branch);
        // 执行代码生成，获取到退出函数
        const onExit = processCodegen && processCodegen(sibling, branch, false);
        // 因为原来的节点已经被移除，所以不会遍历到了，所以这里再遍历一下新节点
        traverseNode(branch, context);
        onExit && onExit();
        // 遍历后重置当前节点
        context.currentNode = null;
      }
      // 跳出循环
      break;
    }
  }
}

// 创建if分支
const createIfBranch = (node, dir) => {
  // 是否在 template 标签上的if
  const isTemplateIf = node.tagType === ElementTypes.TEMPLATE;
  return {
    type: NodeTypes.IF_BRANCH,
    condition: dir.name === 'else' ? undefined : dir.exp,
    children: isTemplateIf && !findDir(node, 'for') ? node.children : [node],
    userKey: findProp(node, 'key'),
    isTemplateIf,
    loc: node.loc
  }
}

// 创建分支代码生成节点
const createCodegenNodeForBranch = (branch, context) => {
  if (branch.condition) {
    // 存在条件，创建条件表达式
    return createConditionalExpression(branch.condition, createChildrenCodegenNode(branch, context));
  } else {
    // 创建子节点代码生成
    return createChildrenCodegenNode(branch, context);
  }
}

// 创建子节点代码生成
const createChildrenCodegenNode = (branch, context) => {
  const { helper } = context;
  const { children } = branch

  // 获取到第一个子节点
  const firstChild = children[0];
  // 看是否有多个子节点，是否需要通过 Fragment 包一层
  const needFragmentWrapper = children.length !== 1 || firstChild.type !== NodeTypes.ELEMENT;

  if (needFragmentWrapper) {
    // 稳定序列
    let patchFlag = PatchFlags.STABLE_FRAGMENT;
    // 生成node节点
    return createVNodeCall(
      context,
      helper(FRAGMENT), // tag
      undefined,        // props
      children,         // 子节点
      patchFlag,        // 对比标识
      undefined,        // dynamicProps（动态属性）
      undefined,        // directives（指令）
      true,             // 是否Block
      false,            // disableTracking（是否禁用收集动态节点）
      false,            // 是否组件
    )
  } else {
    const vnode = firstChild.codegenNode;
    if (vnode.type === NodeTypes.VNODE_CALL) {
      // 变成block
      makeBlock(vnode, context);
    }
    return vnode
  }
}