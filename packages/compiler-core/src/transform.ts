/*
 * File: /src/transform.ts
 * Project: @vue/compiler-core
 * Created Date: 2023-02-26
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 语法转换
 * Description: 将抽象语法树再次处理，达到生成代码的要求
 */

import { isArray, isString, PatchFlags } from "@vue/shared";
import { createVNodeCall, ElementTypes, NodeTypes } from "./ast";
import { FRAGMENT, helperNameMap, TO_DISPLAY_STRING } from "./runtimeHelpers";
import { isSlotOutlet, isVSlot, makeBlock } from "./utils";

// 语法转换
export const transform = (ast, options) => {
  // 创建转换上下文
  const context = createTransformContext(ast, options);
  // 转化节点
  traverseNode(ast, context);
  // 再次处理一下根节点，并添加代码生成节点
  createRootCodegen(ast, context);
  // 将全部方法名保存到 ast 中
  ast.helpers = [...context.helpers.keys()];
  // 将组件添加到抽象语法树
  ast.components = [...context.components];
}

// 创建转换上下文
const createTransformContext = (root, { nodeTransforms, directiveTransforms }) => {
  const context = {
    parent: null,           // 当前正在转化的父节点
    childIndex: 0,          // 子节点索引
    nodeTransforms,         // 节点转换集合
    currentNode: root,      // 当前正在转化的节点
    directiveTransforms,    // 指令转换集合
    helpers: new Map(),     // 整个组件内要使用的方法容器
    components: new Set(),  // 组件集合
    directives: new Set(),  // 指令集合

    // 添加要使用的方法，比如：createElementVNode 或 createElementBlock 等
    helper(name) {
      // 这里再做个优化，来记录该方法调用了几次，超过20次则字符串化
      const count = context.helpers.get(name) || 0;
      context.helpers.set(name, count + 1);
      return name;
    },
    // 通过 Symbol 拿到对应的函数名，并添加 _
    helperString(name) {
      return `_${helperNameMap[context.helper(name)]}`
    },
    // 移除要使用的方法
    removeHelper(name) {
      const count = context.helpers.get(name);
      if (count) {
        // 该方法使用次不为0，减掉
        const currentCount = count - 1;
        // 无可用则干掉该方法，否则更新次数
        !currentCount ? context.helpers.delete(name) : context.helpers.set(name, currentCount);
      }
    },
    // 替换节点
    replaceNode(node) {
      // 将父节点中当前索引指向的子节点替换了，当前节点指向也更改为指定节点
      context.parent.children[context.childIndex] = context.currentNode = node;
    },
    // 移除节点（这里暂时为空，遍历子节点时会重新替换为新函数）
    onNodeRemoved: () => { },
    // 移除节点
    removeNode(node) {
      // 获取所有兄弟节点列表
      const list = context.parent.children;
      // 获取要移除的索引位置
      const removalIndex = node ? list.indexOf(node) : context.currentNode ? context.childIndex : -1;
      // 没有传递节点，或当前节点就是传递的节点，直接移除，并将当前节点设置为空
      if (!node || node === context.currentNode) {
        // 移除当前节点
        context.currentNode = null;
        // 移除节点（遍历子节点 i - 1）
        context.onNodeRemoved();
      } else {
        // 传递了指定节点，或指定节点不为当前节点，那就是移除兄弟节点
        if (context.childIndex > removalIndex) {
          // 当前子节点-1
          context.childIndex--;
          // 移除节点
          context.onNodeRemoved();
        }
      }
      // 从子节点中移除
      context.parent.children.splice(removalIndex, 1);
    }
  };
  return context;
}

// 根据类型遍历每个节点
export const traverseNode = (node, context) => {
  // 当前执行的节点
  context.currentNode = node;
  // 拿到节点操作集合
  const { nodeTransforms } = context;
  // 退出函数集
  const exitFns = [];

  // 调用遍历
  for (let i = 0; i < nodeTransforms.length; i++) {
    // 执行方法并拿到方法的退出函数
    const onExit = nodeTransforms[i](node, context);
    // 保存退出函数
    if (onExit) {
      isArray(onExit) ? exitFns.push(...onExit) : exitFns.push(onExit);
    }
    if (!context.currentNode) {
      // 当前节点在上面执行的时候被删了，直接返回即可，无需继续执行
      return;
    }
  }

  // 根据类型判断是否需要遍历
  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      // 表达式，添加显示字符串方法
      context.helper(TO_DISPLAY_STRING);
      break;
    case NodeTypes.IF:
      // 是 if，所有分支挨个再走一遍
      node.branches.forEach(item => traverseNode(item, context));
      break;
    case NodeTypes.ROOT:
    case NodeTypes.FOR:
    case NodeTypes.ELEMENT:
    case NodeTypes.IF_BRANCH:
      // 这4中类型直接遍历子节点
      traverseChildren(node, context);
      break;
  }

  // 将当前node再设置一次为当前节点，保证执行退出函数的时候，currentNode 依旧是对的
  context.currentNode = node;

  // 处理退出函数，这里需要倒着来，先处理子节点，再往父级找
  // 因为 nodeTransforms 是先放的元素再放的文本，也就是先处理的元素再处理的文本，而处理后，在退出函数中需要先处理文本再处理元素
  let i = exitFns.length;
  while (i--) {
    exitFns[i]();
  }
}

// 遍历子节点
const traverseChildren = (parent, context) => {
  let i = 0;
  // 移除节点（子节点列表移除后，这边的遍历也要少一个）
  const nodeRemoved = () => i--;

  for (; i < parent.children.length; i++) {
    const child = parent.children[i];
    // 字符串没必要递归
    if (isString(child)) {
      continue;
    }
    // 上下文的父节点指向当前节点
    context.parent = parent;
    context.childIndex = i;
    // 给上下文添加节点移除函数（方便其他地方处理使用，如 v-if）
    context.onNodeRemoved = nodeRemoved;
    // 继续递归
    traverseNode(child, context);
  }
}

// 创建根节点的代码生成
const createRootCodegen = (ast, context) => {
  const { children } = ast;
  if (!children.length) {
    return;
  }

  if (children.length === 1) {
    const child = children[0];
    if (child.type === NodeTypes.ELEMENT && child.codegenNode && !isSlotOutlet(child)) {
      if (child.codegenNode.type === NodeTypes.VNODE_CALL) {
        // 这里就不再调用 createElementVNode 了，而是调用 openBlock 和 createElementBlock
        makeBlock(child.codegenNode, context);
      }
      // 因为只有一个子节点，所以根节点的 codegenNode 就是子节点的 codegenNode
      ast.codegenNode = child.codegenNode;
    } else {
      // 直接将子节点放进去
      ast.codegenNode = child;
    }
  } else {
    // 多个子节点，codegenNode 应该是个 Fragment
    ast.codegenNode = createVNodeCall(
      context,
      context.helper(FRAGMENT),       // tag
      undefined,                      // props
      children,                       // children
      PatchFlags.STABLE_FRAGMENT,     // PatchFlags
      undefined,                      // dynamicProps（动态属性）
      undefined,                      // directives（指令）
      true,                           // 是否Block
      false,                          // disableTracking（是否禁用收集动态节点）
      false                           // 是否组件
    );
  }
}

// 创建结构指令转换
export const createStructuralDirectiveTransform = (name, fn) => {
  // 是否匹配函数（匹配指令名称，如：v-if、v-for）
  const matches = isString(name) ? n => n === name : n => name.test(n);

  return (node, context) => {
    // 只处理元素
    if (node.type === NodeTypes.ELEMENT) {
      const { props } = node;
      if (node.tagType === ElementTypes.TEMPLATE && props.some(isVSlot)) {
        // 不转换插槽，会有专门的处理
        return;
      }
      // 退出函数数组
      const exitFns = [];
      for (let i = 0; i < props.length; i++) {
        const prop = props[i];
        if (prop.type === NodeTypes.DIRECTIVE && matches(prop.name)) {
          // 是指令，从数组内移除，否则会无限递归
          props.splice(i, 1);
          // 计数减1
          i--;
          // 执行转换函数并拿到退出函数
          const onExit = fn(node, prop, context);
          onExit && exitFns.push(onExit);
        }
      }
      return exitFns;
    }
  };
}