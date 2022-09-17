/*
 * File: /src/baseHandler.ts
 * Project: @vue/reactivity
 * Created Date: 2022-09-15
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 基本handler
 * Description: 基本handler来处理 reactive、readonly 及浅代理的逻辑
 */

import { hasOwn, isArray, isObject } from '@vue/shared';
import { track } from './effect';
import { reactive, ReactiveFlags, reactiveMap, readonly, readonlyMap, shallowReactiveMap, shallowReadonlyMap, toRaw } from "./reactive";

// 数组仪表对象（当代理拦截到的是数组，则使用这里）
const arrayInstrumentations = createArrayInstrumentations();

/**
 * 创建数组仪表
 *  主要针对数组代理
 *  如执行 includes 时应该通过源对象去执行，而不是代理对象，因为被代理过的都是Proxy，肯定不包含
 */
function createArrayInstrumentations() {
  // 存放收集后的对象
  const instrumentations = {};

  // 遍历如下函数名
  ['includes', 'indexOf', 'lastIndexOf'].forEach(key => {
    // 给对象添加函数
    instrumentations[key] = function (this, ...args) {
      // 将代理数组变成源数组
      const arr = toRaw(this);
      for (let i = 0; i < this.length; i++) {
        // 依赖收集 源对象、get、字符串类型的下标（就是key）
        track(arr, i + '');
      }
      // 执行原始数组方法，获得结果（这里的参数不做任何处理，因为可能参数就是代理对象）
      const res = arr[key](...args);
      if (res === -1 || res === false) {
        // 执行原始数组方法得到 -1 或者 false，证明没有找到，再尝试把参数也转换为原始对象
        return arr[key](...args.map(toRaw));
      } else {
        // 通过原始数组 + 用户传递的参数能够获取到，直接返回
        return res;
      }
    }
  });

  // 遍历如下函数名
  ['push', 'pop', 'shift', 'unshift', 'splice'].forEach(key => {
    instrumentations[key] = function (this, ...args) {
      // 将代理数组转换为原始数组，并执行该方法（将方法内的指向改为代理数组）
      return toRaw(this)[key].apply(this, args);
    }
  });
  // 返回
  return instrumentations;
}

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

    // 是否数组
    const targetIsArray = isArray(target);
    // 数组处理，如果不是只读的，并且还是数组，属性名也在 数组仪表对象中，则从数组仪表中取值
    // 这里主要是针对数组中的方法，如 push、pop、includes 等...
    if (!isReadonly && targetIsArray && hasOwn(arrayInstrumentations, key)) {
      return Reflect.get(arrayInstrumentations, key, receiver);
    }

    // 从对象中取出数据
    const result = Reflect.get(target, key, receiver);

    // 如果不是只读，则依赖收集
    // 只读为什么不依赖收集，因为只读无法修改值，依赖收集了也没啥用
    if (!isReadonly) {
      track(target, key);
    }

    // 如果是 浅的，就不需要继续往下了，直接返回取出的值即可
    if (shallow) {
      return result;
    }
    // 如果是对象
    if (isObject(result)) {
      // 是对象，继续深度代理
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
