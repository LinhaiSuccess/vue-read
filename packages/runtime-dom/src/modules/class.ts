/*
 * File: /src/modules/class.ts
 * Project: @vue/runtime-dom
 * Created Date: 2022-10-15
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: class属性处理
 * Description: 浏览器元素class属性处理
 */

// class对比
export const patchClass = (el, nextValue) => {
  // 属性值存在则添加该class，否则移除
  nextValue ? el.className = nextValue : el.removeAttribute('class');
}