/*
 * File: /src/components/Teleport.ts
 * Project: @vue/runtime-core
 * Created Date: 2023-01-08
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 传送门组件
 * Description: Teleport 是 Vue3 新增的内置组件，其作用就是：将其插槽内容渲染到 DOM 中的另一个位置
 */

export const TeleportImpl = {
  __isTeleport: true,
  // 处理元素挂载
  process(oldVnode, newVnode, container, internals) {
    const { mountChildren, patchChildren, move } = internals;
    if (!oldVnode) {
      // 旧节点为空，第一次初始化，挂载元素到目标
      const target = document.querySelector(newVnode.props.to);
      target && mountChildren(newVnode.children, target);
    } else {
      // 更新
      patchChildren(oldVnode, newVnode, container);
      if (oldVnode.props.to !== newVnode.props.to) {
        // 传送位置发生变化，移动元素到最新位置
        const nextTarget = document.querySelector(newVnode.props.to);
        // 所有孩子移动走
        newVnode.children.forEach(child => move(child, nextTarget, null));
      }
    }
  }
}

// 判断是否 Teleport 组件
export const isTeleport = type => type.__isTeleport;

// 导出 Teleport
export const Teleport = TeleportImpl;