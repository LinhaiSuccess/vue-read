/*
 * File: /src/componentRenderUtils.ts
 * Project: @vue/runtime-core
 * Created Date: 2022-12-18
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 组件渲染工具
 */

import { ShapeFlags } from "@vue/shared";
import { setCurrentRenderingInstance } from "./componentRenderContext";

// 渲染根组件
export const renderComponentRoot = instance => {
  const { vnode, render, props, attrs } = instance;

  // 将当前渲染实例更改为当前实例，并保存父实例
  const prev = setCurrentRenderingInstance(instance);
  let result;
  let fallthroughAttrs;
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    // 状态组件，调用 render 渲染
    result = render.call(instance.proxy, instance.proxy);
    // 将 attrs 属性保存下来，里面可能有静态属性，如：style
    fallthroughAttrs = attrs;
  } else {
    // 函数式组件，将参数传递过去即可
    result = vnode.type(props);
  }

  // 有属性，把属性放到 result 中的 props 中
  if (fallthroughAttrs) {
    for (let key in fallthroughAttrs) {
      result.props && (result.props[key] = fallthroughAttrs[key]);
    }
  }

  // 将当前渲染实例还原为父实例
  setCurrentRenderingInstance(prev);
  return result;
}

// 检查属性是否变化
export const hasPropsChanged = (prevProps = {}, nextProps = {}) => {
  // 指望上面的默认值阻止不了 null，所以还是判断一下
  if (prevProps == null && nextProps == null) {
    return false;
  }
  prevProps = prevProps == null ? {} : prevProps;
  nextProps = nextProps == null ? {} : nextProps;

  // 检查属性个数
  const nextKeys = Object.keys(nextProps);
  if (nextKeys.length !== Object.keys(prevProps).length) {
    return true;
  }
  // 检查值是否一样
  for (let i = 0; i < nextKeys.length; i++) {
    // 取出key
    const key = nextKeys[i];
    if (nextProps[key] !== prevProps[key]) {
      return true;
    }
  }
  return false;
}

//组件应不应该更新
export const shouldUpdateComponent = (oldVnode, newVnode) => {
  // 取出组件属性
  const { props: prevProps, children: prevChildren } = oldVnode;
  const { props: nextProps, children: nextChildren } = newVnode;

  // 插槽：新旧只要有孩子 就更新
  if (prevChildren || nextChildren) {
    // 新节点或旧节点有孩子，更新
    return true;
  }
  // 属性：新旧属性相等 无需更新
  if (prevProps === nextProps) {
    // 新旧节点一致，无需更新
    return false;
  }
  // 之前可能没有，就看看现在有没有
  if (!prevProps) {
    return !!nextProps;
  }
  // 走到这里，那就代表之前是有值的，如果现在没有值，就更新
  if (!nextProps) {
    return true;
  }
  // 检查属性是否发生变化
  return hasPropsChanged(prevProps, nextProps);
}
