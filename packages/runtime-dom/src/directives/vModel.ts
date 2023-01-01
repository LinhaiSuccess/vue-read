/*
 * File: /src/directives/vModel.ts
 * Project: @vue/runtime-dom
 * Created Date: 2023-01-01
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: v-model 指令处理
 * Description: v-model 钩子及事件处理
 */

import { invokeArrayFns, isArray } from '@vue/shared';

export const vModelText = {
  // 创建钩子
  created(el, binding, vnode) {
    // 将父节点 v-model 事件存到DOM元素对象中
    el._assign = getModelAssigner(vnode);
    // 添加 input 事件
    el.addEventListener('input', e => {
      if (e.target.composing) {
        // 中文输入法正在输入中，不触发，直接返回
        return;
      }
      // 事件触发时直接调用父节点 v-model 给的事件，将值传递过去
      el._assign(el.value);
    });
    // 设置 compositionstart 和 compositionend 事件（输入法开始输入到输入法结束输入事件）
    el.addEventListener('compositionstart', e => e.target.composing = true);
    el.addEventListener('compositionend', e => {
      const target = e.target;
      if (target.composing) {
        // 关闭组成标识
        target.composing = false;
        // 触发input事件
        target.dispatchEvent(new Event('input'));
      }
    });
  },
  // 挂载钩子
  mounted(el, { value }) {
    el.value = value == null ? '' : value;
  },
  // 修改前钩子
  beforeUpdate(el, { value }, vnode) {
    // 将父节点 v-model 事件存到DOM元素对象中
    el._assign = getModelAssigner(vnode);
    if (el.composing) {
      // 中文输入法正在输入中，不触发，直接返回
      return;
    }
    // 如果旧值和新值不一样则更新
    const newValue = value == null ? '' : value
    if (el.value !== newValue) {
      el.value = newValue
    }
  }
}

/**
 * 获取 v-model 父节点事件
 * @param vnode 虚拟节点
 * @returns 父节点 vmodel 事件函数
 */
const getModelAssigner = (vnode) => {
  // 取出事件
  const fn = vnode.props['onUpdate:modelValue'];
  // 返回事件回调
  return isArray(fn) ? value => invokeArrayFns(fn, value) : fn;
}
