/*
 * File: /src/scheduler.ts
 * Project: @vue/runtime-core
 * Created Date: 2022-12-18
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 调度
 * Description: 将任务放入队列，在 微任务 中消费队列中任务，就算用户重复修改再多次，我们只响应最后一次的变化结果
 */

import { isArray } from "@vue/shared";

// 队列
const queue = [];
// 是否正在刷新
let isFlushing = false;
// 定义一个完成状态的 Promise
const resolvePromise = Promise.resolve();
// 等待刷新的回调列表
const pendingPostFlushCbs = [];
// 活动的回调列表
let activePostFlushCbs = null;
// 活动回调索引
let postFlushIndex = 0;

// 任务队列函数
export const queueJob = job => {
  // 如果没有这个任务再放入（响应式对象就算好多都更新，这里也只会放入一个）
  !queue.includes(job) && queue.push(job);
  // 冲洗队列
  queueFlush();
}

// 刷新队列回调
export const queuePostFlushCb = cb => queueCb(cb, activePostFlushCbs, pendingPostFlushCbs);

// 冲洗回调
export const flushPostFlushCbs = (seen?) => {
  if (pendingPostFlushCbs.length) {
    // 回调列表去重并复制一份
    const deduped = [...new Set(pendingPostFlushCbs)];
    // 清空回调列表，方便继续收集
    pendingPostFlushCbs.length = 0;

    if (activePostFlushCbs) {
      // activePostFlushCbs 中已有值，将复制的回调列表加入并返回
      activePostFlushCbs.push(...deduped);
      return;
    }

    // 到了这代表 activePostFlushCbs 是空的，直接将数组赋值过去就行
    activePostFlushCbs = deduped;
    // 收集的容器
    seen = seen || new Map();

    // 遍历活动回调列表，挨个执行
    for (postFlushIndex = 0; postFlushIndex < activePostFlushCbs.length; postFlushIndex++) {
      // 检查更新
      if (checkRecursiveUpdates(seen, activePostFlushCbs[postFlushIndex])) {
        continue;
      }
      // 执行回调
      activePostFlushCbs[postFlushIndex]();
    }
    // 重置活动列表和索引
    activePostFlushCbs = null;
    postFlushIndex = 0;
  }
}

// 检查更新
const checkRecursiveUpdates = (seen, fn) => {
  if (!seen.has(fn)) {
    // 不存，添加进去并设置初始值1
    seen.set(fn, 1);
  } else {
    // 已存在，获取个数后判断如果超过100则直接返回不再累加
    const count = seen.get(fn);
    if (count > 100) {
      return true;
    }
    // 更新计数
    seen.set(fn, count + 1);
  }
}

// 冲洗队列
const queueFlush = () => {
  // 如果没有在刷新，则执行逻辑
  if (!isFlushing) {
    // 批处理逻辑
    isFlushing = true;

    resolvePromise.then(() => {
      isFlushing = false;
      // 先拷贝一份，防止循环的时候数组内元素还在增多导致死循环（执行的时候会边执行边往里放）
      const tasks = queue.slice(0);
      // 先清空队列，再循环，循环过程中可能还会添加到这个队列
      queue.length = 0;
      // 执行队列中的每个任务
      tasks.forEach(task => task());
      // 清空队列
      tasks.length = 0;
    });
  }
}

// 将回调放入队列
const queueCb = (cb, activeQueue, pendingQueue) => {
  if (!isArray(cb)) {
    // 如果回调不是数组并且活动队列不包含当前回调则添加
    if (!activeQueue || !activeQueue.includes(cb)) {
      pendingQueue.push(cb)
    }
  } else {
    // 结构添加
    pendingQueue.push(...cb)
  }
  // 冲洗队列
  queueFlush();
}