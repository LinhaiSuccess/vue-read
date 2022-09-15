/*
 * File: /src/baseHandler.ts
 * Project: @vue/reactivity
 * Created Date: 2022-09-15
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 基本handler
 * Description: 基本handler来处理 reactive、readonly 及浅代理的逻辑
 */

import { isObject } from '@vue/shared';
import { reactive, ReactiveFlags, reactiveMap, readonly, readonlyMap, shallowReactiveMap, shallowReadonlyMap } from "./reactive";

/**
 * 获取代理 get 操作
 * @param isReadonly 是否只读
 * @param shallow 是否浅代理
 */
function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    // ReactiveFlags枚举一般几乎都是在代理前判断时读取该属性，来判断是否代理对象，如果是代理对象一定会进入这里
    // 在业务层面，就是当前对象是代理对象，直接返回即可，不必再重新代理
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    } else if (key === ReactiveFlags.IS_SHALLOW) {
      return shallow;
    }
    // 目的：如果是要取出代理前的原始对象，就会读取 ReactiveFlags.RAW 属性
    //      当确定 key 为 RAW 后，就会根据参数判断当前的代理对象是等于哪一类的映射表（浅只读、只读、浅响应式、响应式）
    //      确认哪一类后，就根据当前原始对象从映射表中取出代理对象，和当前代理对象做对比，如果相等则直接返回原始对象
    else if (
      // 如果是要取出原始对象
      key === ReactiveFlags.RAW &&
      // 而且代理对象还等于（shallowReadonlyMap 或 readonlyMap 或 shallowReactiveMap 或 reactiveMap）中当前源对象对应的代理对象，则返回源对象
      receiver === (isReadonly ? shallow ? shallowReadonlyMap : readonlyMap : shallow ? shallowReactiveMap : reactiveMap).get(target)
    ) {
      return target;
    }

    // 从对象中取出数据
    const result = Reflect.get(target, key, receiver);
    // 如果是 浅的，就不需要继续往下了，直接返回取出的值即可
    if (shallow) {
      return result;
    }
    // 如果是对象
    if (isObject(result)) {
      // 是对象，继续深度代理（Vue3在取值时再去深度代理性能提高了很多，属于懒代理）
      return isReadonly ? readonly(result) : reactive(result);
    }
    return result;
  }
}

// get
const get = createGetter();
const readonlyGet = createGetter(true);

// 可变 handlers（reactive使用）
export const mutableHandlers = {
  get
};

// 只读 handlers（readonly使用）
export const readonlyHandlers = {
  get: readonlyGet
};
