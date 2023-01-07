/*
 * File: /src/components/KeepAlive.ts
 * Project: @vue/runtime-core
 * Created Date: 2023-01-07
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: KeepAlive 组件
 * Description: KeepAlive 组件使用的其实是插槽，卸载时缓存到内存，重新加载时从内存中取回
 */

import { isArray, isString, ShapeFlags } from '@vue/shared';
import { onMounted, onUpdated } from "../apiLifecycle";
import { getCurrentInstance } from "../component";
import { isVNode } from "../vnode";

// 组件定义
const KeepAliveImpl = {
  name: 'KeepAlive',
  __isKeepAlive: true,
  props: {
    // 要缓存的组件
    include: [String, RegExp, Array],
    // 要排除的组件
    exclude: [String, RegExp, Array],
    // 最大缓存个数
    max: [String, Number]
  },
  setup(props, { slots }) {
    // 当前节点
    let current;
    // 缓存组件的key
    const keys = new Set();
    // 缓存组件的内容
    const cache = new Map();
    // 缓存的key
    let pendingCacheKey = null;
    // 当前组件实例
    const instance = getCurrentInstance();
    // 上下文
    const sharedContext = instance.ctx;
    // 元素操作
    const { renderer: { patch, move, unmount: _unmount, renderOptions: { createElement } } } = sharedContext;
    // 存放组件的容器
    const storageContainer = createElement('div');

    // 激活方法
    sharedContext.activate = (vnode, container, anchor) => {
      // 取出节点组件实例
      const instance = vnode.component;
      // 将当前节点从内存移动到指定容器中即可在浏览器渲染
      move(vnode, container, anchor);
      // 对比更新
      patch(instance.vnode, vnode, container, anchor, instance);
    }

    // 失活方法
    sharedContext.deactivate = vnode => {
      // 将该节点从浏览器挂载移动到内存中
      move(vnode, storageContainer, null);
    }

    // 缓存子组件
    const cacheSubtree = () => {
      pendingCacheKey != null && cache.set(pendingCacheKey, instance.subTree);
    }

    // 内部卸载函数
    const unmount = vnode => {
      // 重置 flag 标识
      resetShapeFlag(vnode);
      // 卸载
      _unmount(vnode, instance);
    }

    // 删除缓存
    const pruneCacheEntry = key => {
      const cached = cache.get(key);
      if (!current || cached.type !== current.type) {
        // 真将该缓存干掉
        unmount(cached);
      } else if (current) {
        // 将当前组件的标识重置
        resetShapeFlag(current);
      }
      // 从组件内容和组件key缓存删除
      cache.delete(key);
      keys.delete(key);
    }
    // 我们要缓存的是组件渲染的内容，而不是虚拟节点本身，所以需要在 onMounted 中去做
    onMounted(cacheSubtree);
    onUpdated(cacheSubtree);

    // 返回渲染函数
    return () => {
      // 重置缓存的key
      pendingCacheKey = null;
      // 默认取插槽的 default 属性
      if (!slots.default) {
        // 没有 default，直接返回空
        return null;
      }
      // 取出默认子虚拟节点
      const children = slots.default();
      // 只用第一个子节点
      const vnode = children[0];
      if (children.length > 1) {
        // 有多个子节点，直接返回子节点集，不再继续执行
        current = null;
        return children
      } else if (!isVNode(vnode) || !(vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT)) {
        // 非虚拟节点，或非状态组件，直接返回（函数组件没有状态，不会缓存函数组件）
        current = null;
        return vnode;
      }
      // 获取组件
      const comp = vnode.type;
      // 获取到组件名
      const name = comp.name;

      // 从属性中取出三个属性
      const { include, exclude, max } = props;
      // 如果 include 有值，而且没有名称或名称在 include 中匹配不到到则原地返回
      // 如果 exclude 有值，而且有名称并且名称再 exclude 中匹配得到则原地返回
      if ((include && (!name || !matches(include, name))) || (exclude && name && matches(exclude, name))) {
        current = vnode;
        return vnode;
      }

      // 取出key
      const key = comp.key == null ? comp : comp.key;
      // 根据key从缓存中找对应的vnode
      const cachedVNode = cache.get(key);
      // 将当前key缓存起来，组件 onMounted 内使用
      pendingCacheKey = key;

      if (cachedVNode) {
        // 从缓存中能找到，复用缓存中的元素和组件
        vnode.el = cachedVNode.el;
        vnode.component = cachedVNode.component;
        // 添加标识，挂载时从缓存中移动出来
        vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE;
        // 删掉旧的，添加新的
        keys.delete(key);
        keys.add(key);
      } else {
        // 从缓存中没有找到，证明是第一次
        keys.add(key);
        // 如果缓存超过上限，则将最老的缓存干掉
        if (max && keys.size > parseInt(max as string, 10)) {
          // 从迭代器中获取到第一个，取出 key 干掉
          pruneCacheEntry(keys.values().next().value);
        }
      }
      // 给当前虚拟节点添加一个标识，表示卸载的时候不能真干掉
      vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;
      // 将当前节点存起来，方便上面其他函数使用
      current = vnode;
      return vnode;
    }
  }
}

// 判断是否 KeepAlive
export const isKeepAlive = vnode => vnode.type.__isKeepAlive;

// 导出
export const KeepAlive = KeepAliveImpl;

// 匹配函数
const matches = (pattern, name) => {
  if (isArray(pattern)) {
    // 是数组
    return pattern.some((p) => matches(p, name));
  } else if (isString(pattern)) {
    // 是字符串
    return pattern.split(',').includes(name);
  } else if (pattern.test) {
    // 是正则
    return pattern.test(name);
  }
  return false;
}

// 重置标志
const resetShapeFlag = vnode => {
  // 取出标志信息
  let shapeFlag = vnode.shapeFlag;
  // 如果当前标志是 “组件应该保持活动状态”，则抹除该标志
  if (shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
    shapeFlag -= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;
  }
  // 如果当前标志是 “组件保持活动状态”，则抹除该标志
  if (shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
    shapeFlag -= ShapeFlags.COMPONENT_KEPT_ALIVE;
  }
  // 将标志更新到虚拟节点内
  vnode.shapeFlag = shapeFlag;
}