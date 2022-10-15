/*
 * File: /src/modules/event.ts
 * Project: @vue/runtime-dom
 * Created Date: 2022-10-15
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 事件处理
 * Description: 
 *  浏览器元素事件处理
 *  频繁的绑定和移除事件会消耗性能，Vue对事件绑定做了优化
 *  对每个事件只绑定一个函数，当事件更换时不需要移除事件函数，只需替换函数的value即可
 * 
 */

import { isFunction } from '@vue/shared';

// 事件对比
export const patchEvent = (el, rawName, nextValue) => {
  // 记录元素上绑定了哪些事件
  let invokers = el._vei || (el._vei = {});
  // 该事件名是否绑定过
  const existingInvoker = invokers[rawName];

  if (nextValue && existingInvoker) {
    // 有新事件绑定，并且缓存中也有，直接将缓存中的value函数替换
    existingInvoker.value = nextValue;
  } else {
    // 初次绑定
    // 从第三个字母截取，并转换为小写，如：onClick -> click
    const domEventName = rawName.slice(2).toLowerCase();

    if (nextValue) {
      // 有新事件绑定，创建调用函数，并添加到缓存
      const invoker = (invokers[rawName] = createInvoker(nextValue));
      // 绑定事件
      el.addEventListener(domEventName, invoker);
    } else if (existingInvoker) {
      // 将上次的事件移除
      el.removeEventListener(domEventName, existingInvoker);
      // 从缓存中移除
      invokers[rawName] = undefined;
    }
  }
}

// 创建事件调用
export const createInvoker = initialValue => {
  // 创建函数
  const invoker = e => {
    if (isFunction(invoker.value)) {
      // 是函数，直接执行
      invoker.value(e)
    } else {
      // 同一个事件名绑定了多个函数，全部都执行
      invoker.value.forEach(inv => inv(e));
    }
  };

  // 给函数对象设置value
  invoker.value = initialValue;
  return invoker;
}