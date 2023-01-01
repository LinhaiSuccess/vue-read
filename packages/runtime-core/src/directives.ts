/*
 * File: /src/directives.ts
 * Project: @vue/runtime-core
 * Created Date: 2023-01-01
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 指令处理
 * Description: 添加指令及调用指令钩子
 */

import { isFunction } from '@vue/shared';
import { currentRenderingInstance } from './componentRenderContext';

/**
 * 添加指令
 * @param vnode 虚拟节点
 * @param directives 指令集
 */
export const withDirectives = (vnode, directives) => {
  // 取出当前正在渲染的组件实例
  const internalInstance = currentRenderingInstance;
  // 拿到指令
  const bindings = vnode.dirs || (vnode.dirs = []);

  // 遍历用户传递的指令集
  for (let i = 0; i < directives.length; i++) {
    // 结构出指令和值以及参数
    let [dir, value, arg] = directives[i];
    // 追加到节点 dir 中
    bindings.push({ dir, internalInstance, value, arg });
  }
  // 返回虚拟节点
  return vnode;
}

// 调用指令钩子
export function invokeDirectiveHook(vnode, prevVNode, name) {
  // 取出指令集
  const bindings = vnode.dirs;

  for (let i = 0; i < bindings.length; i++) {
    const binding = bindings[i];
    // 根据钩子函数名称获取到钩子函数（ vModelText 中的函数）
    let hook = binding.dir ? binding.dir[name] : void 0;
    if (hook) {
      // 执行钩子
      isFunction(hook) && hook(vnode.el, binding, vnode, prevVNode);
    }
  }
}