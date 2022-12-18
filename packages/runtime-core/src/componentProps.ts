/*
 * File: /src/componentProps.ts
 * Project: @vue/runtime-core
 * Created Date: 2022-12-18
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 组件属性操作
 */

import { shallowReactive } from '@vue/reactivity';
import { hasOwn, ShapeFlags } from '@vue/shared';
import { hasPropsChanged } from './componentRenderUtils';

// 初始化属性
// 该方法的目的是将用于使用的全部属性区分开，哪些是 props 哪些是 attrs
// 在 VueConponent 中定义的是 props，没有定义的是 attrs
export const initProps = (instance, rawProps) => {
  // 响应式属性和元素属性
  const props = {};
  const attrs = {};
  // 用户定义的 props 数据类型
  const options = instance.propsOptions || {};

  if (rawProps) {
    for (let key in rawProps) {
      const value = rawProps[key];
      // 看 options 对象上有没有该属性的定义
      // 在组件中声明了改属性，则归属 props，否则 归属 attrs
      hasOwn(options, key) ? props[key] = value : attrs[key] = value;
    }
  }

  const { shapeFlag } = instance.vnode;
  if (shapeFlag & ShapeFlags.FUNCTIONAL_COMPONENT) {
    // 是函数式组件，函数式组件的 props 其实是 attrs（因为函数式组件内没有 propsOptions 参数声明）
    instance.props = attrs;
  } else {
    // 非函数式组件
    // props 是浅响应式
    instance.props = shallowReactive(props);
    instance.attrs = attrs;
  }
}

// 更新组件属性
export const updateProps = (prevProps, nextProps) => {
  // 检查属性是否发生变化（属性个数是否变化、值是否变化）
  if (hasPropsChanged(prevProps, nextProps)) {
    // 注意：prevProps 是 instance.props，它是是响应式的，会自动触发视图更新
    //      直接在循环中修改即可，我们在执行 effect 的时候也做了判断，当前运行的和正在执行的 effect 如果是同一个则忽略

    // 循环新属性，将 新属性 的值给 旧属性
    for (const key in nextProps) {
      prevProps[key] = nextProps[key];
    }

    // 可能旧属性上有以前的老属性，而新属性没有，这时候就要删除了，遍历旧属性
    for (const key in prevProps) {
      // 看当前旧属性的key在新属性中是否存在，不存在则删除
      if (!hasOwn(nextProps, key)) {
        delete prevProps[key];
      }
    }
  }
}

