/*
 * File: /src/apiWatch.ts
 * Project: @vue/runtime-core
 * Created Date: 2022-09-25
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: watch监视
 * Description: 
 *    watch监视可以监视响应式对象或函数内的响应式对象，当响应式对象属性值发生变化后会调用用户的回调函数
 *    watch内部主要是依赖effect实现监视属性变化，传递的响应式对象会被包裹在getter方法中
 *    getter方法或是被内部创建，或由用户传递，而内部getter方法就是响应式核心ReactiveEffect的fn函数
 */

import { isReactive, isRef, ReactiveEffect } from "@vue/reactivity";
import { isArray, isFunction, isObject } from "@vue/shared";

/**
 * watch监视
 * @param source 响应式对象 | 函数
 * @param cb 回调函数
 */
export function watch(source, cb) {
  return doWatch(source, cb);
}

/**
 * 执行 watch
 * @param source 响应式对象 | 函数
 * @param cb 回调函数
 */
function doWatch(source, cb) {
  let getter;

  if (isRef(source)) {
    // 是ref，读取ref的value
    getter = () => source.value;
  } else if (isReactive(source)) {
    // 是reactive，遍历读取reactive全部属性，触发依赖收集后再返回原值
    getter = () => traverse(source);
  } else if (isFunction(source)) {
    // 是函数，直接给getter使用即可
    getter = source;
  } else if (isArray(source)) {
    // 是数组，方法执行时考虑数组成员都是什么类型，来执行不同操作
    getter = () =>
      source.map(s => {
        if (isRef(s)) {
          // 是ref，取值
          return s.value;
        } else if (isReactive(s)) {
          // 是reactive，遍历触发依赖收集
          return traverse(s);
        } else if (isFunction(s)) {
          // 是函数，直接执行
          return s();
        } else {
          // 啥也不是，发出警告
          warn();
        }
      });
  } else {
    // 啥也不是，发出警告
    warn();
    return;
  }

  // 清理上一次的操作
  // 第一次执行watch的时候 不执行回调，第二次执行watch的时候，执行上一次传入的回调
  let cleanup;
  const onCleanup = fn => {
    // 将用户的回调保存起来
    cleanup = fn;
  }

  // 旧值
  let oldValue;
  // 当getter中的响应式变量变化后，执行该函数
  const job = () => {
    // 执行上一次的回调
    cleanup && cleanup();

    // 在执行回调前，再次执行run方法获取已变化后的新值
    const newValue = effect.run();
    // 执行回调，将新值和旧值传递过去
    cb && cb(newValue, oldValue, onCleanup);
    // 回调函数已执行，当前的新值已成为旧值
    oldValue = newValue;
  }

  // 监听getter，响应式对象变化后执行 job
  const effect = new ReactiveEffect(getter, job);
  // 先运行一次，获取旧值
  oldValue = effect.run();
}

/**
 * 遍历对象
 * @param value 要遍历的对象
 * @param set Set集合，用来防止循环引用
 * @returns 传递的 value
 */
export function traverse(value, seen = new Set()) {
  if (!isObject(value)) {
    // 不是对象，直接返回
    return value;
  }
  if (seen.has(value)) {
    // Set中已包含该对象，无需继续深入，返回即可
    return value;
  }
  // 将该对象放入Set集合，防止循环引用导致死循环
  seen.add(value);

  if (isRef(value)) {
    // 是ref，取出ref.value继续本操作
    traverse(value.value, seen);
  } else if (isArray(value)) {
    // 是数组，遍历属性
    for (let i = 0; i < value.length; i++) {
      traverse(value[i], seen);
    }
  } else {
    // 否则就是对象了（不考虑 Set 和 Map）
    for (let key in value) {
      // 取出所有属性，继续递归
      traverse(value[key], seen);
    }
  }
  // 最外层对象原封不动的返回
  return value;
}

/**
* 警告
*/
function warn() {
  console.warn('watch 监听的不是响应式对象，也不是函数，该监听无效，不会执行');
}