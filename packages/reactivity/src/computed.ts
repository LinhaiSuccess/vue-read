/*
 * File: /src/computed.ts
 * Project: @vue/reactivity
 * Created Date: 2022-09-18
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 计算属性
 * Description: 
 *    计算属性会返回一个 ComputedRefImpl 对象，数据劫持是使用的 属性访问器
 *    在 ComputedRefImpl 对象函数中实例化了 ReactiveEffect，并由自己决定何时触发更新，当读取value时会进行依赖收集
 *    当成员变量脏数据标识为false时则会触发更新
 */

import { isFunction } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { toRaw } from "./reactive";
import { trackRefValue, triggerRefValue } from "./ref";

class ComputedRefImpl {
  public effect;          // 存储响应式effect对象实例
  public _value;          // 计算属性中的私有值
  public _dep;            // 收集 effect 的容器
  private _dirty = true;  // 是否脏数据
  constructor(public getter, public setter) {
    // 使用 ReactiveEffect 实现响应式，不同的是触发更新时是否调用 run方法 的实际由我们决定
    this.effect = new ReactiveEffect(getter, () => {
      // 不是脏数据就触发更新
      if (!this._dirty) {
        this._dirty = true;
        // 触发更新
        triggerRefValue(this);
      }
    });
  }

  // value 的 get 对象访问器
  get value() {
    // 计算得到的 对象 可能会被其他代理封装，所以这里需要获取到原始值
    const self = toRaw(this);
    // 依赖收集
    trackRefValue(self);

    if (self._dirty) {
      self._dirty = false;
      // 值已经变成了脏数据，执行 run方法 重新获取新值
      self._value = self.effect.run();
    }
    return self._value;
  }

  // value 的 set 对象访问器
  set value(newValue) {
    // 执行用户的 set 方法
    this.setter(newValue);
  }
}

/**
 * 计算属性
 * @param getterOrOptions getter函数，或者 对象
 * @returns ComputedRefImpl对象实例
 */
export const computed = (getterOrOptions) => {
  // 计算属性的 get 和 set
  let getter, setter;
  // 单个 getter 就是一个函数
  const onlyGetter = isFunction(getterOrOptions);

  if (onlyGetter) {
    // 是单个 getter 函数，直接赋值给 getter 即可
    getter = getterOrOptions;
    setter = () => console.warn('计算属性为只读，不可写入');
  } else {
    // 不是单个 getter，取出 get 和 set
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  // 实例化 ComputedRefImpl 对象，实现计算属性功能
  return new ComputedRefImpl(getter, setter);
}