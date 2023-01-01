/*
 * File: /src/helpers/renderSlot.ts
 * Project: @vue/runtime-core
 * Created Date: 2023-01-01
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 渲染插槽
 * Description: 插槽编译后的操作
 */

import { createVNode, Fragment, isVNode, openBlock, setupBlock } from "../vnode";

// 渲染插槽
export const renderSlot = (slots, name, props = {}) => {
  // 根据名称获取 slot
  let slot = slots[name];
  // 打开 block
  openBlock();
  // 检查slot的有效性
  const validSlotContent = slot && ensureValidVNode(slot(props));
  // 创建 block 节点，返回虚拟节点
  return createBlock(Fragment, { key: (props as any).key || `_${name}` }, validSlotContent || []);
}

// 创建 block，返回虚拟节点
export const createBlock = (type, props?, children?, patchFlag?, dynamicProps?) => {
  // 设置 block，将当前 block 添加到当前虚拟节点的动态子节点，并关闭block
  return setupBlock(createVNode(type, props, children, patchFlag, dynamicProps, true));
}

// 保证虚拟节点有效性
const ensureValidVNode = vnodes => {
  // 检查虚拟节点数组中每项是否非虚拟节点
  return vnodes.some(child => {
    if (!isVNode(child)) {
      return true;
    }
    if (child.type === Fragment && !ensureValidVNode(child.children)) {
      return false
    }
    return true
  }) ? vnodes : null;
}