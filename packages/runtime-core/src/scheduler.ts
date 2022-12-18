/*
 * File: /src/scheduler.ts
 * Project: @vue/runtime-core
 * Created Date: 2022-12-18
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 调度
 * Description: 将任务放入队列，在 微任务 中消费队列中任务，就算用户重复修改再多次，我们只响应最后一次的变化结果
 */

// 队列
const queue = [];
// 是否正在刷新
let isFlushing = false;
// 定义一个完成状态的 Promise
const resolvePromise = Promise.resolve();

// 任务队列函数
export const queueJob = job => {
  // 如果没有这个任务再放入（响应式对象就算好多都更新，这里也只会放入一个）
  !queue.includes(job) && queue.push(job);
  // 冲洗队列
  queueFlush();
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