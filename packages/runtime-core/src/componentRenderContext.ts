/*
 * File: /src/componentRenderContext.ts
 * Project: @vue/runtime-core
 * Created Date: 2022-12-18
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 组件渲染上下文
 */

// 当前渲染的实例（嵌套的时候会记录上一个实例） 
export let currentRenderingInstance;

// 设置当前实例，返回父实例
export const setCurrentRenderingInstance = instance => {
  // 将上一个实例临时提出来
  const prev = currentRenderingInstance;
  // 将当前渲染实例设置为当前实例
  currentRenderingInstance = instance;
  // 返回上一个实例
  return prev;
}

