/*
 * File: /src/modules/attr.ts
 * Project: @vue/runtime-dom
 * Created Date: 2022-10-15
 * Author: lh(linhai<linhaibcf@gmail.com>)
 * Module Name: 属性对比
 * Description: 浏览器普通属性处理
 */

// 属性对比
export const patchAttr = (el, key, nextValue) => {
  // 如果属性值存在则设置属性值，否则就移除该属性
  nextValue ? el.setAttribute(key, nextValue) : el.removeAttribute(key);
}
