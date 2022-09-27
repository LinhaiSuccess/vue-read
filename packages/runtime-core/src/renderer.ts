/*
 * File: /src/renderer.ts
 * Project: @vue/runtime-core
 * Created Date: 2022-09-27
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 渲染器
 * Description: 组件渲染的核心文件
 */

import { ShapeFlags } from '@vue/shared';
import { Text } from './vnode';

/**
 * 创建渲染器
 *  与平台无关，渲染过程由 renderOptions 来决定，可能是DOM操作实现、也可能是 canvas 或小程序的实现
 * @param renderOptions 渲染选项
 */
export function createRenderer(renderOptions) {
  // 将渲染操作中的API取出，并重新命名
  const {
    insert: hostInsert,
    createText: hostCreateText,
    remove: hostRemove,
    setText: hostSetText,
  } = renderOptions;

  // 渲染函数
  const render = (vnode, container) => {
    if (vnode == null) {
      // 节点为空，自动卸载组件
      if (container._vnode) {
        // 确实有旧节点，卸载删除掉
        unmount(container._vnode);
      }
    } else {
      // 执行 patch（初始化或更新）
      patch(container._vnode || null, vnode, container);
    }
    // 将当前 vnode 保存到元素对象中
    container._vnode = vnode;
  }

  // 打补丁（核心函数，包含初始化、更新、diff全量对比）
  const patch = (oldVnode, newVnode, container, anchor = null) => {
    if (oldVnode === newVnode) {
      // 两个节点一样，没必要对比，直接返回
      return;
    }
    const { type, shapeFlag } = newVnode;
    // 根据不同形状执行不同逻辑
    switch (type) {
      case Text:
        // 执行文本处理
        processText(oldVnode, newVnode, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 执行元素处理
          processElement(oldVnode, newVnode, container, anchor);
        }
    }
  }

  // 卸载
  const unmount = vnode => {
    // 移除DOM元素
    hostRemove(vnode.el);
  }

  // 文本处理
  const processText = (oldVnode, newVnode, container) => {
    if (oldVnode == null) {
      // 初次渲染，插入纯文本字符串内容
      hostInsert(newVnode.el = hostCreateText(newVnode.children), container);
    } else {
      // 复用DOM元素（没必要移除再创建，提高了浏览器性能）
      const el = (newVnode.el = oldVnode.el);
      if (oldVnode.children !== newVnode.children) {
        // 内容确实变化了，更新字符串
        hostSetText(el, newVnode.children)
      }
    }
  }

  // 元素处理
  const processElement = (oldVnode, newVnode, container, anchor) => {
    // 旧节点为空则初次挂载元素，否则就对比更新元素
    oldVnode == null ? mountElement(newVnode, container, anchor) : patchElement(oldVnode, newVnode);
  }

  // 挂载元素
  const mountElement = (vnode, container, anchor) => {
    // TODO: 待实现
  }

  // 对比更新元素
  const patchElement = (oldVnode, newVnode) => {
    // TODO: 待实现
  }

  return {
    render
  }
}