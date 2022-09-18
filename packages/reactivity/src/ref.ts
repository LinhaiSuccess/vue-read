/*
 * File: /src/ref.ts
 * Project: @vue/reactivity
 * Created Date: 2022-09-17
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: ref基本数据类型响应式
 * Description: 
 *    ref 实现和 reactive 类似，都是在 get 中依赖收集，set中触发更新
 *    不同的是 ref 使用的不是 Proxy，而是 属性访问器 来实现
 *    当传递的参数为对象时，ref也会使用 reactive
 */

import { hasChanged, isArray, isObject } from "@vue/shared";
import { activeEffect, trackEffects, triggerEffects } from "./effect";
import { isReactive, reactive, toRaw } from "./reactive";

class RefImpl {
  private _value;                     // 内部私有值
  private _rawValue;                  // 内部原始值
  public dep;                         // 依赖收集的 Set 集合
  public readonly __v_isRef = true;   // 是否 ref

  constructor(value, public readonly __v_isShallow) {
    // 内部原始值，浅代理只支持基本数据类型
    this._rawValue = __v_isShallow ? value : toRaw(value);
    // 内部值，浅代理直接使用即可，否则如果为对象，是对象则转换成 reactive
    this._value = __v_isShallow ? value : toReactive(value);
  }

  // 读取value
  get value() {
    // 直接依赖收集
    trackRefValue(this);
    // 返回内部值
    return this._value;
  }

  // 设置value
  set value(newValue) {
    // 新值，如果不是浅代理，则尝试转换为原始对象
    newValue = this.__v_isShallow ? newValue : toRaw(newValue);
    // 旧值 和 新值 不一样，则触发更新
    if (hasChanged(newValue, this._rawValue)) {
      this._rawValue = newValue;
      // 如果新值为对象，则转换为 reactive，否则返回原值
      this._value = this.__v_isShallow ? newValue : toReactive(newValue);
      // 触发更新
      triggerRefValue(this);
    }
  }
}

/**
 * 创建 ref
 * @param rawValue 原始值
 * @param shallow 是否浅代理
 * @returns 返回一个 Ref 实例，内部已经完成了响应式封装
 */
function createRef(rawValue, shallow) {
  if (isRef(rawValue)) {
    // 已经是 ref 了，无需再次代理，原地返回即可
    return rawValue;
  }
  // 返回 Ref 实例
  return new RefImpl(rawValue, shallow);
}

/**
 * ref 实现
 * @param value 要转换为响应式的 基本类型 或 引用类型
 * @returns 转换后的 ref 响应式对象
 */
export function ref(value?) {
  return createRef(value, false);
}

/**
 * 浅代理 ref 实现
 *  只有 value 修改才会触发视图更新，如果是对象而对象属性修改不会触发视图更新
 *  如果为基本数据类型，和 ref 效果一样
 * @param value 要转换为响应式的 基本类型 或 引用类型
 * @returns 转换后的浅 ref 响应式对象
 */
export function shallowRef(value?) {
  return createRef(value, true);
}

/**
 * ref依赖收集
 * @param ref ref对象
 */
export function trackRefValue(ref) {
  if (activeEffect) {
    // 将 ref 转换为原始对象
    ref = toRaw(ref);
    // 依赖收集
    trackEffects(ref.dep || (ref.dep = new Set));
  }
}

/**
 * ref触发更新
 * @param ref ref对象
 */
export function triggerRefValue(ref) {
  // 将 ref 转换为原始对象
  ref = toRaw(ref);
  if (ref.dep) {
    triggerEffects(ref.dep);
  }
}

/**
 * 对象Ref实现类
 */
class ObjectRefImpl {
  public readonly __v_isRef = true;
  constructor(private _object, private _key) { }

  // 读取value时，依然从源响应式对象取值（会触发依赖收集）
  get value() {
    return this._object[this._key];
  }

  // 设置value时，依然给源响应式对象设置（会触发更新）
  set value(newValue) {
    this._object[this._key] = newValue;
  }
}

/**
 * 将对象全部属性转为ref
 *  如果对象是响应式对象，会转为普通对象，但对象属性全部为ref对象，依旧可以触发响应式
 *  如果对象是普通对象，虽然属性为ref对象，但不会触发响应式，因为ref属性的取值和写值依旧是对源对象进行操作
 * @param object 源对象
 * @returns 转换后的对象
 */
export function toRefs(object) {
  // 如果是数组，则实例化同样大小的空数组，否则为空对象
  const ret = isArray(object) ? new Array(object.length) : {};
  for (const key in object) {
    // 遍历全部属性，将每个属性值都变成 ref 对象
    ret[key] = toRef(object, key);
  }
  return ret;
}

/**
 * 将对象某个属性转为ref
 * @param object 源对象
 * @param key 属性key
 * @returns 转换后的对象属性
 */
export function toRef(object, key) {
  // 获取值
  const value = object[key];
  // 如果值是 ref 就直接返回，否则返回 ObjectRefImpl 实例
  return isRef(value) ? value : new ObjectRefImpl(object, key);
}

// 脱ref代理处理程序
const shallowUnwrapHandlers = {
  get(target, key, receiver) {
    // 如果是 ref 则返回 .value 的值，否则直接返回
    return unref(Reflect.get(target, key, receiver))
  },
  set(target, key, value, receiver) {
    // 获取旧值
    const oldValue = target[key];
    // 如果旧值是 ref，并且新值不是 ref，则直接复用
    if (isRef(oldValue) && !isRef(value)) {
      oldValue.value = value;
      return true;
    }
    // 直接给目标对象设置
    return Reflect.set(target, key, value, receiver);
  }
};

/**
 * 脱 ref 
 *  模板渲染也会用到，ref 在模板中使用不需要 .value
 * @param objectWithRefs reactive对象 或 refs
 * @returns 脱掉 .value 后的对象
 */
export function proxyRefs(objectWithRefs) {
  return isReactive(objectWithRefs) ? objectWithRefs : new Proxy(objectWithRefs, shallowUnwrapHandlers);
}

/**
 * 转换为 reactive 对象，前提：必须是对象
 * @param value 对象 或 基本类型值
 * @returns 可能被转换为 reactive对象 的值
 */
export function toReactive(value) {
  // 如果是对象，则转换为 reactive，否则直接返回
  return isObject(value) ? reactive(value) : value;
}

/**
 * 是否 ref 对象
 * @param value 值
 * @returns 是否 ref
 */
export function isRef(value) {
  return !!(value && value.__v_isRef);
}

/**
 * 脱掉ref
 * @param ref ref 对象
 * @returns 值
 */
export function unref(ref) {
  return isRef(ref) ? ref.value : ref;
}