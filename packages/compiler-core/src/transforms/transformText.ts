/*
 * File: /src/transforms/transformText.ts
 * Project: @vue/compiler-core
 * Created Date: 2023-02-26
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 转化文本
 */

import { PatchFlags } from "@vue/shared";
import { createCallExpression, ElementTypes, NodeTypes } from "../ast";
import { CREATE_TEXT } from "../runtimeHelpers";
import { isText } from "../utils";

export const transformText = (node, context) => {
  // 如果当前节点是元素或root，或for或if分支 才返回后置函数
  if (node.type === NodeTypes.ELEMENT || node.type === NodeTypes.ROOT || node.type === NodeTypes.FOR || node.type === NodeTypes.IF_BRANCH) {
    // 后置函数
    return () => {
      // 这里需要做一个优化，就是将连续的 模板表达式节点 和 文本表达式节点 拼接在一起
      // 比如：<div>{{name}}欢迎回来</div>
      // 上面这个在 ast 中是两个节点，模板表达式节点（5）和 文本节点（2）
      // 这两个没必要创建两个虚拟节点，我们可以将他们合并在一起，变成一个 复合表达式（8）
      // 合并后就会变成 {{name}}+欢迎回来，所以这里查找 连续的 2和5 将他们拼接在一起
      // 合并后会是：createElementVNode('div', toDisplayString(_ctx.name) + '欢迎回来')

      // 容器
      let currentContainer = null;
      const { children } = node;
      // 是否有文本
      let hasText = false;
      // 当前子节点内，只要是出现了连续的 2 和 5 都拼接
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isText(child)) {
          // 有文本
          hasText = true;
          // 当前节点是文本，看他后面的是不是文本（因为后面可能连续一片都是，所以就循环）
          for (let j = i + 1; j < children.length; j++) {
            // 拿到下一个节点
            // 注意：这里不会像 Java 似的会出现数组越界的情况，JS数组越界只是会返回 undefined
            const next = children[j];
            if (isText(next)) {
              if (!currentContainer) {
                // currentContainer 为空，初始化添加
                currentContainer = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,    // 类型为符合表达式
                  children: [child]                       // 将模板表达式先放进来
                }
              }
              // 将文本追加进来
              currentContainer.children.push(' + ', next);
              // 将当前文本节点从数组中移除
              children.splice(j, 1);
              // 节点移除一个，下标 j 也得后退一步
              j--;
            } else {
              // 将容器置空，继续装下一个
              currentContainer = null;
              // 跳出内部循环
              break;
            }
          }
        }
      }

      if (
        // 如果是单个文本的普通元素，则不需要创建，因为运行时会直接设置元素的 textContent，速度更高效
        !hasText || children.length === 1 &&
        // 而且节点类型还必须是 根节点 或 节点类型是元素并且标签类型也是元素的情况下则直接返回
        (node.type === NodeTypes.ROOT || (node.type === NodeTypes.ELEMENT && node.tagType === ElementTypes.ELEMENT))
      ) {
        return;
      }

      // 给当前元素节点多个子节点中的 创建文本节点 添加 patchFlag 标识
      // 如果当前元素节点只有一个文本节点，就会将 patchFlag 打在 div 上
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isText(child) || child.type === NodeTypes.COMPOUND_EXPRESSION) {
          // 创建节点函数的调用参数
          const callArgs = [];

          if (child.type !== NodeTypes.TEXT || child.content !== ' ') {
            // 不管是不是动态文本，都得需要第一个用户的数据，先添加
            callArgs.push(child);
          }
          if (node.type !== NodeTypes.TEXT) {
            // 是动态节点，添加 patchFlag 文本标签，添加后就可以靶向更新了
            callArgs.push(String(PatchFlags.TEXT));
          }

          // 修改类型，变成 TEXT_CALL 类型后就会使用 createTextVNode
          // 因为这边已经确定了，元素中不是只有一个文本元素，而是多个子节点，就应该单独创建文本节点并打标签
          children[i] = {
            type: NodeTypes.TEXT_CALL,
            content: child,
            codegenNode: createCallExpression(context.helper(CREATE_TEXT), callArgs)
          };
        }
      }
    }
  }
}