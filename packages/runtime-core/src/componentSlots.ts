/*
 * File: /src/componentSlots.ts
 * Project: @vue/runtime-core
 * Created Date: 2022-12-18
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 插槽处理
 */

import { isArray, isFunction, ShapeFlags } from "@vue/shared";
import { normalizeVNode } from './vnode';

// 初始化插槽
export const initSlots = (instance, children) => {
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    // 将当前插槽内容挂载到 组件实例 中
    instance.slots = children;
    // 标准化对象插槽
    normalizeObjectSlots(children, (instance.slots = {}));
  }
}

// 标准化插槽
export const normalizeSlot = rawSlot => {
  // 执行原始插槽，并将插槽值标准化返回
  // 返回一个函数，这个函数的参数就是 props
  const normalized = (...args) => normalizeSlotValue(rawSlot(...args))
  return normalized
}

// 标准化对象插槽
export const normalizeObjectSlots = (rawSlots, slots) => {
  for (const key in rawSlots) {
    const value = rawSlots[key];
    if (isFunction(value)) {
      // 是函数，标准化一下
      slots[key] = normalizeSlot(value);
    } else if (value != null) {
      // 可能是数组，也可能是对象，如果是对象则标准化为数组
      slots[key] = () => normalizeSlotValue(value)
    }
  }
}

// 更新插槽
export const updateSlots = (instance, children) => {
  // 更新时，instance.slots 中的 default函数 是正常化后的，而 children 中的 default函数 是最新的
  // 这里就应该将 instance.slots 中的 default 更新为 children 中的 default
  normalizeObjectSlots(children, instance.slots);
}

// 标准化插槽值
const normalizeSlotValue = value => {
  return isArray(value) ? value.map(normalizeVNode) : [normalizeVNode(value)];
}