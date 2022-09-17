/*
 * File: /src/reactive.ts
 * Project: @vue/reactivity
 * Created Date: 2022-09-15
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 响应式
 * Description: 
 *    可将普通对象转换为响应式对象、浅响应式对象、只读对象等
 *    在Vue3中使用了Proxy代理来实现响应式的，当读取属性时会拦截并进行依赖收集，属性变化时则会触发更新
 */

import { isObject } from "@vue/shared";
import { mutableHandlers, readonlyHandlers } from "./baseHandler";

// 响应式对象映射表（存放 原对象 和 代理对象的映射关系）
export const reactiveMap = new WeakMap();
// 浅响应式对象映射表
export const shallowReactiveMap = new WeakMap();
// 只读对象映射表
export const readonlyMap = new WeakMap();
// 浅只读对象映射表
export const shallowReadonlyMap = new WeakMap();

// reactive标识枚举
export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',     // 是否 响应式对象
  IS_READONLY = '__v_isReadonly',     // 是否 只读
  IS_SHALLOW = '__v_isShallow',       // 是否浅代理
  RAW = '__v_raw'                     // 取原始对象
};

/**
 * 创建通用的响应式对象
 * @param target 代理对象
 * @param baseHandlers 基本handlers
 * @param proxyMap 代理映射表
 */
export function createReactiveObject(target, baseHandlers, proxyMap) {
  // 不是一个对象，直接返回
  if (!isObject(target)) {
    return target;
  }
  // 如果从代理中能拿到原始对象，就证明已经是代理对象了，直接返回即可
  // 注意：如果是响应式对象，这里的读取会进入 Proxy.get 中，Proxy.get 中如果看到读取的 key 为这个标识，会返回true，这里就成立了，就不会往下走
  if (target[ReactiveFlags.RAW]) {
    // 返回代理对象
    return target;
  }
  // 被代理过的对象没必要再次进行代理，我们从代理映射表中看一下当前代理对象是否存在，存在则直接返回即可
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }

  // 数据代理
  const proxy = new Proxy(target, baseHandlers);
  // 添加代理映射表，创建 源对象 和 代理对象 映射关系
  proxyMap.set(target, proxy);
  return proxy;
}

/**
 * 响应式：将对象变为响应式
 * 
 * @param target 目标对象
 * @returns 被转换后的响应式对象
 */
export function reactive(target) {
  // 如果对象是只读的，则直接原地返回（只读对象的不能变成响应式对象）
  if (isReadonly(target)) {
    return target
  }
  // 创建响应式对象
  return createReactiveObject(target, mutableHandlers, reactiveMap);
}

/**
 * 只读对象：将对象变为只读
 * 
 * @param target 目标对象
 * @returns 被转换后的只读对象
 */
export function readonly(target) {
  // 创建浅响应式对象
  return createReactiveObject(target, readonlyHandlers, readonlyMap);
}

/**
 * 是否只读对象
 * 
 * @param value 要判断的值
 * @returns 是否只读对象
 */
export function isReadonly(value) {
  // 如果不是只读对象，读取该属性就是undefined，如果是只读对象，就会进入代理，代理get内会返回true
  return !!(value && value[ReactiveFlags.IS_READONLY]);
}

/**
 * 响应式对象转换为原始对象
 * 
 * @param observed 观察者
 * @returns 原始对象（深层次）
 */
export function toRaw(observed) {
  // 如果当前响应式对象有值，则取原始对象（从代理中获取的）
  const raw = observed && observed[ReactiveFlags.RAW];
  // 如果从代理中拿到了原始对象，则继续递归获取（如果只代理了一次，再次执行会原地返回），否则如果代理中没有获取到，则原地返回
  return raw ? toRaw(raw) : observed;
}

/**
 * 是否浅代理
 * 
 * @param value 要判断的值
 * @returns 是否浅代理
 */
export function isShallow(value) {
  return !!(value && value[ReactiveFlags.IS_SHALLOW]);
}