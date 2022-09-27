/*
 * File: /src/h.ts
 * Project: @vue/runtime-core
 * Created Date: 2022-09-27
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: h函数
 * Description: 
 *    h函数是用于创建虚拟节点的函数，比createVNode函数更智能，会根据第二个参数和第三个参数来决定创建什么样的虚拟节点
 *    h函数一般是给用户使用的，Vue自己模板生成的是靶向更新函数或直接去创建虚拟节点
 */

import { isArray, isObject } from '@vue/shared';
import { createVNode, isVNode } from './vnode';

/**
 * h函数
 * @param type 类型 字符串|对象|函数
 * @param propsChildren 属性或子节点
 * @param children 子节点
 * @returns 虚拟节点
 */
export function h(type, propsChildren?, children?) {
  // 参数
  const l = arguments.length;
  if (l === 2) {
    // 只有两个参数，会有下面两种可能
    if (isObject(propsChildren) && !isArray(propsChildren)) {
      // 第二个参数是对象，不是数组，可能是vnode或属性对象
      if (isVNode(propsChildren)) {
        // 符合如：h('div', h('span']))
        return createVNode(type, null, [propsChildren]);
      }
      // 符合这种情况：h('div', { style: { color: 'red' } })
      return createVNode(type, propsChildren);
    }
  } else {
    if (l > 3) {
      // 长度大于 3
      // 除了前两个，其他参数都是儿子
      children = Array.prototype.slice.call(arguments, 2);
    } else if (l === 3 && isVNode(children)) {
      // 如果参数正好是3个，那么子节点可能还是一个虚拟节点，我们需要将子节点转换为数组
      children = [children];
    }
    // 创建虚拟节点
    return createVNode(type, propsChildren, children);
  }
}