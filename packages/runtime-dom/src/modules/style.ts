/*
 * File: /src/modules/style.ts
 * Project: @vue/runtime-dom
 * Created Date: 2022-10-15
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 样式处理
 * Description: 浏览器样式处理
 */

// 样式对比
export const patchStyle = (el, prevValue, nextValue = {}) => {
  const { style } = el;

  // 将相同的样式直接替换成新样式
  for (const key in nextValue) {
    style[key] = nextValue[key];
  }

  if (prevValue) {
    // 如果上次有的样式，本次没有，则移除掉
    for (const key in prevValue) {
      if (nextValue[key] == null) {
        // 移除
        style[key] = null;
      }
    }
  }
}